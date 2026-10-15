// Biblical Character Modeler — public connectivity diagnostic only.
// No image generation, tokens, or secrets are returned by this route.
const ALLOWED_ORIGINS = new Set([
  "https://renanroveri.com.br",
  "https://www.renanroveri.com.br",
  "https://renanroveri7-max.github.io"
]);
function response(request, data, status = 200) {
  const origin = request.headers.get("origin") || "";
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
    "vary": "Origin",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "Accept, Content-Type"
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["access-control-allow-origin"] = origin;
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers });
}
export function OPTIONS(request) { return response(request, null, 204); }
export function GET(request) {
  return response(request, {
    service: "biblical-character-modeler",
    api: "diagnostic-v0.6.2",
    online: true,
    provider: "Google Gemini API",
    providerKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    studioAccessConfigured: Boolean(process.env.BCM_STUDIO_ACCESS_TOKEN),
    generationEnabled: false,
    deployment: "vercel-server",
    message: "Servidor online, sem chamadas pagas de imagem."
  });
}
export default {
  fetch(request) {
    if (request.method === "OPTIONS") return OPTIONS(request);
    if (request.method === "GET") return GET(request);
    return response(request, { error: "Método não permitido." }, 405);
  }
};
