(function(g){
"use strict";
// Diagnostics only — never issues generation commands and never reads field contents.
const state={connected:false,testing:false,flowOpen:null,details:null,map:null,media:null,previousMedia:null,mediaScans:0,error:"",version:""};
const pending=new Map();
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function request(type,prompt){
 return new Promise((resolve,reject)=>{
  const nonce="bcm-"+crypto.randomUUID();
  const timeout=setTimeout(()=>{pending.delete(nonce);reject(Error("A extensão não respondeu. Instale/recarregue a versão 0.3.0 e atualize a página."));},type==="PROMPT_PREFILL"?12000:7000);
  pending.set(nonce,{resolve,reject,timeout});
  g.postMessage({sender:"bcm-site",target:"flow-bridge",type,nonce,prompt:type==="PROMPT_PREFILL"?prompt:undefined},g.location.origin);
 });
}
g.addEventListener("message",event=>{
 if(event.source!==g||event.origin!==g.location.origin)return;
 const data=event.data;
 if(!data||data.sender!=="bcm-flow-extension"||data.target!=="bcm-site")return;
 const item=pending.get(data.nonce);if(!item)return;
 clearTimeout(item.timeout);pending.delete(data.nonce);
 if(!data.result||data.result.ok!==true)item.reject(Error(data.result?.error||"Resposta inválida da extensão."));
 else item.resolve(data.result);
});
function mapHtml(){
 const m=state.map;
 if(!m)return "";
 const eds=Array.isArray(m.editors)?m.editors:[];
 return '<div class="flow-bridge-map"><h3>MAPEAMENTO DO COMPOSITOR — SOMENTE LEITURA</h3>'+
 '<p>Projeto aberto: <b>'+(m.projectView?'Sim':'Não')+'</b> · Campos visíveis: <b>'+Number(m.visibleEditorCount||0)+'</b> · Controles inferiores: <b>'+Number(m.controlStats?.bottomButtons||0)+'</b> · Possíveis botões de envio: <b>'+Number(m.controlStats?.possiblyGenerateButtons||0)+'</b></p>'+
 (eds.length?eds.map((e,i)=>'<div class="flow-map-field"><strong>Campo '+(i+1)+'</strong><span>'+esc(e.kind)+' · '+esc(e.location)+' · '+esc(e.hint)+' · '+(e.contentEditable?'editável por conteúdo':'campo de entrada')+'</span></div>').join(""):'<p>Nenhum campo de entrada visível.</p>')+
 '<small>Não coletamos texto digitado, URLs de projetos, imagens, dados de conta nem cookies. Detectar botões não comprova capacidade de geração.</small></div>';
}
function mediaHtml(){
 const m=state.media;
 if(!m)return "";
 const c=m.counts||{},a=Array.isArray(m.candidates)?m.candidates:[];
 const prev=state.previousMedia?.counts?.largeMedia;
 const comparison=prev===undefined?"Primeiro diagnóstico (referência inicial).":"Diferença em relação à leitura anterior: "+((Number(c.largeMedia||0)-prev)>0?"+":"")+(Number(c.largeMedia||0)-prev)+" elementos de mídia grandes.";
 return '<div class="flow-bridge-map"><h3>DIAGNÓSTICO VISUAL DE RESULTADOS (SEM BAIXAR)</h3>'+
 '<p>Leitura '+state.mediaScans+' · '+Number(c.largeMedia||0)+' mídias grandes visíveis ('+Number(c.images||0)+' imagens, '+Number(c.videos||0)+' vídeos, '+Number(c.canvases||0)+' canvas). Fundos de imagem grandes: '+Number(c.largeBackgrounds||0)+'.</p>'+
 '<p><b>'+esc(comparison)+'</b></p>'+
 (a.length?a.slice(0,12).map((v,i)=>'<div class="flow-map-field"><strong>Mídia '+(i+1)+'</strong><span>'+
 esc(v.kind)+' · '+esc(v.location)+' · exibida '+Number(v.displayWidth)+' × '+Number(v.displayHeight)+
 ' · resolução identificada '+Number(v.intrinsicWidth)+' × '+Number(v.intrinsicHeight)+' · fonte '+esc(v.sourceKind)+'</span></div>').join(""):'<p>Não encontrei mídias grandes na área visível. Isso é normal antes da geração.</p>')+
 '<small>Apenas dimensões e categorias são analisadas; nenhum endereço de imagem, imagem original ou conteúdo de prompt é coletado. Se uma imagem for detectada, isso NÃO comprova que seja possível baixar o arquivo original automaticamente.</small></div>';
}
function panel(){
 const status=state.testing?'<span class="flow-status manual">VERIFICANDO...</span>':state.connected?'<span class="flow-status ok">EXTENSÃO DETECTADA</span>':'<span class="flow-status blocked">EXTENSÃO NÃO VERIFICADA</span>';
 const flow=state.flowOpen===null?"Ainda não verificado":state.flowOpen?"Guia do Flow detectada":"Nenhuma guia do Flow aberta";
 const desc=state.details?'Estrutura da guia: documento '+esc(state.details.documentReady)+
 ', '+Number(state.details.imageElements||0)+' elementos de imagem, '+
 Number(state.details.canvasElements||0)+' canvas e '+
 Number(state.details.editableElements||0)+' campos editáveis.':"Nenhuma estrutura foi inspecionada.";
 const actions=[["PING","TESTAR EXTENSÃO",true],["FLOW_STATUS","DETECTAR FLOW",false],["OPEN_FLOW","ABRIR / FOCAR FLOW",false],["FLOW_INSPECT","INSPECIONAR FLOW",false],["FLOW_MAP","MAPEAR COMPOSITOR",false],["FLOW_MEDIA_SCAN","MAPEAR IMAGENS",false]];
 const buttons=actions.map(a=>'<button class="btn '+(a[2]?'':'btn-gray')+'" data-bridge-action="'+a[0]+'" '+(state.testing?'disabled':'')+'>'+a[1]+'</button>').join("");
 return '<section class="flow-bridge-panel" id="flow-bridge-panel"><div class="flow-bridge-head"><div><h2>CONEXÃO COM GOOGLE FLOW — TESTE DA EXTENSÃO</h2><p>Inspeciona somente a estrutura de um projeto Flow aberto no Chrome, sem ler conteúdo digitado e sem gerar imagens.</p></div>'+status+'</div>'+
 '<div class="flow-bridge-buttons">'+buttons+'</div>'+
 (state.error?'<p class="flow-bridge-error">⚠ '+esc(state.error)+'</p>':'')+
 '<div class="flow-bridge-stats"><p><b>Comunicação local:</b> '+(state.connected?'Ativa · Extensão v'+esc(state.version):'Não confirmada')+'</p><p><b>Guia Google Flow:</b> '+flow+'</p><p><b>Inspeção estrutural:</b> '+desc+'</p></div>'+
 mapHtml()+mediaHtml()+
 '<p class="flow-bridge-disclaimer"><b>Importante:</b> detectar controles não confirma que podemos executar geração automática com o plano Ultra. Nenhum dado da conta é coletado e não utilizamos endpoints privados ou créditos.</p>'+
 '<p class="flow-bridge-install"><b>Instalação:</b> extraia a nova extensão, acesse <code>chrome://extensions</code>, desative a versão antiga e use <b>Carregar sem compactação</b> na pasta da versão 0.4.0. <a href="./download-extension.html" target="_blank" rel="noopener noreferrer"><b>BAIXAR EXTENSÃO v0.4.0 ↗</b></a> · <a href="https://github.com/renanroveri7-max/renanroveri7-max.github.io/tree/main/biblical-character-modeler/extension" target="_blank" rel="noopener noreferrer">Ver código no GitHub ↗</a></p></section>';
}
function draw(){const node=g.document.getElementById("bcm-bridge-placeholder");if(node)node.innerHTML=panel();}
async function run(type){
 if(state.testing)return;
 state.testing=true;state.error="";draw();
 try{
  const res=await request(type);state.connected=true;
  if(type==="PING")state.version=res.version||"não informada";
  if(["FLOW_STATUS","OPEN_FLOW","FLOW_INSPECT","FLOW_MAP","FLOW_MEDIA_SCAN"].includes(type))state.flowOpen=!!res.flowTabOpen;
  if(type==="FLOW_INSPECT"||type==="FLOW_MAP")state.details=res.structure||null;
  if(type==="FLOW_MAP")state.map=res.structure||null;
  if(type==="FLOW_MEDIA_SCAN"){state.previousMedia=state.media;state.media=res.media||null;state.mediaScans++;}
 }catch(e){state.error=String(e.message||e);if(type==="PING")state.connected=false;}
 finally{state.testing=false;draw();}
}
g.document.addEventListener("click",e=>{
 const btn=e.target.closest("[data-bridge-action]");if(!btn)return;
 const type=btn.dataset.bridgeAction;
 if(["PING","FLOW_STATUS","OPEN_FLOW","FLOW_INSPECT","FLOW_MAP","FLOW_MEDIA_SCAN"].includes(type))run(type);
});
async function prefill(prompt){
 if(typeof prompt!=="string"||prompt.trim().length<40)throw Error("O prompt técnico ainda não está pronto.");
 if(prompt.length>35000)throw Error("Prompt acima do limite do teste (35.000 caracteres).");
 if(!state.connected||state.version!=="0.4.0")throw Error("Extensão v0.4.0 não detectada. Instale a versão nova e clique em TESTAR EXTENSÃO.");
 return request("PROMPT_PREFILL",prompt);
}
g.BCMBridge={draw,run,prefill,version:"0.4.0"};
})(window);
