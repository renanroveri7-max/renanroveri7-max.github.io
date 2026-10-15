(function(g){
"use strict";
const FLOW_URL="https://flow.google.com/";
const MAX_IMAGE=25*1024*1024;
const imageURLs=new Map();
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function signature(bytes){
 const a=Array.from(bytes);
 if([137,80,78,71,13,10,26,10].every((n,i)=>a[i]===n))return "image/png";
 if(a[0]===255&&a[1]===216&&a[2]===255)return "image/jpeg";
 if([82,73,70,70].every((n,i)=>a[i]===n)&&a[8]===87&&a[9]===69&&a[10]===66&&a[11]===80)return "image/webp";
 return "";
}
async function dimensions(blob){
 if(typeof g.createImageBitmap==="function"){
  const img=await g.createImageBitmap(blob);
  try{return {width:img.width,height:img.height};}finally{if(img.close)img.close();}
 }
 const url=g.URL.createObjectURL(blob);
 try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(Error("Imagem corrompida ou não suportada."));img.src=url;});}
 finally{g.URL.revokeObjectURL(url);}
}
function validSelection(record,catalog,fichas,prompts,models){
 if(!record||!catalog)return {ok:false,reason:"Selecione um personagem do catálogo."};
 const health=g.BCMProduction.health(record,catalog,fichas,prompts,models);
 if(!health.ok)return {ok:false,reason:health.checks.filter(x=>!x.ok).map(x=>x.detail).join(" ")};
 const official=record.tipo==="Grupo"?models.group:models.individual;
 const p=health.p;
 if(!official||!p)return {ok:false,reason:"Modelo e prompt oficial não disponíveis."};
 return {ok:true,prompt:p,model:official,warnings:health.warnings};
}
async function validateImage(file){
 if(!(file instanceof Blob)||file.size<100||file.size>MAX_IMAGE)throw Error("Selecione uma imagem PNG, JPEG ou WebP de até 25 MB.");
 const mime=signature(new Uint8Array(await file.slice(0,16).arrayBuffer()));
 if(!mime)throw Error("Arquivo inválido: o conteúdo não corresponde a PNG, JPEG ou WebP.");
 let d;
 try{d=await dimensions(file);}catch(e){throw Error("A imagem não pôde ser decodificada.");}
 if(d.width<640||d.height<400)throw Error("Imagem pequena demais. Mínimo: 640 × 400 pixels.");
 if(d.width<=d.height)throw Error("A prancha precisa estar na orientação horizontal.");
 return {mime,width:d.width,height:d.height};
}
async function prepareImport(file,record,project,catalog,fichas,prompts,models){
 const check=validSelection(record,catalog,fichas,prompts,models);
 if(!check.ok)throw Error(check.reason);
 const d=await validateImage(file);
 if(!project||!project.id)throw Error("Projeto ausente.");
 const id=g.crypto.randomUUID();
 const filename=String(file.name||"modelagem").slice(0,240);
 const metadata={
  id,projectId:project.id,recordId:record.id_tecnico,recordOriginalId:String(record.id_original||""),
  exactName:String(record.nome_exato_planilha||record.nome||""),phase:String(record.fase||""),
  filename,mime:d.mime,size:file.size,width:d.width,height:d.height,createdAt:Date.now(),
  source:"flow-manual-import",status:"pending_manual_audit",promptFingerprint:check.prompt.fingerprint,
  modelId:check.model.modelId,originalBlobStore:"flowAssets",schemaVersion:1
 };
 return {metadata,asset:{id,blob:file}};
}
function shortSize(b){return (b/1048576).toFixed(1)+" MB";}
function pageHtml(project,catalog,fichas,prompts,models,imports,selectedId,previewId,previewURL){
 if(!project)return '<div class="panel"><h2>Selecione um projeto</h2><p>Os resultados do Flow ficam separados por projeto.</p><button class="btn" data-page="projects">Abrir Projetos</button></div>';
 if(!catalog||!Array.isArray(catalog.records)||catalog.records.length===0)return '<div class="panel"><h2>Importe um catálogo</h2><p>O personagem precisa existir antes de receber uma imagem.</p><button class="btn" data-page="catalog">Ir ao Catálogo</button></div>';
 const list=catalog.records,record=list.find(r=>r.id_tecnico===selectedId)||list[0],isReady=validSelection(record,catalog,fichas,prompts,models);
 const mine=(imports||[]).filter(i=>i.recordId===record.id_tecnico).sort((a,b)=>b.createdAt-a.createdAt);
 const badge=isReady.ok?'<span class="flow-status ok">PRONTO PARA FLOW</span>':'<span class="flow-status blocked">PREPARAÇÃO PENDENTE</span>';
 const refs=isReady.ok?'<div class="flow-ref"><span>Referência oficial: <b>'+esc(isReady.model.filename)+'</b></span><button class="mini" type="button" data-flow-action="download-ref">BAIXAR REFERÊNCIA OFICIAL</button></div>':'<div class="flow-caution">'+esc(isReady.reason)+'</div>';
 const controls='<div class="flow-controls">'+
 '<button class="btn" type="button" data-flow-action="copy" '+(!isReady.ok?'disabled':'')+'>1. COPIAR PROMPT</button>'+
 '<button class="btn" type="button" data-flow-action="prefill" '+(!isReady.ok?'disabled':'')+'>TESTAR ENVIO DIRETO DO PROMPT (NÃO GERA)</button>'+
 '<button class="btn" type="button" data-flow-action="capture" '+(!isReady.ok?'disabled':'')+'>TESTAR CAPTURA DA IMAGEM ABERTA (NÃO GERA)</button>'+
 '<a class="btn btn-gray flow-flowlink" href="'+FLOW_URL+'" target="_blank" rel="noopener noreferrer">2. ABRIR GOOGLE FLOW ↗</a>'+
 '<button class="btn" type="button" data-flow-action="choose" '+(!isReady.ok?'disabled':'')+'>3. IMPORTAR IMAGEM GERADA</button>'+
 '<input id="flow-result-file" type="file" accept="image/png,image/jpeg,image/webp" style="display:none" aria-label="Importar imagem gerada pelo Google Flow">'+
 '</div>';
 const selector='<div class="flow-selector"><label for="flow-record">PERSONAGEM / FASE DO CATÁLOGO</label><select id="flow-record">'+list.map(r=>'<option value="'+esc(r.id_tecnico)+'" '+(r.id_tecnico===record.id_tecnico?'selected':'')+'>'+esc(r.nome_exato_planilha||r.nome)+' — '+esc(r.fase||r.tipo)+' ('+esc(r.id_original)+')</option>').join("")+'</select></div>';
 const cards=mine.length?mine.map((i,n)=>'<div class="flow-import-row"><div><strong>Versão importada '+(mine.length-n)+'</strong><small>'+esc(i.filename)+' · '+i.width+' × '+i.height+' · '+shortSize(i.size)+'</small><small>'+new Date(i.createdAt).toLocaleString("pt-BR")+' · Aguardando auditoria</small></div><div class="flow-import-actions"><button class="mini" data-flow-view="'+esc(i.id)+'">VISUALIZAR</button><button class="mini" data-flow-download="'+esc(i.id)+'">BAIXAR</button></div></div>').join(""):'<p class="flow-empty">Nenhuma imagem importada para este personagem ainda.</p>';
 const shown=mine.find(i=>i.id===previewId);
 const preview=shown&&previewURL?'<div class="flow-preview"><div class="flow-preview-title"><b>Prévia — '+esc(shown.exactName)+' / '+esc(shown.phase)+'</b><button class="mini" data-flow-action="clear-preview">FECHAR</button></div><img src="'+esc(previewURL)+'" alt="Modelagem importada de '+esc(shown.exactName)+'"></div>':"";
 return '<div class="flow-intro"><div><h2>GOOGLE FLOW — CONEXÃO ASSISTIDA</h2><p>Utilize sua sessão Google diretamente no Flow. Nosso aplicativo prepara o prompt e recebe de volta os arquivos baixados, sem acessar sua conta nem controlar o Flow.</p></div><span class="flow-status manual">IMPORTAÇÃO MANUAL SEGURA</span></div>'+
 '<div class="flow-workspace">'+
 '<section class="flow-prep"><div class="flow-prep-top">'+selector+badge+'</div>'+
 '<div class="flow-record-summary"><strong>'+esc(record.nome_exato_planilha||record.nome)+'</strong><small>ID '+esc(record.id_original)+' · Fase '+esc(record.fase||"Não indicada")+' · '+esc(record.tipo)+'</small></div>'+
 refs+controls+
 '<div class="flow-instructions"><b>Como testar:</b> copie o prompt; abra o Google Flow, onde você já entra com sua conta; envie a imagem de referência no Flow, quando disponível; gere e baixe a imagem; volte para cá e importe o arquivo. O arquivo será ligado somente ao registro selecionado.</div>'+
 '<p class="flow-limit"><b>Atenção:</b> este módulo não faz login integrado, não utiliza os créditos da sua assinatura por API, não inicia gerações e não sincroniza a galeria automaticamente. A imagem importada aguarda auditoria humana; não será aprovada automaticamente.</p></section>'+
 '<section class="flow-results"><div class="flow-results-head"><div><h3>IMAGENS RECEBIDAS</h3><small>'+mine.length+' arquivo(s) para este personagem · '+(imports||[]).length+' no projeto</small></div><span class="flow-status manual">PENDENTE DE AUDITORIA</span></div>'+cards+preview+'</section></div>';
}
function retainUrl(id,blob){
 if(imageURLs.has(id))return imageURLs.get(id);
 const u=g.URL.createObjectURL(blob);imageURLs.set(id,u);return u;
}
function cleanup(){imageURLs.forEach(u=>g.URL.revokeObjectURL(u));imageURLs.clear();}
function downloadBlob(blob,name){
 const url=g.URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name||"imagem";a.style.display="none";
 document.body.appendChild(a);a.click();a.remove();
 g.setTimeout(()=>g.URL.revokeObjectURL(url),3000);
}
g.BCMFlow={pageHtml,validSelection,validateImage,prepareImport,retainUrl,cleanup,downloadBlob,FLOW_URL};
})(window);