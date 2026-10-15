"use strict";
(() => {
  const ALLOWED_ORIGINS=new Set(["https://renanroveri.com.br","https://www.renanroveri.com.br"]);
  if(!ALLOWED_ORIGINS.has(location.origin)||!location.pathname.startsWith("/biblical-character-modeler/"))return;
  window.addEventListener("message",event=>{
    if(event.source!==window||event.origin!==location.origin)return;
    const data=event.data;
    if(!data||data.sender!=="bcm-site"||data.target!=="flow-bridge")return;
    if(typeof data.nonce!=="string"||!/^bcm-[a-z0-9-]{8,80}$/i.test(data.nonce))return;
    if(!["PING","FLOW_STATUS","FLOW_INSPECT","FLOW_MAP","OPEN_FLOW"].includes(data.type))return;
    chrome.runtime.sendMessage({type:data.type},response=>{
      const problem=chrome.runtime.lastError?.message;
      const result=problem?{ok:false,error:"Falha de comunicação com a extensão."}:response||{ok:false,error:"Sem resposta da extensão."};
      window.postMessage({sender:"bcm-flow-extension",target:"bcm-site",nonce:data.nonce,result},location.origin);
    });
  });
})();
