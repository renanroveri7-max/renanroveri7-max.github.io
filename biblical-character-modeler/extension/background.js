"use strict";
// Prova de conceito local: inspeção somente leitura de metadados estruturais da guia Flow.
// Não recolhe textos digitados, URLs privadas, nomes, imagens, credenciais ou chamadas de rede.
const ALLOWED_ORIGINS=new Set(["https://renanroveri.com.br","https://www.renanroveri.com.br"]);
const FLOW_PATTERN="https://flow.google.com/*";
const COMMANDS=new Set(["PING","FLOW_STATUS","FLOW_INSPECT","FLOW_MAP","FLOW_MEDIA_SCAN","OPEN_FLOW","PROMPT_PREFILL"]);

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
async function prefillPrompt(tabId,prompt){
 const results=await chrome.scripting.executeScript({
  target:{tabId},args:[prompt],
  func:async function(text){
   // Somente após clique explícito no site. Não toca no botão Gerar ou na conta.
   if(!location.pathname.startsWith("/project/"))return {ok:false,error:"Abra um projeto do Google Flow antes de preencher."};
   const visible=(el)=>{
    const b=el.getBoundingClientRect(),c=getComputedStyle(el);
    return b.width>20&&b.height>12&&b.bottom>0&&b.top<innerHeight&&c.display!=="none"&&c.visibility!=="hidden";
   };
   const editors=[...document.querySelectorAll('[contenteditable="true"]')].filter(el=>{
    if(!visible(el)||el.getAttribute("aria-disabled")==="true"||el.closest('[aria-disabled="true"]'))return false;
    const b=el.getBoundingClientRect(), x=(b.left+b.width/2)/innerWidth, y=(b.top+b.height/2)/innerHeight;
    const meta=[el.getAttribute("aria-label"),el.getAttribute("data-placeholder"),el.getAttribute("placeholder")].filter(Boolean).join(" ");
    return (y>.62&&x>.25&&x<.78)||/o que você quer criar|what.*creat|prompt/i.test(meta);
   });
   if(editors.length!==1)return {ok:false,error:"Não identifiquei um único campo seguro de prompt (encontrados: "+editors.length+"). Não modifiquei nada."};
   const editor=editors[0];
   if((editor.textContent||"").trim().length>0)return {ok:false,error:"O prompt do Flow já contém texto. Para evitar sobrescrever, esvazie manualmente esse campo antes do teste."};
   editor.focus();
   const selection=window.getSelection();
   const range=document.createRange();
   range.selectNodeContents(editor);range.collapse(false);
   selection.removeAllRanges();selection.addRange(range);
   const accepted=document.execCommand("insertText",false,text);
   // Não acionamos atalhos nem cliques de envio. Conferimos apenas o comprimento.
   await new Promise(resolve=>setTimeout(resolve,350));
   const normalize=value=>String(value||"").replace(/\s+/g," ").trim();
   const displayed=editor.innerText||editor.textContent||"";
   const equal=normalize(displayed)===normalize(text);
   if(!accepted||!equal)return {ok:false,error:"O editor não confirmou o preenchimento. Verifique visualmente o Flow; não houve tentativa de geração."};
   return {ok:true,prefilled:true,characters:text.length,flowTabOpen:true,automatedGenerationAvailable:false};
  }
 });
 return results?.[0]?.result||{ok:false,error:"O Flow não retornou confirmação do editor."};
}
async function scanMedia(tabId){
 const results=await chrome.scripting.executeScript({
  target:{tabId},
  func:()=>{
   if(!location.pathname.startsWith("/project/"))return {ok:false,error:"Abra um projeto do Flow para detectar resultados."};
   const candidates=[];
   const visible=(el)=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    if(r.width<120||r.height<100||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return false;
    return s.visibility!=="hidden"&&s.display!=="none"&&Number(s.opacity||1)>0;
   };
   const bucket=el=>{
    const r=el.getBoundingClientRect();
    const x=(r.left+r.width/2)/Math.max(1,innerWidth);
    const y=(r.top+r.height/2)/Math.max(1,innerHeight);
    return (y<.34?"topo":y<.67?"meio":"baixo")+"/"+(x<.33?"esquerda":x<.67?"centro":"direita");
   };
   for(const el of document.querySelectorAll("img,video,canvas")){
    if(!visible(el))continue;
    const r=el.getBoundingClientRect(),t=el.tagName.toLowerCase();
    const width=t==="img"?el.naturalWidth:t==="video"?el.videoWidth:el.width;
    const height=t==="img"?el.naturalHeight:t==="video"?el.videoHeight:el.height;
    const ref=t==="img"?el.currentSrc||el.src:t==="video"?el.currentSrc||el.poster:"";
    const source=typeof ref!=="string"?"nenhum":ref.startsWith("blob:")?"blob":ref.startsWith("data:")?"data":ref.startsWith("https:")?"https":ref.startsWith("http:")?"http":"outro";
    candidates.push({kind:t,location:bucket(el),displayWidth:Math.round(r.width),displayHeight:Math.round(r.height),
      intrinsicWidth:Number(width)||0,intrinsicHeight:Number(height)||0,sourceKind:source});
    if(candidates.length>=20)break;
   }
   let largeBackgrounds=0;
   const controls=[...document.querySelectorAll("div,section,article")];
   for(const el of controls.slice(0,1600)){
    if(!visible(el))continue;
    const bg=getComputedStyle(el).backgroundImage;
    if(bg&&bg!=="none"&&/^url\(/.test(bg))largeBackgrounds++;
    if(largeBackgrounds>=30)break;
   }
   return {ok:true,projectView:true,scanType:"metadata-only",
      counts:{largeMedia:candidates.length,largeBackgrounds,images:candidates.filter(x=>x.kind==="img").length,
        videos:candidates.filter(x=>x.kind==="video").length,canvases:candidates.filter(x=>x.kind==="canvas").length},
      candidates,automaticFileRetrievalConfirmed:false,automaticGenerationAvailable:false};
  }
 });
 return results?.[0]?.result||{ok:false,error:"O Chrome não retornou dados da guia."};
}
async function respond(type,request){
 if(type==="PING")return {ok:true,version:"0.4.0",capabilities:["detect_flow_tab","open_flow_tab","read_page_structure","map_composer_metadata","prefill_prompt_no_generation","scan_rendered_media_metadata"]};
 const tabs=await flowTabs();
 if(type==="OPEN_FLOW"){
  if(tabs.length){await chrome.tabs.update(tabs[0].id,{active:true});return {ok:true,openedExisting:true,flowTabOpen:true};}
  await chrome.tabs.create({url:"https://flow.google.com/"});return {ok:true,openedExisting:false,flowTabOpen:true};
 }
 if(type==="FLOW_STATUS")return {ok:true,flowTabOpen:tabs.length>0,flowTabCount:tabs.length};
 if(type==="PROMPT_PREFILL"){
  if(!tabs.length)return {ok:false,error:"Abra o Google Flow antes do preenchimento."};
  if(tabs.length!==1)return {ok:false,error:"Deixe somente uma guia do Google Flow aberta."};
  const prompt=request?.prompt;
  if(typeof prompt!=="string"||prompt.length<40||prompt.length>35000)return {ok:false,error:"Prompt inválido ou acima do limite de 35 mil caracteres."};
  return prefillPrompt(tabs[0].id,prompt);
 }
 if(type==="FLOW_MEDIA_SCAN"){
  if(tabs.length!==1)return {ok:false,error:"Abra apenas uma guia do Google Flow dentro de um projeto."};
  const media=await scanMedia(tabs[0].id);
  if(!media.ok)return media;
  return {ok:true,flowTabOpen:true,media};
 }
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
 respond(request.type,request).then(sendResponse).catch(err=>sendResponse({ok:false,error:"Falha de inspeção: "+String(err.message||err)}));
 return true;
});
