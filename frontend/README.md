# Opti Advisr frontend

React 19 and Vite frontend for the Opti Advisr AWS cost console.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `API_BASE_URL` and `API_KEY` in `.env.local`.
3. Install dependencies and start Vite:

   ```powershell
   npm ci
   npm run dev
   ```

Open the local URL printed by Vite (normally `http://localhost:5173`).

The Vite development server proxies `/api` requests to API Gateway and adds
`API_KEY` server-side. The key is not included in the browser bundle. Do not
prefix it with `VITE_`.

The dashboard uses the existing `/costs`, `/resources`, and `/agent` API
routes. Views that the backend does not currently provide retain the supplied
demo data.

## Build

```powershell
npm run build
npm run preview
```

The development proxy is not included in the production build. A production
deployment needs a server-side API proxy or another authentication mechanism;
do not embed an API Gateway key in client-side environment variables.
