export class ApiError extends Error {
  constructor(status, body) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// API URL and key come only from build-time environment variables
// (VITE_API_URL, VITE_API_KEY). No credentials are hardcoded in source.
const configuredApiUrl = (import.meta.env.VITE_API_URL || "")?.replace(/\/$/, "");
const BASE = configuredApiUrl || "/api";
const API_KEY = import.meta.env.VITE_API_KEY || "";

async function request(method, path, body) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined;
  return await res.json();
}

export const apiGet = (path) => request("GET", path);
export const apiPost = (path, body) => request("POST", path, body ?? null);
