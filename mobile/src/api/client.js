import { API_URL, REQUEST_TIMEOUT_MS } from '../config';

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, err.name === 'AbortError'
      ? 'The server took too long to answer. It may be waking up — try again in a moment.'
      : "Couldn't reach the server. Check your internet connection.");
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 && auth && authToken && onUnauthorized) onUnauthorized();
    const details = Array.isArray(data?.details) ? data.details.map((d) => d.message).filter(Boolean).join(' ') : '';
    const message = details || (typeof data?.error === 'string' ? data.error : '') || `The server answered with an error (${res.status}).`;
    throw new ApiError(res.status, message);
  }
  return data;
}
