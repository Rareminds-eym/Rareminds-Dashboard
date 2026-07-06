import { AwsClient } from 'aws4fetch';

// ponytail: Worker proxies upload to avoid CORS issues with presigned URLs
// KEEP IN SYNC with src/lib/upload-config.ts (Worker can't import TS modules)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  let allowed = [];
  if (env.ALLOWED_ORIGINS) {
    allowed = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  } else if (env.ALLOWED_ORIGIN) {
    allowed = [env.ALLOWED_ORIGIN];
  }
  if (allowed.length === 0 || !allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

// ponytail: DRY helper for all error responses
function errorResponse(message, status, corsHeaders) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...(corsHeaders || { 'Vary': 'Origin' }) }
  });
}

// ponytail: DRY helper for env var validation
function checkEnvVars(env, requiredVars) {
  return requiredVars.filter(key => !env[key] || typeof env[key] !== 'string' || env[key].trim() === '');
}

// ponytail: DRY helper for filename sanitization
function getFileExtension(filename) {
  return filename.includes('.')
    ? '.' + filename.split('.').pop().toLowerCase().slice(0, 10).replace(/[^a-z0-9]/g, '')
    : '';
}

// ponytail: DRY helper for error extraction
function getErrorMessage(err) {
  return err instanceof Error ? err.message : 'An unexpected error occurred';
}

/**
 * POST /upload
 * Accepts file in request body, uploads to R2, returns public URL
 */
export async function onRequestPost({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  if (!corsHeaders) return errorResponse('Origin not allowed', 403);

  try {
    const contentType = request.headers.get('Content-Type') || '';
    const contentLength = parseInt(request.headers.get('Content-Length') || '0');

    if (!ALLOWED_TYPES.includes(contentType)) {
      return errorResponse(`File type "${contentType}" not allowed`, 415, corsHeaders);
    }

    if (contentLength > MAX_SIZE) {
      return errorResponse(`File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`, 413, corsHeaders);
    }

    const url = new URL(request.url);
    const filename = url.searchParams.get('filename') || 'file';
    const folder = url.searchParams.get('folder') || '';

    const missingVars = checkEnvVars(env, ['R2_BUCKET_NAME', 'R2_PUBLIC_URL']);
    if (missingVars.length > 0) {
      return errorResponse(`Server misconfiguration: missing ${missingVars.join(', ')}`, 500, corsHeaders);
    }

    // Generate unique key with optional folder prefix
    const ext = getFileExtension(filename);
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const key = folder ? `${folder}/${uniqueName}` : uniqueName;

    // Read the request body once (can't be read multiple times)
    const fileData = await request.arrayBuffer();

    // Try R2 binding first (production), fallback to S3 API (dev)
    const bucket = env.R2;
    if (bucket) {
      // Production: use R2 binding
      console.log('Using R2 binding to upload:', key);
      await bucket.put(key, fileData, {
        httpMetadata: {
          contentType: contentType,
        },
      });
    } else {
      // Development: use S3-compatible API with credentials
      console.log('Using S3 API to upload:', key);
      const missingS3Vars = checkEnvVars(env, ['R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_ACCOUNT_ID']);
      if (missingS3Vars.length > 0) {
        return errorResponse(`Server misconfiguration for dev: missing ${missingS3Vars.join(', ')}`, 500, corsHeaders);
      }

      // Use aws4fetch to sign and upload
      const aws = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY,
        secretAccessKey: env.R2_SECRET_KEY,
        service: 's3',
        region: 'auto',
      });

      const uploadUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`;
      
      try {
        // aws4fetch automatically signs the request
        const uploadResponse = await aws.fetch(uploadUrl, {
          method: 'PUT',
          body: fileData,
          headers: { 
            'Content-Type': contentType,
          },
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('R2 upload failed:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorText,
            url: uploadUrl,
            key: key,
          });
          throw new Error(`R2 upload failed (${uploadResponse.status}): ${errorText}`);
        }
        
        console.log('Upload successful:', key);
      } catch (uploadError) {
        console.error('Upload exception:', uploadError);
        throw uploadError;
      }
    }

    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return new Response(JSON.stringify({ url: publicUrl, key }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Upload error:', getErrorMessage(err));
    return errorResponse(getErrorMessage(err), 500, corsHeaders);
  }
}

/**
 * GET /upload?filename=x.jpg&type=image/jpeg
 * Returns presigned PUT URL for direct browser → R2 upload (legacy, kept for compatibility)
 */
export async function onRequestGet({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  if (!corsHeaders) return errorResponse('Origin not allowed', 403);

  try {
    const url = new URL(request.url);
    const filename = url.searchParams.get('filename');
    const type = url.searchParams.get('type');

    if (!filename || !type) {
      return errorResponse('Missing filename or type parameter', 400, corsHeaders);
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return errorResponse(`File type "${type}" not allowed`, 415, corsHeaders);
    }

    const missingVars = checkEnvVars(env, ['R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']);
    if (missingVars.length > 0) {
      return errorResponse(`Server misconfiguration: missing ${missingVars.join(', ')}`, 500, corsHeaders);
    }

    const r2 = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY,
      secretAccessKey: env.R2_SECRET_KEY,
      service: 's3',
      region: 'auto',
    });

    const ext = getFileExtension(filename);
    const key = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const uploadUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`;

    const signedUrl = await r2.sign(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': type },
      aws: { signQuery: true, datetime: new Date().toISOString() },
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    return new Response(JSON.stringify({ uploadUrl: signedUrl.url, publicUrl, key }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return errorResponse(getErrorMessage(err), 500, corsHeaders);
  }
}

export async function onRequestOptions({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  if (!corsHeaders) return new Response(null, { status: 403 });
  return new Response(null, { headers: corsHeaders });
}
