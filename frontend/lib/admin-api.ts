const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function adminFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
  });
}

export async function adminFetchJson<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await adminFetch(path, options);
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }
  return res.json();
}
