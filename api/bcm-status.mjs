// Biblical Character Modeler — API connectivity diagnostic (no image generation)
// Runs only on Vercel's server, never exports secrets to browsers.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"}});
export function GET(){
  return json({
    service:"biblical-character-modeler",
    api:"diagnostic-v0.6.1",
    online:true,
    provider:"Google Gemini API",
    model:"gemini-3-pro-image",
    providerKeyConfigured:Boolean(process.env.GEMINI_API_KEY),
    studioAccessConfigured:Boolean(process.env.BCM_STUDIO_ACCESS_TOKEN),
    generationEnabled:false,
    message:"Diagnóstico somente. Nenhuma chamada de geração é executada."
  });
}
export default {fetch(request){if(request.method!=="GET")return json({error:"Método não permitido."},405);return GET();}};
