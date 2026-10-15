(function(g){
"use strict";
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const prompt=(r,p)=>(p&&p.items||[]).find(x=>x.recordId===r.id_tecnico);
const model=(r,m)=>m&&(r.tipo==="Grupo"?m.group:m.individual);
const members=(r,f)=>(f&&f.fichas||[]).filter(x=>x.recordId===r.id_tecnico&&x.kind==="Integrante").sort((a,b)=>a.memberIndex-b.memberIndex);
function health(r,catalog,fichas,prompts,models){
 const p=prompt(r,prompts),m=model(r,models),people=r.tipo==="Grupo"?members(r,fichas):[];
 const checks=[];
 function add(ok,label,fail){checks.push({ok:!!ok,label,detail:ok?"Verificado":fail});}
 add(!!(catalog&&catalog.records&&catalog.records.some(x=>x.id_tecnico===r.id_tecnico)),"Registro","Registro ausente do catálogo.");
 add(!!(fichas&&fichas.catalogImportedAt===catalog.importedAt),"Fichas","Prepare novamente as fichas após a importação.");
 add(!!p,"Prompt","Prepare o prompt primeiro.");
 add(!!(p&&p.status!=="error"),"Validação do prompt","Existe erro crítico no prompt.");
 add(!!(p&&g.BCMPrompts.currentItem(r,fichas,models,p)),"Versão do prompt","O prompt está desatualizado.");
 add(!!(m&&g.BCMModels.valid(m)),"Modelo oficial","Referência oficial inativa ou ausente.");
 add(!!(m&&m.blob instanceof Blob&&m.blob.size>0),"Imagem binária","Arquivo de referência não encontrado.");
 if(r.tipo==="Grupo"){
  add(!!(Array.isArray(r.pessoas)&&people.length===r.pessoas.length&&people.every((x,i)=>x.memberIndex===i)),"Integrantes","Fichas dos integrantes incompletas.");
  add(!!(p&&p.memberCount===people.length),"Quantidade de pessoas","Número de integrantes não corresponde ao prompt.");
 }else add(!!(p&&p.memberCount===1),"Indivíduo","Prompt não corresponde a um indivíduo.");
 return {ok:checks.every(x=>x.ok),checks,p,m,people,warnings:p&&p.status==="warning"?p.validationMessages:[]};
}
function build(r,project,catalog,fichas,prompts,models){
 const h=health(r,catalog,fichas,prompts,models);
 if(!h.ok)throw Error(h.checks.filter(x=>!x.ok).map(x=>x.detail).join(" "));
 return {schemaVersion:1,projectId:project.id,recordId:r.id_tecnico,originalId:String(r.id_original||""),exactName:String(r.nome_exato_planilha||r.nome||""),book:String(r.livro||project.book||""),phase:String(r.fase||""),recordType:r.tipo,memberCount:r.tipo==="Grupo"?h.people.length:1,memberIds:h.people.map(x=>x.identificacao.id_original),memberNames:h.people.map(x=>x.identificacao.nome_exato),fullPrompt:h.p.fullPrompt,negativePrompt:h.p.negativePrompt,promptFingerprint:h.p.fingerprint,reference:{modelId:h.m.modelId,filename:h.m.filename,mime:h.m.mime,width:h.m.width,height:h.m.height,size:h.m.blob.size,updatedAt:h.m.updatedAt},referenceLocation:{store:"models",key:h.m.modelId},aspectIntent:"landscape",metadataOnly:true,status:"ready_for_backend_integration",warnings:h.warnings,preparedAt:Date.now()};
}
function current(packet,r,catalog,fichas,prompts,models){
 if(!packet||packet.recordId!==r.id_tecnico)return false;
 const h=health(r,catalog,fichas,prompts,models);
 return h.ok&&packet.promptFingerprint===h.p.fingerprint&&packet.reference.modelId===h.m.modelId&&packet.reference.updatedAt===h.m.updatedAt&&packet.reference.size===h.m.blob.size&&packet.memberCount===(r.tipo==="Grupo"?h.people.length:1);
}
function inspect(packet){
 const {fullPrompt,negativePrompt,...meta}=packet;
 return JSON.stringify({...meta,promptPreview:fullPrompt.slice(0,1500),negativePrompt},null,2);
}
function html(project,catalog,fichas,prompts,models,bundle,selected){
 if(!project)return '<div class="panel"><h2>Selecione um projeto</h2><button class="btn" data-page="projects">Projetos</button></div>';
 if(!catalog)return '<div class="panel"><h2>Catálogo necessário</h2><button class="btn" data-page="catalog">Catálogo</button></div>';
 const all=bundle&&bundle.packets||[],ready=catalog.records.filter(r=>health(r,catalog,fichas,prompts,models).ok).length,saved=catalog.records.filter(r=>{const pack=all.find(x=>x.recordId===r.id_tecnico);return current(pack,r,catalog,fichas,prompts,models);}).length;
 const stats='<div class="prod-stats">'+[["REGISTROS",catalog.records.length],["PRONTOS PARA PREPARAR",ready],["PACOTES SALVOS",saved],["IMAGENS GERADAS","0"]].map(x=>'<div><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join("")+'</div>';
 const nav='<div class="prod-nav"><h3>PERSONAGENS</h3>'+catalog.records.map(r=>{const check=health(r,catalog,fichas,prompts,models),pack=all.find(x=>x.recordId===r.id_tecnico);return '<button data-prod-id="'+esc(r.id_tecnico)+'" class="'+(selected===r.id_tecnico?"selected":"")+'"><b>'+esc(r.nome_exato_planilha||r.nome)+'</b><small>'+esc(r.id_original)+' · '+esc(r.fase||r.tipo)+'</small><span>'+(current(pack,r,catalog,fichas,prompts,models)?"PACOTE SALVO":check.ok?"PRONTO":"BLOQUEADO")+'</span></button>';}).join("")+'</div>';
 const r=catalog.records.find(x=>x.id_tecnico===selected);
 let detail='<div class="prod-empty"><h2>Selecione um personagem</h2><p>Confira a preparação técnica antes de qualquer ligação com a API.</p></div>';
 if(r){
  const h=health(r,catalog,fichas,prompts,models),packet=all.find(x=>x.recordId===r.id_tecnico),valid=current(packet,r,catalog,fichas,prompts,models);
  detail='<div class="prod-detail"><small>PRÉ-VOO TÉCNICO · '+esc(r.id_original)+'</small><h2>'+esc(r.nome_exato_planilha||r.nome)+'</h2><p>'+esc(r.tipo)+' · '+esc(r.fase||"Sem fase")+'</p><div class="prod-checks">'+h.checks.map(x=>'<div class="'+(x.ok?"ok":"err")+'"><b>'+(x.ok?"✓ ":"× ")+esc(x.label)+'</b><small>'+esc(x.detail)+'</small></div>').join("")+'</div>'+
  (h.warnings.length?'<div class="prod-warning"><b>Avisos de completude:</b>'+h.warnings.map(t=>'<p>'+esc(t)+'</p>').join("")+'</div>':"")+
  '<div class="prod-meta"><div><small>MODELO</small><strong>'+esc(h.m&&h.m.modelId||"Ausente")+'</strong></div><div><small>ARQUIVO</small><strong>'+esc(h.m&&h.m.filename||"Ausente")+'</strong></div><div><small>PESSOAS</small><strong>'+(r.tipo==="Grupo"?h.people.length:1)+'</strong></div><div><small>PROMPT</small><strong>'+esc(h.p&&h.p.status||"Pendente")+'</strong></div></div>'+
  '<button class="btn" data-prod-action="pack" data-prod-id="'+esc(r.id_tecnico)+'" '+(h.ok?"":"disabled")+'>'+(valid?"REVALIDAR PACOTE":"PREPARAR E SALVAR PACOTE")+'</button>'+
  (packet?'<div class="prod-saved '+(valid?"":"outdated")+'">'+(valid?"Pacote técnico salvo no IndexedDB. Nenhuma imagem foi gerada.":"Pacote anterior desatualizado.")+'</div><button class="mini" data-prod-action="inspect" data-prod-id="'+esc(r.id_tecnico)+'">VER DADOS DO PACOTE SALVO</button>':"")+'</div>';
 }
 return stats+'<div class="prod-layout">'+nav+detail+'</div><div class="prod-note"><b>Etapa 6A — Sem consumo de créditos.</b> Preparamos somente a solicitação técnica e os vínculos aos arquivos oficiais guardados no navegador. Nenhuma imagem é enviada à IA. Um serviço seguro de geração será integrado e testado em etapa posterior.</div>';
}
g.BCMProduction={health,build,current,inspect,html};
})(window);