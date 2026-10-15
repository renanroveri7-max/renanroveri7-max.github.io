(function(g){
"use strict";
// Painel da prova de conceito do Chrome. Não faz geração e não lê dados da conta Google.
const state={connected:false,testing:false,flowOpen:null,details:null,error:"",version:""};
const pending=new Map();
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function request(type){
 return new Promise((resolve,reject)=>{
   const nonce="bcm-"+crypto.randomUUID();
   const timeout=setTimeout(()=>{pending.delete(nonce);reject(Error("A extensão não respondeu. Instale ou recarregue a extensão e atualize o aplicativo."));},7000);
   pending.set(nonce,{resolve,reject,timeout});
   g.postMessage({sender:"bcm-site",target:"flow-bridge",type,nonce},g.location.origin);
 });
}
g.addEventListener("message",event=>{
 if(event.source!==g||event.origin!==g.location.origin)return;
 const data=event.data;
 if(!data||data.sender!=="bcm-flow-extension"||data.target!=="bcm-site")return;
 const item=pending.get(data.nonce);
 if(!item)return;
 clearTimeout(item.timeout);pending.delete(data.nonce);
 if(!data.result||data.result.ok!==true)item.reject(Error(data.result?.error||"Resposta inválida da extensão."));
 else item.resolve(data.result);
});
function panel(){
 const status=state.testing?'<span class="flow-status manual">VERIFICANDO...</span>':state.connected?'<span class="flow-status ok">EXTENSÃO DETECTADA</span>':'<span class="flow-status blocked">EXTENSÃO NÃO VERIFICADA</span>';
 const flow=state.flowOpen===null?"Ainda não verificado":state.flowOpen?"Guia do Flow detectada":"Nenhuma guia do Flow aberta";
 let description=state.details?'Estrutura da guia: documento '+esc(state.details.documentReady)+
  ', '+Number(state.details.imageElements||0)+' elementos de imagem, '+
  Number(state.details.canvasElements||0)+' canvas e '+
  Number(state.details.editableElements||0)+' campos editáveis.':"Nenhum dado da página foi inspecionado.";
 return '<section class="flow-bridge-panel" id="flow-bridge-panel"><div class="flow-bridge-head"><div><h2>CONEXÃO COM GOOGLE FLOW — TESTE DA EXTENSÃO</h2><p>Verifica se o Chrome consegue conectar nosso site a uma guia do Flow com sua sessão atual. Sem geração, sem acesso a credenciais.</p></div>'+status+'</div>'+
 '<div class="flow-bridge-buttons"><button class="btn" data-bridge-action="PING" '+(state.testing?'disabled':'')+'>TESTAR EXTENSÃO</button>'+
 '<button class="btn btn-gray" data-bridge-action="FLOW_STATUS" '+(state.testing?'disabled':'')+'>DETECTAR FLOW</button>'+
 '<button class="btn btn-gray" data-bridge-action="OPEN_FLOW" '+(state.testing?'disabled':'')+'>ABRIR / FOCAR FLOW</button>'+
 '<button class="btn btn-gray" data-bridge-action="FLOW_INSPECT" '+(state.testing?'disabled':'')+'>INSPECIONAR FLOW</button></div>'+
 (state.error?'<p class="flow-bridge-error">⚠ '+esc(state.error)+'</p>':'')+
 '<div class="flow-bridge-stats"><p><b>Comunicação local:</b> '+(state.connected?"Ativa · Extensão v"+esc(state.version):"Não confirmada")+'</p><p><b>Guia Google Flow:</b> '+flow+'</p><p><b>Inspeção somente leitura:</b> '+description+'</p></div>'+
 '<p class="flow-bridge-disclaimer"><b>Importante:</b> detectar a extensão ou elementos na página não prova que é possível gerar imagens automaticamente pelo plano Ultra. Não utilizamos endpoints privados, não copiamos cookies e não consumimos créditos. A importação manual da versão anterior continua disponível abaixo.</p>'+
 '<p class="flow-bridge-install"><b>Para instalar:</b> abra <code>chrome://extensions</code>, habilite Modo do desenvolvedor e escolha <b>Carregar sem compactação</b>, selecionando a pasta da extensão. <a href="https://github.com/renanroveri7-max/renanroveri7-max.github.io/tree/main/biblical-character-modeler/extension" target="_blank" rel="noopener noreferrer">Código e instruções no GitHub ↗</a></p></section>';
}
function draw(){const section=g.document.getElementById("bcm-bridge-placeholder");if(section)section.innerHTML=panel();}
async function run(type){
 if(state.testing)return;
 state.testing=true;state.error="";draw();
 try{
  const res=await request(type);
  state.connected=true;
  if(type==="PING")state.version=res.version||"desconhecida";
  if(type==="FLOW_STATUS"||type==="OPEN_FLOW"||type==="FLOW_INSPECT")state.flowOpen=!!res.flowTabOpen;
  if(type==="FLOW_INSPECT")state.details=res.structure||null;
 }catch(e){state.error=String(e.message||e);if(type==="PING")state.connected=false;}
 finally{state.testing=false;draw();}
}
g.document.addEventListener("click",e=>{
 const btn=e.target.closest("[data-bridge-action]");
 if(!btn)return;
 const type=btn.dataset.bridgeAction;
 if(["PING","FLOW_STATUS","OPEN_FLOW","FLOW_INSPECT"].includes(type))run(type);
});
g.BCMBridge={draw,run,version:"0.1.0"};
})(window);