// Opti Advisr Worker: serves the static site and proxies /api/* calls to
// API Gateway, injecting the API key from the API_KEY secret so the key
// never ships in the browser bundle.
const API_ORIGIN = "https://inib931b1c.execute-api.ap-south-1.amazonaws.com/v1";

// Assets uploaded through the API can be stored with a generic content
// type, which makes browsers download pages instead of rendering them.
// Pin the correct type per extension on the way out.
const CONTENT_TYPES = {
  html: "text/html; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  json: "application/json; charset=utf-8",
};

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

    const response = await env.ASSETS.fetch(request);
    const segment = url.pathname.split("/").pop() || "";
    const ext = segment.includes(".")
      ? segment.split(".").pop().toLowerCase()
      : "html";
    const type = CONTENT_TYPES[ext];
    if (!type) return response;
    const fixed = new Response(response.body, response);
    fixed.headers.set("Content-Type", type);
    return fixed;
  },
};
