const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

interface ProblemDetails {
  title?: string;
  detail?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not set. Check mobile/MajstorHubApp/.env');
  }

  const { method = 'GET', body, token, signal } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    // Only a 401 on an *authenticated* request should force a logout.
    // A wrong-password 401 from /auth/login has no session to kill.
    if (res.status === 401 && token) {
      unauthorizedHandler?.();
    }
    const problem = data as ProblemDetails | undefined;
    const message = problem?.detail || problem?.title || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export const apiClient = {
  get: <T,>(path: string, token?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', token, signal }),
  post: <T,>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body, token }),
  put: <T,>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'PUT', body, token }),
  patch: <T,>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body, token }),
  delete: <T,>(path: string, token?: string | null) =>
    request<T>(path, { method: 'DELETE', token }),
};
