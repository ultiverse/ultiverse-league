const API_PREFIX = '/api/v1';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Get user email from session storage for authentication
  const email = sessionStorage.getItem('ultiverse_user_email');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add authentication header if email is available
  if (email) {
    headers['X-User-Email'] = email;
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    headers,
    ...init
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}
