(function(global) {
"use strict";
const GROUPS=[
 ["aparencia","APARÊNCIA",[
  ["genero_visual","Gênero visual"],["idade_visual","Idade visual"],["pele","Pele"],["rosto","Rosto"],["olhos","Olhos"],["nariz","Nariz"],["mandibula","Mandíbula"],
  ["cabelo","Cabelo"],["barba","Barba"],["porte_fisico","Porte físico"],["caracteristicas_especiais","Características especiais"],["descricao_geral","Descrição física geral"]
 ]],
 ["vestimentas","VESTIMENTAS",[
  ["tunica","Túnica"],["manto","Manto"],["cinto","Cinto"],["calcados","Calçados"],["tecidos","Tecidos"],
  ["cores","Cores"],["adornos","Adornos"],["acessorios","Acessórios"],["descricao_geral","Descrição geral do figurino"]
 ]],
 ["contexto","CONTEXTO",[
  ["povo","Povo"],["origem","Origem"],["epoca","Época"],["funcao","Função"],
  ["referencias_biblicas","Referências bíblicas"],["contexto_historico","Contexto histórico"]
 ]],
 ["modelagem","MODELAGEM",[
  ["template_id","Modelo oficial (ID)"],["composicao","Padrão de composição"],["integrantes_count","Quantidade de integrantes"],["observacoes","Observações"]
 ]]
];
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function present(x){return x!==undefined&&x!==null&&!(typeof x==="string"&&x.trim()==="");}
function stringify(x){
 if(!present(x))return "";
 return typeof x==="object"?JSON.stringify(x,null,2):String(x);
}
function parseObj(x){
 if(x&&typeof x==="object"&&!Array.isArray(x))return x;
 if(typeof x==="string"&&x.trim().charAt(0)==="{"){try{var o=JSON.parse(x);if(o&&typeof o==="object"&&!Array.isArray(o))return o;}catch(_){}}
 return {};
}
function from(o,keys){
 if(!o||typeof o!=="object")return undefined;
 for(var k of keys)if(Object.prototype.hasOwnProperty.call(o,k)&&present(o[k]))return o[k];
}
function field(val){
 return {value:present(val)?stringify(val):"",provenance:present(val)?"catalog":"unknown"};
}
function merged(old,newVal){
 return old&&old.provenance==="manual"?{value:old.value,provenance:"manual"}:newVal;
}
function idFor(record,memberIndex){
 return "f:"+record.id_tecnico+(memberIndex===null?":master":":member:"+(memberIndex+1));
}
function makeBase(record,memberIndex) {
 var isMember=Number.isInteger(memberIndex),isGroup=record.tipo==="Grupo",member=isMember?record.pessoas[memberIndex]:null;
 if(isMember&&(!member||typeof member!=="object"))throw Error("Integrante inválido no registro "+record.id_original);
 var r=isMember?member:(isGroup?{}:record);
 var rAppearance=parseObj(r.aparencia),rClothing=parseObj(r.vestimentas),rContext=parseObj(r.contexto);
 if(!isMember&&!isGroup&&Array.isArray(record.pessoas)&&record.pessoas.length===1){
  var own=record.pessoas[0]; if(own&&typeof own==="object") {
   var ap=parseObj(own.aparencia),cl=parseObj(own.vestimentas);
   r=Object.assign({},own,record);
   rAppearance=Object.assign({},ap,rAppearance);
   rClothing=Object.assign({},cl,rClothing);
  }
 }
 var appearance={
  genero_visual:from(rAppearance,["genero_visual","genero"])||from(r,["genero_visual","genero"]),
  idade_visual:from(rAppearance,["idade_visual","idade"])||from(r,["idade_visual","idade"]),
  pele:from(rAppearance,["pele","tom_pele"])||from(r,["pele","tom_pele"]),
  rosto:from(rAppearance,["rosto","face"])||from(r,["rosto","face"]),
  olhos:from(rAppearance,["olhos"])||from(r,["olhos"]),nariz:from(rAppearance,["nariz"])||from(r,["nariz"]),
  mandibula:from(rAppearance,["mandibula","mandíbula"])||from(r,["mandibula","mandíbula"]),
  cabelo:from(rAppearance,["cabelo"])||from(r,["cabelo"]),barba:from(rAppearance,["barba"])||from(r,["barba"]),
  porte_fisico:from(rAppearance,["porte_fisico","porte","altura"])||from(r,["porte_fisico","porte","altura"]),
  caracteristicas_especiais:from(rAppearance,["caracteristicas_especiais"])||from(r,["caracteristicas_especiais"]),
  descricao_geral:typeof r.aparencia==="string"?r.aparencia:from(rAppearance,["descricao_geral","descricao","descrição"])
 };
 var clothing={
  tunica:from(rClothing,["tunica","túnica"])||from(r,["tunica","túnica"]),
  manto:from(rClothing,["manto"])||from(r,["manto"]),
  cinto:from(rClothing,["cinto"])||from(r,["cinto"]),
  calcados:from(rClothing,["calcados","calçados"])||from(r,["calcados","calçados"]),
  tecidos:from(rClothing,["tecidos"])||from(r,["tecidos"]),
  cores:from(rClothing,["cores"])||from(r,["cores"]),
  adornos:from(rClothing,["adornos"])||from(r,["adornos"]),
  acessorios:from(rClothing,["acessorios","acessórios"])||from(r,["acessorios","acessórios"]),
  descricao_geral:typeof r.vestimentas==="string"?r.vestimentas:from(rClothing,["descricao_geral","descricao","descrição"])
 };
 var ctx={
  povo:from(rContext,["povo"])||from(r,["povo"]),
  origem:from(rContext,["origem"])||from(r,["origem"]),
  epoca:from(rContext,["epoca","época"])||from(r,["epoca","época"]),
  funcao:from(rContext,["funcao","função"])||from(r,["funcao","função","designacao"]),
  referencias_biblicas:from(rContext,["referencias_biblicas"])||from(r,["referencias_biblicas"])||record.local_referencia||record.capitulos,
  contexto_historico:from(rContext,["contexto_historico"])||from(r,["contexto_historico"])||record.contexto
 };
 var masterName=record.nome_exato_planilha||record.nome,memName=isMember?from(member,["nome","nome_exato","designacao"])||("Integrante "+(memberIndex+1)):"";
 var templateId=isMember||!isGroup?"official_individual":"official_group";
 var result={
  id:idFor(record,isMember?memberIndex:null),recordId:record.id_tecnico,
  parentId:isMember?idFor(record,null):null,
  memberIndex:isMember?memberIndex:null,kind:isMember?"Integrante":record.tipo,
  identificacao:{
   id_original:String(record.id_original||record.numero||"")+(isMember?"_M"+(memberIndex+1):""),
   nome_exato:String(isMember?memName:masterName),
   grupo_original:isMember?String(masterName):"",
   livro:record.livro||"",fase:record.fase||"",tipo:isMember?"Integrante":record.tipo,
   referencia:stringify(record.capitulos||record.local_referencia)
  },
  aparencia:{},vestimentas:{},contexto:{},modelagem:{},
  status:"prepared",updatedAt:Date.now()
 };
 for(var [s,values] of [["aparencia",appearance],["vestimentas",clothing],["contexto",ctx]])Object.keys(values).forEach(function(key){result[s][key]=field(values[key]);});
 result.modelagem={
  template_id:field(templateId),
  composicao:field(isMember?"Integrante em prancha grupal":isGroup?"Quatro faixas horizontais sequenciais":"Retrato + 4 vistas corporais + detalhes"),
  integrantes_count:field(isGroup&&!isMember?(record.pessoas||[]).length:1),
  observacoes:field(isMember?from(member,["observacoes"])||record.observacoes:record.observacoes)
 };
 if(isGroup&&!isMember){
  // A ficha principal descreve o grupo como um todo, nunca copia a aparência de um dos membros.
  Object.keys(result.aparencia).forEach(function(k){result.aparencia[k]=field();});
  Object.keys(result.vestimentas).forEach(function(k){result.vestimentas[k]=field();});
  result.vestimentas.descricao_geral=field(record.vestimentas);
  result.aparencia.descricao_geral=field(record.aparencia);
 }
 return result;
}
function preserve(current,base) {
 if(!current)return base;
 for(var sec of ["aparencia","vestimentas","contexto","modelagem"]){
  var oldSec=current[sec]||{};
  for(var key of Object.keys(base[sec]))base[sec][key]=merged(oldSec[key],base[sec][key]);
 }
 if(current.status==="researched")base.status="researched";
 base.createdAt=current.createdAt||current.updatedAt||base.updatedAt;
 return base;
}
function prepare(catalog,previous){
 if(!catalog||!Array.isArray(catalog.records))throw Error("Importe um catálogo confirmado primeiro.");
 if(catalog.records.some(function(r){return r.validacao&&r.validacao.status==="error";}))throw Error("Corrija os erros críticos do catálogo antes de preparar fichas.");
 var byId=new Map((previous&&previous.fichas||[]).map(function(f){return [f.id,f];}));
 var fichas=[],expected=0;
 for(var record of catalog.records){
  var one=makeBase(record,null);fichas.push(preserve(byId.get(one.id),one));expected++;
  if(record.tipo==="Grupo"){
   for(var i=0;i<(record.pessoas||[]).length;i++){var m=makeBase(record,i);fichas.push(preserve(byId.get(m.id),m));expected++;}
  }
 }
 if(fichas.length!==expected)throw Error("Falha na contagem de fichas.");
 var known=new Set(fichas.map(function(f){return f.id;}));
 var archive=(previous&&previous.archived||[]).concat((previous&&previous.fichas||[]).filter(function(f){return !known.has(f.id);}));
 return {projectId:catalog.projectId,catalogImportedAt:catalog.importedAt,fichas:fichas,archived:archive,updatedAt:Date.now(),schemaVersion:1};
}
function getStats(bundle,catalog) {
 var f=bundle&&bundle.fichas||[],out={records:catalog&&catalog.records?catalog.records.length:0,masters:0,members:0,prepared:0,edited:0,total:f.length,stale:!!(bundle&&catalog&&bundle.catalogImportedAt!==catalog.importedAt)};
 f.forEach(function(x){if(x.kind==="Integrante")out.members++;else out.masters++;if(x.status==="prepared"||x.status==="researched")out.prepared++;if(["aparencia","vestimentas","contexto","modelagem"].some(function(sec){return Object.values(x[sec]||{}).some(function(v){return v.provenance==="manual";});}))out.edited++;});return out;
}
function pageHtml(project,catalog,bundle,selectedId,search){
 if(!project)return '<div class="panel"><div class="emblem">◈</div><h2>Selecione um projeto</h2><p>As fichas são organizadas por projeto.</p><button class="btn" data-page="projects">Abrir Projetos</button></div>';
 if(!catalog)return '<div class="panel"><div class="emblem">◈</div><h2>Importe seu catálogo primeiro</h2><p>O catálogo confirmado fornece as características originais das fichas.</p><button class="btn" data-page="catalog">Ir para Catálogo</button></div>';
 var st=getStats(bundle,catalog);
 var control='<div class="ficha-actions"><button class="btn" data-ficha-action="prepare">◈ '+(bundle?"Atualizar fichas do catálogo":"Preparar fichas")+'</button><span class="ficha-note">Preenchimento inicial pelo catálogo · Pesquisa por IA ainda não ativada</span></div>';
 var counts='<div class="ficha-stats">'+[["REGISTROS",st.records],["FICHAS PRINCIPAIS",st.masters],["INTEGRANTES",st.members],["FICHAS PREPARADAS",st.prepared],["EDITADAS",st.edited]].map(function(x){return '<div><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>';}).join("")+'</div>';
 if(!bundle||!bundle.fichas.length)return control+counts+'<div class="panel"><div class="emblem">◈</div><h2>Preparação de fichas técnicas</h2><p>O catálogo '+esc(catalog.filename)+' contém '+catalog.records.length+' registros. Clique em Preparar Fichas para criar os dados técnicos de indivíduos e integrantes de grupos.</p><button class="btn" data-ficha-action="prepare">Preparar fichas</button></div>';
 var all=bundle.fichas,filtered=all.filter(function(f){return !search||[f.identificacao.nome_exato,f.identificacao.id_original,f.identificacao.fase].some(function(v){return String(v||"").toLocaleLowerCase().includes(search.toLocaleLowerCase());});});
 var f=all.find(function(x){return x.id===selectedId;})||null;
 var list='<div class="ficha-list"><input id="ficha-search" placeholder="Pesquisar ficha por nome, ID ou fase..." value="'+esc(search)+'"><div class="ficha-list-items">'+filtered.map(function(x){
  return '<button type="button" class="ficha-choice '+(f&&f.id===x.id?"selected":"")+'" data-ficha-id="'+esc(x.id)+'"><span class="ficha-choice-name">'+esc(x.identificacao.nome_exato)+'</span><small>'+esc(x.identificacao.id_original)+' · '+esc(x.kind)+' · '+esc(x.identificacao.fase||"Sem fase")+'</small></button>';
 }).join("")+(filtered.length?"":'<p class="fine">Nenhuma ficha encontrada.</p>')+'</div></div>';
 return control+counts+(st.stale?'<div class="ficha-warning">O catálogo foi atualizado desde a preparação. Clique em Atualizar fichas; campos editados manualmente serão preservados.</div>':"")+
 '<div class="ficha-layout">'+list+(f?editor(f):'<div class="ficha-empty"><h2>Selecione uma ficha</h2><p>Clique em um personagem ou integrante para visualizar e editar seus campos.</p></div>')+'</div>'+
 '<p class="fine">Os campos desconhecidos permanecem vazios — não inventamos atributos bíblicos. Suas edições são salvas separadamente do catálogo e continuam após o F5.</p>';
}
function editor(f){
 var id=f.identificacao,meta=[["ID original",id.id_original],["Nome exato",id.nome_exato],["Livro",id.livro],["Fase",id.fase||"Não informada"],["Tipo",id.tipo],["Referência",id.referencia||"Não informada"]];
 var head='<div class="ficha-editor-header"><div><small>FICHA TÉCNICA · '+esc(f.kind.toUpperCase())+'</small><h2>'+esc(id.nome_exato)+'</h2><p>ID '+esc(id.id_original)+' · Fase '+esc(id.fase||"Não informada")+'</p></div><span class="catalog-pill valid">PREPARADA</span></div>';
 var ident='<div class="ficha-section"><h3>IDENTIFICAÇÃO — catálogo original</h3><div class="ficha-ident">'+meta.map(function(x){return '<div><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></div>';}).join("")+'</div></div>';
 var fields=GROUPS.map(function(group){
  var [sec,title,keys]=group;
  return '<fieldset class="ficha-section"><legend>'+esc(title)+'</legend><div class="ficha-fields">'+keys.map(function(pair){
   var k=pair[0],lab=pair[1],v=f[sec][k]||field(),name="f:"+sec+":"+k;
   var isLong=k==="descricao_geral"||k==="contexto_historico"||k==="observacoes"||String(v.value).length>130;
   var input=isLong?'<textarea rows="3" name="'+esc(name)+'" placeholder="Não informado">'+esc(v.value)+'</textarea>':'<input name="'+esc(name)+'" value="'+esc(v.value)+'" placeholder="Não informado">';
   return '<label class="ficha-field"><span>'+esc(lab)+'</span>'+input+'<small class="'+(v.provenance==="manual"?"manual":"")+'">'+(v.provenance==="manual"?"Edição manual":v.provenance==="catalog"?"Origem: catálogo":"Não informado")+'</small></label>';
  }).join("")+'</div></fieldset>';
 }).join("");
 return '<div class="ficha-editor">'+head+'<form id="ficha-form" data-ficha-form="'+esc(f.id)+'">'+ident+fields+'<div class="ficha-savebar"><button class="btn" type="submit">Salvar alterações</button><span>Edição independente do catálogo.</span></div></form></div>';
}
function saveValues(ficha,form) {
 var copy=JSON.parse(JSON.stringify(ficha)),data=new FormData(form),now=Date.now();
 for(var [sec,_title,keys] of GROUPS) {
  for(var [k] of keys) {
   var val=String(data.get("f:"+sec+":"+k)||"");
   var cur=ficha[sec][k]||field();
   if(val!==String(cur.value||""))copy[sec][k]={value:val,provenance:"manual"};
  }
 }
 copy.updatedAt=now;
 return copy;
}
global.BCMFicha={prepare:prepare,pageHtml:pageHtml,saveValues:saveValues,getStats:getStats,makeBase:makeBase};
})(window);
