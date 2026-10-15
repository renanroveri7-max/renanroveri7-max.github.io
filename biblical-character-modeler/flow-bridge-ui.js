(function(g){
"use strict";
// Diagnostics only — never issues generation commands and never reads field contents.
const state={connected:false,testing:false,flowOpen:null,details:null,map:null,error:"",version:""};
const pending=new Map();
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function request(type){
 return new Promise((resolve,reject)=>{
  const nonce="bcm-"+crypto.randomUUID();
  const timeout=setTimeout(()=>{pending.delete(nonce);reject(Error("A extensão não respondeu. Instale/recarregue a versão 0.2.0 e atualize a página."));},7000);
  pending.set(nonce,{resolve,reject,timeout});
  g.postMessage({sender:"bcm-site",target:"flow-bridge",type,nonce},g.location.origin);
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
function panel(){
 const status=state.testing?'<span class="flow-status manual">VERIFICANDO...</span>':state.connected?'<span class="flow-status ok">EXTENSÃO DETECTADA</span>':'<span class="flow-status blocked">EXTENSÃO NÃO VERIFICADA</span>';
 const flow=state.flowOpen===null?"Ainda não verificado":state.flowOpen?"Guia do Flow detectada":"Nenhuma guia do Flow aberta";
 const desc=state.details?'Estrutura da guia: documento '+esc(state.details.documentReady)+
 ', '+Number(state.details.imageElements||0)+' elementos de imagem, '+
 Number(state.details.canvasElements||0)+' canvas e '+
 Number(state.details.editableElements||0)+' campos editáveis.':"Nenhuma estrutura foi inspecionada.";
 const actions=[["PING","TESTAR EXTENSÃO",true],["FLOW_STATUS","DETECTAR FLOW",false],["OPEN_FLOW","ABRIR / FOCAR FLOW",false],["FLOW_INSPECT","INSPECIONAR FLOW",false],["FLOW_MAP","MAPEAR COMPOSITOR",false]];
 const buttons=actions.map(a=>'<button class="btn '+(a[2]?'':'btn-gray')+'" data-bridge-action="'+a[0]+'" '+(state.testing?'disabled':'')+'>'+a[1]+'</button>').join("");
 return '<section class="flow-bridge-panel" id="flow-bridge-panel"><div class="flow-bridge-head"><div><h2>CONEXÃO COM GOOGLE FLOW — TESTE DA EXTENSÃO</h2><p>Inspeciona somente a estrutura de um projeto Flow aberto no Chrome, sem ler conteúdo digitado e sem gerar imagens.</p></div>'+status+'</div>'+
 '<div class="flow-bridge-buttons">'+buttons+'</div>'+
 (state.error?'<p class="flow-bridge-error">⚠ '+esc(state.error)+'</p>':'')+
 '<div class="flow-bridge-stats"><p><b>Comunicação local:</b> '+(state.connected?'Ativa · Extensão v'+esc(state.version):'Não confirmada')+'</p><p><b>Guia Google Flow:</b> '+flow+'</p><p><b>Inspeção estrutural:</b> '+desc+'</p></div>'+
 mapHtml()+
 '<p class="flow-bridge-disclaimer"><b>Importante:</b> detectar controles não confirma que podemos executar geração automática com o plano Ultra. Nenhum dado da conta é coletado e não utilizamos endpoints privados ou créditos.</p>'+
 '<p class="flow-bridge-install"><b>Instalação:</b> extraia a nova extensão, acesse <code>chrome://extensions</code>, desative a versão antiga e use <b>Carregar sem compactação</b> na pasta da versão 0.2.0. <a href="https://github.com/renanroveri7-max/renanroveri7-max.github.io/tree/main/biblical-character-modeler/extension" target="_blank" rel="noopener noreferrer">Código e instruções no GitHub ↗</a></p></section>';
}
function draw(){const node=g.document.getElementById("bcm-bridge-placeholder");if(node)node.innerHTML=panel();}
async function run(type){
 if(state.testing)return;
 state.testing=true;state.error="";draw();
 try{
  const res=await request(type);state.connected=true;
  if(type==="PING")state.version=res.version||"não informada";
  if(["FLOW_STATUS","OPEN_FLOW","FLOW_INSPECT","FLOW_MAP"].includes(type))state.flowOpen=!!res.flowTabOpen;
  if(type==="FLOW_INSPECT"||type==="FLOW_MAP")state.details=res.structure||null;
  if(type==="FLOW_MAP")state.map=res.structure||null;
 }catch(e){state.error=String(e.message||e);if(type==="PING")state.connected=false;}
 finally{state.testing=false;draw();}
}
g.document.addEventListener("click",e=>{
 const btn=e.target.closest("[data-bridge-action]");if(!btn)return;
 const type=btn.dataset.bridgeAction;
 if(["PING","FLOW_STATUS","OPEN_FLOW","FLOW_INSPECT","FLOW_MAP"].includes(type))run(type);
});
g.BCMBridge={draw,run,version:"0.2.0"};
})(window);
