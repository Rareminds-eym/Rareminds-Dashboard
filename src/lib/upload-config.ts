// ponytail: Single source of truth for upload constraints (client & server)
export const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf'
] as const;

export type AllowedType = typeof ALLOWED_TYPES[number];

export const MAX_SIZE_MB = 100;
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
