import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    RETURN_TRUSTED_TYPE: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  }) as string;
}
