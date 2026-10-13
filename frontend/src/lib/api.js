export class ApiError extends Error {
  constructor(status, body) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const DEFAULT_API_URL = "https://inib931b1c.execute-api.ap-south-1.amazonaws.com/v1";
const DEFAULT_API_KEY = "oYQslEeolb4oly9qw1sKo4tTT6owJZl5695SGk0Y";

const configuredApiUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.API_BASE_URL ||
  DEFAULT_API_URL
)?.replace(/\/$/, "");
const BASE = configuredApiUrl;
const API_KEY =
  import.meta.env.VITE_API_KEY ||
  import.meta.env.API_KEY ||
  DEFAULT_API_KEY;

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
export const apiPut = (path, body) => request("PUT", path, body ?? null);
export const apiPatch = (path, body) => request("PATCH", path, body ?? null);
export const apiDelete = (path) => request("DELETE", path);
