import { AwsClient } from 'aws4fetch';

// Domains allowed to call this endpoint.
// Set ALLOWED_ORIGIN in your Cloudflare Pages environment variables for production.
// Falls back to localhost for local dev.
const ALLOWED_ORIGINS = [
  'https://rareminds.in',
  'http://localhost:5173',
  'http://localhost:3000',
];

/**
 * @param {Request} request
 * @param {{ ALLOWED_ORIGIN?: string }} env
 * @returns {Record<string, string>}
 */
function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGIN
    ? [env.ALLOWED_ORIGIN]
    : ALLOWED_ORIGINS;
  const allowedOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

/**
 * @param {{ request: Request, env: { R2_ACCESS_KEY: string, R2_SECRET_KEY: string, R2_ACCOUNT_ID: string, R2_BUCKET_NAME: string, R2_PUBLIC_URL: string, ALLOWED_ORIGIN?: string } }} context
 * @returns {Promise<Response>}
 */
export async function onRequestPost({ request, env }) {
  const corsHeaders = getCorsHeaders(request, env);
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB (increased for video)

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

    const r2 = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY,
      secretAccessKey: env.R2_SECRET_KEY,
      service: 's3',
      region: 'auto',
    });

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const uploadUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${filename}`;
    const arrayBuffer = await file.arrayBuffer();

    await r2.fetch(uploadUrl, {
      method: 'PUT',
      body: arrayBuffer,
      headers: { 'Content-Type': file.type },
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${filename}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Upload handler error:', err);
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
  return new Response(null, { headers: corsHeaders });
}
