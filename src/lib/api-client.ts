// Thin fetch wrapper every data hook goes through, so page/panel components
// never call `fetch('/api/...')` themselves. Auth is handled by the session
// cookie (sent automatically, same-origin) and verified server-side by
// middleware — no client headers to attach here.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

async function request<T>(path: string, init?: RequestInit, fallbackError = 'Request failed'): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res, fallbackError), res.status);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, fallbackError?: string) => request<T>(path, undefined, fallbackError),

  post: <T>(path: string, body?: unknown, fallbackError?: string) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }, fallbackError),

  put: <T>(path: string, body?: unknown, fallbackError?: string) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }, fallbackError),

  patch: <T>(path: string, body?: unknown, fallbackError?: string) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }, fallbackError),

  delete: <T>(path: string, fallbackError?: string) => request<T>(path, { method: 'DELETE' }, fallbackError),
};
