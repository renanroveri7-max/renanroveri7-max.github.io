const ALLOWED = new Set(["https://renanroveri.com.br","https://www.renanroveri.com.br","https://renanroveri7-max.github.io"]);
function respond(request, body, status=200){
 const origin=request.headers.get("origin")||"";
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","vary":"Origin","x-content-type-options":"nosniff","access-control-allow-methods":"GET, OPTIONS","access-control-allow-headers":"Accept, Content-Type"};
 if(ALLOWED.has(origin))headers["access-control-allow-origin"]=origin;
 return new Response(status===204?null:JSON.stringify(body),{status,headers});
}
export function OPTIONS(request){return respond(request,null,204);}
export function GET(request){
 return respond(request,{service:"biblical-character-modeler",api:"diagnostic-v0.6.4",online:true,backend:"dedicated-vercel-project",provider:"Google Gemini API",providerKeyConfigured:Boolean(process.env.GEMINI_API_KEY),studioAccessConfigured:Boolean(process.env.BCM_STUDIO_ACCESS_TOKEN),generationEnabled:false,message:"Conector de diagnóstico ativo. Geração bloqueada."});
}
export default {fetch(request){if(request.method==="OPTIONS")return OPTIONS(request);if(request.method==="GET")return GET(request);return respond(request,{error:"Method not allowed"},405);}};
