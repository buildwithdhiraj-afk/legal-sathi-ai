export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

export const apiUrl = (path: string) =>
  `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
