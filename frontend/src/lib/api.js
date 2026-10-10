export class ApiError extends Error {
  constructor(status, body) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const configuredApiUrl = (import.meta.env.VITE_API_URL || "")?.replace(/\/$/, "");
const BASE = configuredApiUrl || "/api";
const API_KEY = import.meta.env.VITE_API_KEY || "opti-advisr-demo";

async function request(method, path, body) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "x-api-key": API_KEY,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new ApiError(res.status, errBody);
    }

    if (res.status === 204) return undefined;
    return await res.json();
  } catch (err) {
    // Return null or reject to allow graceful fallback to demo mock data
    throw err;
  }
}

export const apiGet = (path) => request("GET", path);
export const apiPost = (path, body) => request("POST", path, body ?? null);
export const apiPut = (path, body) => request("PUT", path, body ?? null);
export const apiPatch = (path, body) => request("PATCH", path, body ?? null);
export const apiDelete = (path) => request("DELETE", path);
