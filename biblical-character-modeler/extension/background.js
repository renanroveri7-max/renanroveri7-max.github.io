"use strict";
// Prova de conceito local: inspeção somente leitura de metadados estruturais da guia Flow.
// Não recolhe textos digitados, URLs privadas, nomes, imagens, credenciais ou chamadas de rede.
const ALLOWED_ORIGINS=new Set(["https://renanroveri.com.br","https://www.renanroveri.com.br"]);
const FLOW_PATTERN="https://flow.google.com/*";
const COMMANDS=new Set(["PING","FLOW_STATUS","FLOW_INSPECT","FLOW_MAP","OPEN_FLOW"]);

function trusted(sender){
 try{
  const u=new URL(sender.tab?.url||sender.url||"");
  return ALLOWED_ORIGINS.has(u.origin)&&u.pathname.startsWith("/biblical-character-modeler/");
 }catch{return false;}
}
async function flowTabs(){return chrome.tabs.query({url:FLOW_PATTERN});}
async function scan(tabId,kind){
 const results=await chrome.scripting.executeScript({
  target:{tabId},
  func:(mode)=>{
   // Inspeção encapsulada no Chrome. Nenhum valor de campo, texto ou URL da página é retornado.
   const isVisible=(el)=>{
    const r=el.getBoundingClientRect(),css=getComputedStyle(el);
    return r.width>3&&r.height>3&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&
      css.visibility!=="hidden"&&css.display!=="none"&&Number(css.opacity||1)>0;
   };
   const editorSelector='textarea,[contenteditable="true"],[role="textbox"],input:not([type="hidden"]):not([type="password"])';
   const editors=[...new Set([...document.querySelectorAll(editorSelector)])];
   const base={
    documentReady:document.readyState,
    projectView:location.pathname.startsWith("/project/"),
    imageElements:document.querySelectorAll("img").length,
    canvasElements:document.querySelectorAll("canvas").length,
    editableElements:document.querySelectorAll('textarea,[contenteditable="true"]').length
   };
   if(mode!=="FLOW_MAP")return base;
   const sanitize=(str)=>(typeof str==="string"?str.slice(0,120):"");
   const category=(el)=>{
    const str=sanitize(el.getAttribute("aria-label"))+" "+sanitize(el.getAttribute("placeholder"))+" "+sanitize(el.getAttribute("title"));
    if(/password|senha|email|e-mail|login|entrar|conta/i.test(str))return "privado-ignorado";
    if(/prompt|descrev|o que você quer|what.*creat|image prompt|criar|escrev/i.test(str))return "possivel-prompt";
    if(/pesquis|search|busca|procur/i.test(str))return "busca";
    return "nao-identificado";
   };
   const locationBucket=(el)=>{
    const r=el.getBoundingClientRect();
    const x=(r.left+r.width/2)/Math.max(1,innerWidth),y=(r.top+r.height/2)/Math.max(1,innerHeight);
    return (y<.34?"superior":y<.68?"central":"inferior")+"-"+(x<.34?"esquerda":x<.67?"centro":"direita");
   };
   // Nunca coletar o valor, o texto, o DOM, o seletor, os atributos privados ou URLs de mídia.
   const visibleEditors=editors.filter(isVisible).slice(0,12).map(el=>({
    kind:el.tagName.toLowerCase(),role:el.getAttribute("role")==="textbox"?"textbox":"campo",
    contentEditable:!!el.isContentEditable,
    hint:category(el),location:locationBucket(el),
    disabled:!!el.disabled||el.getAttribute("aria-disabled")==="true"
   }));
   const visibleButtons=[...new Set([...document.querySelectorAll("button,[role='button'],input[type='submit']")])]
     .filter(isVisible).filter(el=>{
       const r=el.getBoundingClientRect();
       return (r.top+r.height/2)/Math.max(1,innerHeight)>.61;
     }).slice(0,24);
   const controlStats={bottomButtons:visibleButtons.length,disabledButtons:visibleButtons.filter(el=>el.disabled||el.getAttribute("aria-disabled")==="true").length};
   const possibleSend=visibleButtons.filter(el=>{
     const label=[el.getAttribute("aria-label"),el.getAttribute("title"),el.getAttribute("data-testid")].filter(Boolean).join(" ").slice(0,200);
     return /generat|gerar|enviar|submit|send|create|criar/i.test(label);
   }).length;
   return {...base,visibleEditorCount:visibleEditors.length,editors:visibleEditors,
     controlStats:{...controlStats,possiblyGenerateButtons:possibleSend},
     // Não comprova integração ou permissão de automação
     actionsAvailable:false,inspectionMode:"metadata-only"};
  },
  args:[kind]
 });
 return results?.[0]?.result||null;
}
async function respond(type){
 if(type==="PING")return {ok:true,version:"0.2.0",capabilities:["detect_flow_tab","open_flow_tab","read_page_structure","map_composer_metadata"]};
 const tabs=await flowTabs();
 if(type==="OPEN_FLOW"){
  if(tabs.length){await chrome.tabs.update(tabs[0].id,{active:true});return {ok:true,openedExisting:true,flowTabOpen:true};}
  await chrome.tabs.create({url:"https://flow.google.com/"});return {ok:true,openedExisting:false,flowTabOpen:true};
 }
 if(type==="FLOW_STATUS")return {ok:true,flowTabOpen:tabs.length>0,flowTabCount:tabs.length};
 if(type==="FLOW_INSPECT"||type==="FLOW_MAP"){
  if(!tabs.length)return {ok:false,error:"Nenhuma guia do Google Flow aberta. Abra o Flow e entre no projeto."};
  if(tabs.length>1)return {ok:false,error:"Mais de uma guia do Google Flow aberta. Feche as extras antes de inspecionar."};
  const result=await scan(tabs[0].id,type);
  if(!result)return {ok:false,error:"O Chrome não permitiu inspecionar esta guia do Flow."};
  return {ok:true,flowTabOpen:true,structure:result,automatedGenerationAvailable:false};
 }
 return {ok:false,error:"Ação desconhecida."};
}
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
 if(!trusted(sender)){sendResponse({ok:false,error:"Origem não autorizada."});return false;}
 if(!request||!COMMANDS.has(request.type)){sendResponse({ok:false,error:"Ação não permitida."});return false;}
 respond(request.type).then(sendResponse).catch(err=>sendResponse({ok:false,error:"Falha de inspeção: "+String(err.message||err)}));
 return true;
});
