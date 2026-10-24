export function userObjectName(username: string, ...segments: string[]): string {
  const safeUsername = sanitizePathSegment(username);
  return [safeUsername, ...segments.map(sanitizePathSegment)].join('/');
}

function sanitizePathSegment(value: string): string {
  return value.trim().replace(/[^\p{L}\p{N}._-]+/gu, '_') || '_';
}
