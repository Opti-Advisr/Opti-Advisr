// Opti Advisr Worker: serves the static site and proxies /api/* calls to
// API Gateway, injecting the API key from the API_KEY secret so the key
// never ships in the browser bundle.
const API_ORIGIN = "https://inib931b1c.execute-api.ap-south-1.amazonaws.com/v1";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (!env.API_KEY) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "API key is not configured on the server",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      const target = API_ORIGIN + url.pathname.slice(4) + url.search;
      const headers = new Headers(request.headers);
      headers.set("x-api-key", env.API_KEY);
      headers.delete("host");
      const init = { method: request.method, headers, redirect: "manual" };
      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = request.body;
        init.duplex = "half";
      }
      return fetch(target, init);
    }

    return env.ASSETS.fetch(request);
  },
};
