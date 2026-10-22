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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
 * Accepts file in request body, uploads to R2 through the R2 binding
 * (bucket rareminds-media, see wrangler.toml), returns public URL
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

    const missingVars = checkEnvVars(env, ['R2_PUBLIC_URL']);
    if (missingVars.length > 0) {
      return errorResponse(`Server misconfiguration: missing ${missingVars.join(', ')}`, 500, corsHeaders);
    }

    if (!env.R2) {
      return errorResponse('Server misconfiguration: R2 binding is not configured', 500, corsHeaders);
    }

    // Generate unique key with optional folder prefix
    const ext = getFileExtension(filename);
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const key = folder ? `${folder}/${uniqueName}` : uniqueName;

    await env.R2.put(key, await request.arrayBuffer(), {
      httpMetadata: { contentType },
    });

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

export async function onRequestOptions({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  if (!corsHeaders) return new Response(null, { status: 403 });
  return new Response(null, { headers: corsHeaders });
}
