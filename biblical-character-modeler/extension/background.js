"use strict";
// Prova de conceito: apenas detecção e inspeção estrutural autorizada da guia Flow.
// Não acessa cookies, tokens, pedidos privados, imagens, credenciais ou créditos.
const ALLOWED_ORIGINS = new Set([
  "https://renanroveri.com.br",
  "https://www.renanroveri.com.br"
]);
const FLOW_PATTERN = "https://flow.google.com/*";
function trusted(sender) {
  try {
    const u = new URL(sender.tab?.url || sender.url || "");
    return ALLOWED_ORIGINS.has(u.origin) && u.pathname.startsWith("/biblical-character-modeler/");
  } catch { return false; }
}
async function flowTabs() {
  return await chrome.tabs.query({url: FLOW_PATTERN});
}
async function respond(type) {
  if (type === "PING") return {ok:true,version:"0.1.0",capabilities:["detect_flow_tab","open_flow_tab","read_page_structure"]};
  if (type === "OPEN_FLOW") {
    const tabs = await flowTabs();
    if (tabs.length) {
      await chrome.tabs.update(tabs[0].id,{active:true});
      return {ok:true,openedExisting:true,flowTabOpen:true};
    }
    await chrome.tabs.create({url:"https://flow.google.com/"});
    return {ok:true,openedExisting:false,flowTabOpen:true};
  }
  const tabs=await flowTabs();
  if (type==="FLOW_STATUS") return {ok:true,flowTabOpen:tabs.length>0,flowTabCount:tabs.length};
  if (type==="FLOW_INSPECT") {
    if (!tabs.length) return {ok:false,error:"Nenhuma guia do Google Flow aberta. Abra o Flow e entre com sua conta."};
    const results=await chrome.scripting.executeScript({
      target:{tabId:tabs[0].id},
      func:()=>{
        // Somente contagens estruturais. Nenhum dado da conta ou imagem é recolhido.
        return {
          documentReady:document.readyState,
          imageElements:document.querySelectorAll("img").length,
          canvasElements:document.querySelectorAll("canvas").length,
          editableElements:document.querySelectorAll('textarea,[contenteditable="true"]').length
        };
      }
    });
    const info=results?.[0]?.result;
    if(!info) return {ok:false,error:"A guia Flow não permitiu inspeção estrutural nesta versão."};
    return {ok:true,flowTabOpen:true,structure:info,automatedGenerationAvailable:false};
  }
  return {ok:false,error:"Ação desconhecida."};
}
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
  if (!trusted(sender)) {sendResponse({ok:false,error:"Origem do aplicativo não autorizada."});return false;}
  if (!request || !["PING","FLOW_STATUS","FLOW_INSPECT","OPEN_FLOW"].includes(request.type)){
    sendResponse({ok:false,error:"Ação não permitida."});return false;
  }
  respond(request.type).then(sendResponse).catch(err=>sendResponse({ok:false,error:"Falha na extensão: "+String(err.message||err)}));
  return true;
});
