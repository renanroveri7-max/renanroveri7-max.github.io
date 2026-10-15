(function (global) {
"use strict";
var excelLoader=null;
function esc(value) { return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function has(v) { return v!==undefined && v!==null && String(v)!==""; }
function pick(obj,keys) { for(var i=0;i<keys.length;i++){ if(Object.prototype.hasOwnProperty.call(obj,keys[i]) && has(obj[keys[i]])) return obj[keys[i]]; } return ""; }
function nested(v) {
 if(typeof v!=="string")return v;
 var t=v.trim();
 if((t.charAt(0)==="{"&&t.slice(-1)==="}")||(t.charAt(0)==="["&&t.slice(-1)==="]")){ try{return JSON.parse(t);}catch(_e){return v;} }
 return v;
}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,"0");}
function normalize(item,i,projectId) {
 var messages=[],status="valid";
 if(!item || typeof item!=="object" || Array.isArray(item)){item={};status="error";messages.push("Registro "+(i+1)+": objeto inválido.");}
 var source=JSON.parse(JSON.stringify(item)),o={};
 Object.keys(item).forEach(function(k){o[k]=nested(item[k]);});
 var originalName=pick(o,["nome_exato_planilha","nome","nome_exato","nome_oficial"]);
 if(typeof originalName!=="string" && has(originalName))originalName=String(originalName);
 if(!String(originalName).trim()){status="error";messages.push("Registro "+(i+1)+": nome identificável ausente.");}
 var rawType=String(pick(o,["tipo","type"])||"Individual");
 var isGroup=/^grupo$/i.test(rawType.trim());
 var members=Array.isArray(o.pessoas)?o.pessoas.map(function(m){if(typeof m==="string")return nested(m);if(m&&typeof m==="object"){var nm={};Object.keys(m).forEach(function(k){nm[k]=nested(m[k]);});return nm;}return m;}):[];
 if(isGroup && !Array.isArray(o.pessoas)){status="error";messages.push("Grupo sem array válido no campo pessoas.");}
 if(isGroup && members.some(function(m){return !m || typeof m!=="object" || Array.isArray(m);})){status="error";messages.push("Integrantes precisam ser objetos válidos.");}
 var declaredRaw=pick(o,["quantidade_integrantes","integrantes_count"]),declared=has(declaredRaw)?Number(declaredRaw):NaN;
 if(isGroup && members.length===0){status="error";messages.push("Grupo sem integrantes.");}
 if(isGroup && Number.isFinite(declared) && declared!==members.length){if(status!=="error")status="warning";messages.push("Divergência: "+declared+" integrantes declarados, "+members.length+" encontrados.");}
 if(isGroup && has(declaredRaw) && (!Number.isInteger(declared)||declared<1)){status="error";messages.push("Quantidade de integrantes inválida.");}
 var idOriginal=pick(o,["id","ID","id_original","numero"]);
 var fase=pick(o,["fase","fase_vida"]),livro=pick(o,["livro","book"]),capitulos=pick(o,["capitulos","capitulo"]);
 var key=has(idOriginal)?"id:"+String(idOriginal):"dados:"+JSON.stringify([originalName,fase,livro,capitulos,pick(o,["local_referencia"])]);
 return {id_tecnico:"r-"+hash(projectId+"|"+key),id_original:has(idOriginal)?String(idOriginal):"",numero:pick(o,["numero"]),
 nome_exato_planilha:has(o.nome_exato_planilha)?String(o.nome_exato_planilha):String(originalName),nome:String(originalName),
 livro:has(livro)?String(livro):"",tipo:isGroup?"Grupo":"Individual",fase:has(fase)?String(fase):"",
 quantidade_integrantes:isGroup?(Number.isInteger(declared)&&declared>0?declared:members.length):1,
 capitulos:capitulos,local_referencia:o.local_referencia||"",contexto:o.contexto||"",pessoas:members,
 padrao_imagem:o.padrao_imagem||"",idade:o.idade||"",aparencia:o.aparencia||"",vestimentas:o.vestimentas||"",observacoes:o.observacoes||"",
 _original:source,validacao:{status:status,messages:messages},_identityKey:key};
}
function stats(records){
 var x={totalRecords:records.length,totalIndividuals:0,totalGroups:0,totalMembers:0,validCount:0,warningCount:0,errorCount:0};
 records.forEach(function(r){if(r.tipo==="Grupo"){x.totalGroups++;x.totalMembers+=(r.pessoas||[]).length;}else{x.totalIndividuals++;x.totalMembers++;}if(r.validacao.status==="error")x.errorCount++;else if(r.validacao.status==="warning")x.warningCount++;else x.validCount++;});return x;
}
function createCatalog(raw,projectId,filename,sheet){
 var items=Array.isArray(raw)?raw:raw&&([raw.personagens,raw.registros,raw.catalogo,raw.characters].find(Array.isArray));
 if(!Array.isArray(items))throw Error("JSON sem array de registros (personagens, registros ou catalogo).");
 if(items.length===0)throw Error("O catálogo está vazio.");
 if(items.length>10000)throw Error("Limite de segurança: até 10.000 registros por importação.");
 var records=items.map(function(o,i){return normalize(o,i,projectId);});
 var seen={};records.forEach(function(r,i){var k=r._identityKey;if(Object.prototype.hasOwnProperty.call(seen,k)){r.validacao.status="error";r.validacao.messages.push("Identificador duplicado com registro "+(seen[k]+1)+".");records[seen[k]].validacao.status="error";records[seen[k]].validacao.messages.push("Identificador duplicado com registro "+(i+1)+".");r.id_tecnico+="--duplicado-"+i;}else seen[k]=i;});
 records.forEach(function(r){delete r._identityKey;});
 return {projectId:projectId,filename:filename,worksheet:sheet||"",importedAt:Date.now(),records:records,stats:stats(records),schemaVersion:1};
}
function detectSeparator(input){
 var first=input.split(/\r?\n/,1)[0]||"",delims=[",",";","\t"],counts=[0,0,0],quoted=false;
 for(var i=0;i<first.length;i++){var c=first[i];if(c==='"'){if(quoted&&first[i+1]==='"')i++;else quoted=!quoted;}else if(!quoted){var j=delims.indexOf(c);if(j>=0)counts[j]++;}}
 var best=counts.indexOf(Math.max.apply(null,counts));return delims[best];
}
function parseCsv(input){
 input=input.replace(/^\uFEFF/,"");var sep=detectSeparator(input),rows=[],cells=[],cell="",quoted=false;
 for(var i=0;i<input.length;i++){var c=input[i];
 if(c==='"'){if(quoted && input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
 else if(c===sep && !quoted){cells.push(cell);cell="";}
 else if((c==="\r"||c==="\n")&&!quoted){if(c==="\r"&&input[i+1]==="\n")i++;cells.push(cell);if(cells.some(function(x){return x.trim()!=="";}))rows.push(cells);cells=[];cell="";}
 else cell+=c;
 }
 if(quoted)throw Error("CSV inválido: aspas não fechadas.");
 cells.push(cell);if(cells.some(function(x){return x.trim()!=="";}))rows.push(cells);
 if(rows.length<2)throw Error("CSV sem cabeçalho ou registros.");
 var columns=rows.shift().map(function(x){return x.replace(/^\uFEFF/,"").trim();});
 if(columns.some(function(c){return !c;}))throw Error("CSV possui cabeçalho vazio.");
 if(new Set(columns).size!==columns.length)throw Error("CSV contém colunas duplicadas.");
 return rows.map(function(values){var o={};columns.forEach(function(c,i){o[c]=values[i]===undefined?"":values[i];});return o;});
}
function parseTxt(input){
 var rx=/\[REGISTRO\]([\s\S]*?)\[\/REGISTRO\]/gi,items=[],match;
 while((match=rx.exec(input))!==null){
  var text=match[1].trim();if(text.charAt(0)==="{"){try{items.push(JSON.parse(text));continue;}catch(_e){}}
  var o={},last=null;
  text.split(/\r?\n/).forEach(function(line){var m=line.match(/^([\wÀ-ÿ-]+)\s*:\s*(.*)$/);if(m){last=m[1];o[last]=m[2];}else if(last&&line.trim()){o[last]+="\n"+line.trim();}});
  if(Object.keys(o).length)items.push(o);
 }
 if(!items.length)throw Error("TXT estruturado: nenhum bloco [REGISTRO] ... [/REGISTRO] válido.");
 return items;
}
function loadExcel(){
 if(global.XLSX)return Promise.resolve(global.XLSX);
 if(excelLoader)return excelLoader;
 excelLoader=new Promise(function(resolve,reject){
  var tag=document.createElement("script");tag.src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";tag.async=true;
  tag.onload=function(){global.XLSX?resolve(global.XLSX):reject(Error("Biblioteca Excel não inicializou."));};
  tag.onerror=function(){reject(Error("Não foi possível carregar o leitor Excel. Verifique sua conexão."));};
  document.head.appendChild(tag);
 }).catch(function(e){excelLoader=null;throw e;});
 return excelLoader;
}
async function parseFile(file,projectId,sheetName){
 if(!file)throw Error("Selecione um arquivo.");
 if(file.size>15*1024*1024)throw Error("Arquivo acima de 15 MB. Divida o catálogo antes de importar.");
 var name=file.name||"catálogo",ext=name.split(".").pop().toLowerCase(),raw,sheets=[],selected="";
 if(ext==="json"){
  var t=await file.text();try{raw=JSON.parse(t.replace(/^\uFEFF/,""));}catch(e){throw Error("JSON inválido: "+e.message);}
 }else if(ext==="csv"){raw=parseCsv(await file.text());}
 else if(ext==="txt"){raw=parseTxt(await file.text());}
 else if(ext==="xlsx"||ext==="xls"){
  var XLSX=await loadExcel(),buf=await file.arrayBuffer(),book=XLSX.read(buf,{type:"array",cellDates:false,cellFormula:false});
  sheets=book.SheetNames||[];
  if(!sheets.length)throw Error("Planilha Excel sem abas.");
  selected=sheetName&&sheets.includes(sheetName)?sheetName:sheets[0];
  raw=XLSX.utils.sheet_to_json(book.Sheets[selected],{defval:"",raw:false});
 }else throw Error("Formato não suportado. Utilize JSON, CSV, TXT, XLSX ou XLS.");
 var result=createCatalog(raw,projectId,name,selected);result.sheets=sheets;return result;
}
function describe(value){
 if(value===undefined||value===null||value==="")return "Não informado";
 if(typeof value==="object")return JSON.stringify(value,null,2);
 return String(value);
}
function details(record){
 if(!record)return "";
 var lines=[["ID original",record.id_original||"Não informado"],["Nome exato",record.nome_exato_planilha],["Tipo",record.tipo],["Livro",record.livro],["Fase",record.fase||"Não informada"],["Capítulos",describe(record.capitulos)],["Local",describe(record.local_referencia)],["Contexto",describe(record.contexto)],["Idade",describe(record.idade)],["Aparência",describe(record.aparencia)],["Vestimentas",describe(record.vestimentas)],["Observações",describe(record.observacoes)]];
 return '<div class="catalog-details"><div class="catalog-detail-head"><div><small>DETALHES DO REGISTRO</small><h2>'+esc(record.nome_exato_planilha)+'</h2></div><button class="mini" data-cat-action="close-detail">Fechar</button></div>'+
 lines.map(function(d){return '<div class="catalog-detail-row"><b>'+esc(d[0])+'</b><span>'+esc(d[1])+'</span></div>';}).join("")+
 (record.tipo==="Grupo"?'<h3>Integrantes do grupo ('+record.pessoas.length+')</h3>'+record.pessoas.map(function(m,i){return '<div class="catalog-member"><strong>Integrante '+(i+1)+'</strong><pre>'+esc(describe(m))+'</pre></div>';}).join(""):"")+
 (record.validacao.messages.length?'<div class="catalog-issue">'+record.validacao.messages.map(esc).join("<br>")+'</div>':"")+'</div>';
}
function table(catalog,filter,search,selectedId){
 var filtered=catalog.records.filter(function(r){return (filter==="all"||(filter==="groups"?r.tipo==="Grupo":r.tipo!=="Grupo"))&&(!search||[r.nome_exato_planilha,r.id_original,r.fase,r.livro].some(function(v){return String(v||"").toLocaleLowerCase().includes(search.toLocaleLowerCase());}));});
 var selected=catalog.records.find(function(r){return r.id_tecnico===selectedId;});
 return '<div class="catalog-toolbar"><input aria-label="Pesquisar catálogo" id="catalog-search" placeholder="Pesquisar por nome, ID, fase ou livro..." value="'+esc(search)+'"><div class="catalog-filters"><button class="mini '+(filter==="all"?"selected":"")+'" data-cat-filter="all">Todos</button><button class="mini '+(filter==="individuals"?"selected":"")+'" data-cat-filter="individuals">Individuais</button><button class="mini '+(filter==="groups"?"selected":"")+'" data-cat-filter="groups">Grupos</button></div></div><div class="catalog-table-wrap"><table class="catalog-table"><thead><tr><th>ID</th><th>Nome exato</th><th>Tipo</th><th>Fase</th><th>Integrantes</th><th>Validação</th></tr></thead><tbody>'+
 filtered.map(function(r){var st=r.validacao.status;return '<tr tabindex="0" role="button" data-cat-record="'+esc(r.id_tecnico)+'" class="'+(selectedId===r.id_tecnico?"selected":"")+'"><td>'+esc(r.id_original||"—")+'</td><td><strong>'+esc(r.nome_exato_planilha)+'</strong><small>'+esc(r.livro)+'</small></td><td>'+esc(r.tipo)+'</td><td>'+esc(r.fase||"—")+'</td><td>'+(r.tipo==="Grupo"?r.pessoas.length:"1")+'</td><td><span class="catalog-pill '+st+'">'+(st==="valid"?"Válido":st==="warning"?"Aviso":"Erro")+'</span></td></tr>';}).join("")+
 '</tbody></table>'+(filtered.length===0?'<p class="fine">Nenhum registro corresponde aos filtros.</p>':"")+'</div>'+details(selected);
}
function summary(s){return '<div class="catalog-stats">'+[["REGISTROS",s.totalRecords],["INDIVIDUAIS",s.totalIndividuals],["GRUPOS",s.totalGroups],["PESSOAS",s.totalMembers],["AVISOS",s.warningCount],["ERROS",s.errorCount]].map(function(a){return '<div><small>'+a[0]+'</small><strong>'+a[1]+'</strong></div>';}).join("")+'</div>';}
function pageHtml(project,catalog,preview,filter,search,selectedId){
 if(!project)return '<div class="panel"><div class="emblem">▤</div><h2>Selecione um projeto primeiro</h2><p>Os catálogos são armazenados separadamente por projeto.</p><button class="btn" data-page="projects">Ir para Projetos</button></div>';
 var head='<div class="catalog-actions"><button class="btn" data-cat-action="choose">↑ Importar catálogo</button><input type="file" id="catalog-file" hidden accept=".json,.csv,.txt,.xlsx,.xls"><span class="catalog-file-hint">JSON · CSV · TXT · Excel</span></div>';
 var warning='<p class="fine">Os nomes originais são preservados. Uma nova importação substitui o catálogo deste projeto somente após confirmação. Nada será enviado para IA nesta etapa.</p>';
 if(preview){
  var errs=preview.stats.errorCount,opts=(preview.sheets||[]).length>1?'<label class="catalog-sheet">Aba do Excel: <select id="catalog-sheet">'+preview.sheets.map(function(n){return '<option value="'+esc(n)+'" '+(n===preview.worksheet?"selected":"")+'>'+esc(n)+'</option>';}).join("")+'</select></label>':"";
  return head+'<div class="catalog-preview"><h2>Conferir importação: '+esc(preview.filename)+'</h2>'+opts+summary(preview.stats)+'<p><strong>PRÉVIA — ainda não é o catálogo confirmado.</strong> Clique em CONFIRMAR IMPORTAÇÃO para gravar. Se atualizar agora, este rascunho poderá ser recuperado.</p><p>'+(errs?'Há '+errs+' registro(s) com erros críticos. Corrija o arquivo antes de salvar.':'Revise os dados antes de confirmar a importação.')+'</p><div class="catalog-preview-actions"><button class="btn" data-cat-action="confirm" '+(errs?'disabled':'')+'>Confirmar importação</button><button class="btn btn-gray" data-cat-action="cancel">Cancelar</button></div></div>'+table(preview,filter,search,selectedId)+warning;
 }
 if(!catalog)return head+'<div class="panel"><div class="emblem">▤</div><h2>Catálogo vazio</h2><p>Importe os personagens do livro '+esc(project.book)+' a partir de JSON, CSV, TXT estruturado ou Excel. Os integrantes dos grupos serão preservados.</p><button class="btn" data-cat-action="choose">Importar primeiro catálogo</button></div>'+warning;
 return head+'<div class="catalog-info">Arquivo: <strong>'+esc(catalog.filename)+'</strong>'+(catalog.worksheet?' · Aba: '+esc(catalog.worksheet):'')+' · Importado em '+new Date(catalog.importedAt).toLocaleString("pt-BR")+'</div>'+
 summary(catalog.stats)+table(catalog,filter,search,selectedId)+warning;
}
global.BCMCatalog={parseFile:parseFile,createCatalog:createCatalog,normalize:normalize,parseCsv:parseCsv,parseTxt:parseTxt,stats:stats,pageHtml:pageHtml};
})(window);
