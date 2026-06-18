import { AwsClient } from 'aws4fetch';

// Domains allowed to call this endpoint.
// Set ALLOWED_ORIGINS (comma-separated) in your env for multiple origins,
// or ALLOWED_ORIGIN for a single origin. No fallback — must be explicitly configured.

// Supported media types for upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

// 100 MB — supports video uploads while staying within Cloudflare Workers request body hard limit
const MAX_SIZE_BYTES = 100 * 1024 * 1024;

/**
 * @param {Request} request
 * @param {{ ALLOWED_ORIGIN?: string, ALLOWED_ORIGINS?: string }} env
 * @returns {{ 
 *   'Access-Control-Allow-Origin': string,
 *   'Access-Control-Allow-Methods': string,
 *   'Access-Control-Allow-Headers': string,
 *   'Vary': string
 * } | null}
 */
function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  let allowed = [];
  if (env.ALLOWED_ORIGINS) {
    allowed = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  } else if (env.ALLOWED_ORIGIN) {
    allowed = [env.ALLOWED_ORIGIN];
  }
  if (allowed.length === 0 || !allowed.includes(origin)) {
    return null;
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

/**
 * @param {{ request: Request, env: { R2_ACCESS_KEY: string, R2_SECRET_KEY: string, R2_ACCOUNT_ID: string, R2_BUCKET_NAME: string, R2_PUBLIC_URL: string, ALLOWED_ORIGIN?: string, ALLOWED_ORIGINS?: string } }} context
 * @returns {Promise<Response>}
 */
export async function onRequestPost({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  if (!corsHeaders) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: { 'Content-Type': 'application/json', 'Vary': 'Origin' } });
  }
  // corsHeaders is now guaranteed to be non-null for subsequent uses
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Invalid file upload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: `File type "${file.type}" is not allowed` }), {
        status: 415,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return new Response(JSON.stringify({ error: `File size exceeds the ${MAX_SIZE_BYTES / (1024 * 1024)} MB limit` }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const missingVars = ['R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']
      .filter(key => !env[key] || typeof env[key] !== 'string' || env[key].trim() === '');

    if (missingVars.length > 0) {
      return new Response(JSON.stringify({ error: `Server misconfiguration: missing ${missingVars.join(', ')}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const r2 = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY,
      secretAccessKey: env.R2_SECRET_KEY,
      service: 's3',
      region: 'auto',
    });

    // Use UUID + timestamp as the filename key — no original filename needed
    // This eliminates all path traversal risk and guarantees uniqueness
   const ext = file.name.includes('.')
  ? '.' + file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)
  : '';
    const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const uploadUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${filename}`;
    const arrayBuffer = await file.arrayBuffer();

    let uploadResponse;

    try {
      uploadResponse = await r2.fetch(uploadUrl, {
        method: 'PUT',
        body: arrayBuffer,
        headers: { 'Content-Type': file.type },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown storage error';
      return new Response(
        JSON.stringify({
          error: `Failed to reach storage: ${message}`,
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (!uploadResponse.ok) {
      return new Response(JSON.stringify({ error: `Storage rejected the upload (${uploadResponse.status})` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const publicUrl = `${env.R2_PUBLIC_URL}/${filename}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * @param {{ request: Request, env: { ALLOWED_ORIGIN?: string } }} context
 * @returns {Promise<Response>}
 */
export async function onRequestOptions({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  if (!corsHeaders) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { headers: corsHeaders });
}
