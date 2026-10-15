(function(g){
"use strict";
const COMPOSITION={
 individual:"OFFICIAL INDIVIDUAL REFERENCE: technical character modeling sheet in landscape 3:2. Large facial portrait on the LEFT. The SAME PERSON appears on the RIGHT as exactly four full-body views: front, back, left profile, right profile. Bottom horizontal strip: close-up of historically relevant clothing textiles, sandals, belt and accessories. Uniform neutral dark-brown studio background, controlled consistent neutral lighting. Every view must preserve one identity, age, costume and proportions. No text anywhere. The attached composition reference defines LAYOUT ONLY, never copy its depicted person's face, clothing or identity.",
 group:"OFFICIAL GROUP REFERENCE: technical multi-identity modeling sheet in landscape 3:2, consisting of FOUR organized horizontal bands. Row 1: all distinct group members, arranged side by side, clearly legible. Row 2: one aligned facial portrait for EACH member, matching exactly the identity immediately above. Row 3: front, profile and rear full-body views for EACH corresponding member. Row 4: relevant real fabrics, sandals and objects. EXACT MEMBER COUNT; distinguish separate people from camera viewpoints; do not omit, merge, repeat or invent members. Split into complementary sheets if the required member count cannot remain legible. Uniform dark neutral brown studio; no text. Attached group reference controls LAYOUT only; never copy the example people's faces, garments or identities."
};
const BASE="ULTRA-REALISTIC PROFESSIONAL STUDIO PHOTOGRAPHY, natural human facial proportions, realistic skin pores and subtle blemishes, individual facial structures, real hair and beard detail, believable anatomy and fabric drape, historically plausible natural materials, sharp high-fidelity studio detail, neutral white balance, restrained color, soft directional neutral light; retain the character-specific natural skin pigmentation; absolutely no theatrical scene or modern scenery.";
const NEGATIVE="lettering, writing, labels, titles, numbers, watermark, logos, calligraphy, glyphs, inscriptions, credits, headers, footer, names printed on image, cartoon, illustration, comic, anime, painting, drawing, digital art, 3D render, CGI appearance, plastic skin, artificial yellow/orange color cast, oversaturated warm filter, fashionable modern wardrobe, sneakers, modern objects, narrative environment, extra limbs, extra fingers, identity mixing, duplicate members, identical faces for distinct people, blurry low detail, distorted proportions, layout changes";
const sections={
 appearance:[["genero_visual","Visual presentation"],["idade_visual","Visual age"],["pele","Natural skin tone"],["rosto","Face"],["olhos","Eyes"],["nariz","Nose"],["mandibula","Jaw"],["cabelo","Hair"],["barba","Beard"],["porte_fisico","Body type"],["caracteristicas_especiais","Distinctive features"],["descricao_geral","Appearance notes"]],
 clothing:[["tunica","Tunic"],["manto","Cloak"],["cinto","Belt"],["calcados","Footwear"],["tecidos","Textiles"],["cores","Colors"],["adornos","Adornments"],["acessorios","Accessories"],["descricao_geral","Clothing notes"]],
 context:[["povo","People"],["origem","Origin"],["epoca","Period"],["funcao","Function"],["referencias_biblicas","Biblical references"],["contexto_historico","Historical context"]]
};
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function value(f,section,key){const v=f&&f[section]&&f[section][key];return v&&v.value!=null?String(v.value).trim():"";}
function makeLines(f,fields,section){let known=0;const lines=fields.map(([key,label])=>{const v=value(f,section,key);if(!v)return null;known++;const orig=f[section][key].provenance||"unknown";return label+": "+v+" [source: "+(orig==="manual"?"user-edited":orig==="catalog"?"catalog":orig==="historical"?"documented-history":orig==="biblical"?"biblical-text":orig==="estimate"?"visual-estimate":"unverified")+"]";}).filter(Boolean);return {known,lines};}
function fichaDescription(f){const a=makeLines(f,sections.appearance,"aparencia"),c=makeLines(f,sections.clothing,"vestimentas"),cx=makeLines(f,sections.context,"contexto");return {
 text:["PHYSICAL CHARACTERISTICS:",...(a.lines.length?a.lines:["No physical characteristics documented in the catalog; do not claim specific features are historically documented."]), "CLOTHING & MATERIALS:",...(c.lines.length?c.lines:["No specific garments documented; choose conservative historically plausible attire as a visual interpretation."]), "HISTORICAL CONTEXT:",...(cx.lines.length?cx.lines:["No documented cultural context supplied; treat visual additions as interpretations, not confirmed facts."])].join("\n"),
 appearanceCount:a.known,clothingCount:c.known
};}
function stableHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,"0");}
function groupFichas(record,master,all){return (all||[]).filter(f=>f.recordId===record.id_tecnico&&f.parentId===master.id&&f.kind==="Integrante").sort((a,b)=>a.memberIndex-b.memberIndex);}
function fingerprint(record,related,model){return stableHash(JSON.stringify({record,fichas:related.map(f=>({id:f.id,updatedAt:f.updatedAt,identificacao:f.identificacao,aparencia:f.aparencia,vestimentas:f.vestimentas,contexto:f.contexto})),model:model?{id:model.modelId,updatedAt:model.updatedAt,filename:model.filename,size:model.size}:null,engine:"BCM-PROMPT-0.5.0"}));}
function prepareOne(record,fichas,models,existing){
 const isGroup=record.tipo==="Grupo",model=models&&models[isGroup?"group":"individual"],template=isGroup?"official_group":"official_individual";
 const master=(fichas||[]).find(f=>f.recordId===record.id_tecnico&&f.kind!=="Integrante");
 const members=isGroup&&master?groupFichas(record,master,fichas):[];
 const related=master?[master,...members]:[];
 let messages=[],errors=[],warnings=[];
 if(!master)errors.push("Ficha técnica principal ausente. Volte à aba Pesquisa & Fichas.");
 if(!model||!g.BCMModels||!g.BCMModels.valid(model)||model.modelId!==template)errors.push("Modelo visual oficial indisponível ou não validado.");
 if(isGroup){
  if(!Array.isArray(record.pessoas)||record.pessoas.length===0)errors.push("Grupo sem integrantes no catálogo.");
  if(members.length!==(record.pessoas||[]).length)errors.push("Nem todos os integrantes possuem ficha técnica.");
  const indexes=new Set(members.map(m=>m.memberIndex));
  if(indexes.size!==members.length||(record.pessoas||[]).some((_,i)=>!indexes.has(i)))errors.push("Vínculo entre integrantes e fichas inconsistente.");
  if(Number(record.quantidade_integrantes)!==(record.pessoas||[]).length)errors.push("Quantidade declarada difere da lista de integrantes.");
 }
 if(record.validacao&&record.validacao.status==="error")errors.push("O registro possui erros críticos de validação no catálogo.");
 if(master){
  const md=fichaDescription(master);if(!isGroup&&(md.appearanceCount<2||md.clothingCount===0))warnings.push("Ficha com poucos atributos físicos ou de figurino: revisar antes de gerar.");
  if(isGroup)members.forEach((f,i)=>{const x=fichaDescription(f);if(x.appearanceCount<2||x.clothingCount===0)warnings.push("Integrante "+(i+1)+" possui características incompletas.");});
 }
 const source=[ "BIBLICAL CHARACTER MODELING — TECHNICAL PHOTOGRAPHY SHEET",
 "Exact catalog name: "+String(record.nome_exato_planilha||record.nome||""),
 "Original record ID: "+String(record.id_original||""),
 "Book: "+String(record.livro||""),"Phase: "+String(record.fase||"Not stated"),
 "Biblical locus: "+String(record.local_referencia||record.capitulos||"Not provided"),
 "Character modeling ONLY; this is a reference sheet, never a scene or storyboard." ];
 if(master){
  if(isGroup){
   source.push("GROUP: exactly "+members.length+" DISTINCT INDIVIDUAL PEOPLE, each with a stable unique facial identity. Multiple views of one person never count as other group members.");
   if(value(master,"contexto","contexto_historico"))source.push("Shared context: "+value(master,"contexto","contexto_historico"));
   members.forEach((m,i)=>source.push("========== MEMBER "+(i+1)+" OF "+members.length+" ==========\nCatalog member name: "+String(m.identificacao.nome_exato)+"\nMember original ID: "+String(m.identificacao.id_original)+"\n"+fichaDescription(m).text));
  }else source.push("PERSON: "+String(master.identificacao.nome_exato)+"\n"+fichaDescription(master).text);
 }
 source.push("OFFICIAL MODEL ID: "+template,COMPOSITION[isGroup?"group":"individual"],BASE,"NEGATIVE RESTRICTIONS: "+NEGATIVE);
 const notes=existing&&typeof existing.userNotes==="string"?existing.userNotes:"";
 if(notes.trim())source.push("ADDITIONAL USER NOTES (subject to all technical and historical constraints):\n"+notes.trim());
 if(errors.length)messages=errors.concat(warnings);else messages=warnings;
 return {recordId:record.id_tecnico,characterName:String(record.nome_exato_planilha||record.nome||""),isGroup,templateId:template,memberCount:isGroup?members.length:1,
 fingerprint:fingerprint(record,related,model),status:errors.length?"error":warnings.length?"warning":"prepared",validationMessages:messages,
 fullPrompt:source.join("\n\n"),negativePrompt:NEGATIVE,userNotes:notes,updatedAt:Date.now()};
}
function prepareAll(catalog,bundle,models,previous){
 if(!catalog||!Array.isArray(catalog.records))throw Error("Importe e confirme um catálogo primeiro.");
 if(!bundle||!Array.isArray(bundle.fichas))throw Error("Prepare as fichas técnicas antes dos prompts.");
 if(bundle.catalogImportedAt!==catalog.importedAt)throw Error("As fichas estão desatualizadas em relação ao catálogo. Atualize-as antes.");
 const old=new Map((previous&&previous.items||[]).map(i=>[i.recordId,i]));
 const items=catalog.records.map(r=>prepareOne(r,bundle.fichas,models,old.get(r.id_tecnico)));
 return {projectId:catalog.projectId,catalogImportedAt:catalog.importedAt,items,updatedAt:Date.now(),schemaVersion:1};
}
function currentItem(r,bundle,models,item){if(!item)return false;const master=(bundle&&bundle.fichas||[]).find(f=>f.recordId===r.id_tecnico&&f.kind!=="Integrante"),all=master?(r.tipo==="Grupo"?[master,...groupFichas(r,master,bundle.fichas)]:[master]):[];const model=models&&(r.tipo==="Grupo"?models.group:models.individual);return item.fingerprint===fingerprint(r,all,model);}
function stats(catalog,bundle,models,prompts){
 const counts={total:catalog&&catalog.records?catalog.records.length:0,prepared:0,warning:0,error:0,pending:0,stale:0};
 const map=new Map((prompts&&prompts.items||[]).map(p=>[p.recordId,p]));
 (catalog&&catalog.records||[]).forEach(r=>{const p=map.get(r.id_tecnico);if(!p)counts.pending++;else if(!currentItem(r,bundle,models,p))counts.stale++;else if(p.status==="error")counts.error++;else if(p.status==="warning")counts.warning++;else counts.prepared++;});
 return counts;
}
function infoFor(record,prompts){return (prompts&&prompts.items||[]).find(x=>x.recordId===record.id_tecnico);}
function pageHtml(project,catalog,bundle,models,prompts,selected,filter,search){
 if(!project)return '<div class="panel"><div class="emblem">⌘</div><h2>Selecione um projeto</h2><p>Os prompts são separados por projeto.</p><button class="btn" data-page="projects">Abrir Projetos</button></div>';
 if(!catalog)return '<div class="panel"><div class="emblem">⌘</div><h2>Catálogo necessário</h2><p>Importe e confirme o catálogo antes de preparar prompts.</p><button class="btn" data-page="catalog">Abrir Catálogo</button></div>';
 const s=stats(catalog,bundle,models,prompts);
 const toolbar='<div class="prompt-toolbar"><button class="btn" data-prompt-action="prepare">PREPARAR / ATUALIZAR PROMPTS</button><span>Sem chamadas de IA nesta etapa. O texto final é montado a partir das fichas reais.</span></div>';
 const counters='<div class="prompt-counters">'+[["REGISTROS",s.total],["PREPARADOS",s.prepared],["COM AVISO",s.warning],["COM ERRO",s.error],["PENDENTES",s.pending],["DESATUALIZADOS",s.stale]].map(([k,v])=>'<div><small>'+k+'</small><strong>'+v+'</strong></div>').join("")+'</div>';
 const results=catalog.records.filter(r=>(filter==="all"||(filter==="individual"&&r.tipo!=="Grupo")||(filter==="group"&&r.tipo==="Grupo"))&&(!search||[r.nome_exato_planilha,r.id_original,r.fase].some(v=>String(v||"").toLocaleLowerCase().includes(search.toLocaleLowerCase()))));
 const list='<div class="prompt-list"><div class="prompt-filter"><input id="prompt-search" placeholder="Pesquisar nome, ID ou fase..." value="'+esc(search)+'"><div>'+[["all","Todos"],["individual","Individual"],["group","Grupo"]].map(([v,n])=>'<button class="mini '+(filter===v?"selected":"")+'" data-prompt-filter="'+v+'">'+n+'</button>').join("")+'</div></div><div class="prompt-table-wrap"><table class="prompt-table"><thead><tr><th>PERSONAGEM</th><th>TIPO</th><th>MODELO OFICIAL</th><th>ESTADO REAL</th><th></th></tr></thead><tbody>'+
 results.map(r=>{const p=infoFor(r,prompts),st=!p?"pending":!currentItem(r,bundle,models,p)?"stale":p.status;const names={prepared:"PREPARADO",warning:"COM AVISO",error:"ERRO BLOQUEANTE",pending:"PENDENTE",stale:"DESATUALIZADO"};return '<tr><td><strong>'+esc(r.nome_exato_planilha||r.nome)+'</strong><small>'+esc(r.id_original)+' · '+esc(r.fase||"Sem fase")+'</small></td><td>'+esc(r.tipo)+'</td><td>'+ (r.tipo==="Grupo"?"official_group":"official_individual")+'</td><td><span class="prompt-state '+st+'">'+names[st]+'</span></td><td><button class="mini" data-prompt-open="'+esc(r.id_tecnico)+'">VER PROMPT</button></td></tr>';}).join("")+'</tbody></table></div></div>';
 const rec=catalog.records.find(r=>r.id_tecnico===selected),item=rec?infoFor(rec,prompts):null,stale=rec&&item&&!currentItem(rec,bundle,models,item);
 let inspect="";
 if(rec){
 const msgs=item&&item.validationMessages.length?'<div class="prompt-messages">'+item.validationMessages.map(m=>'<p>'+esc(m)+'</p>').join("")+'</div>':"";
 inspect='<section class="prompt-inspector"><div class="prompt-inspector-head"><div><small>INSPEÇÃO DO PROMPT REAL</small><h2>'+esc(rec.nome_exato_planilha||rec.nome)+'</h2><p>'+esc(rec.id_original)+' · '+esc(rec.fase||"Sem fase")+'</p></div><button class="mini" data-prompt-action="close">Fechar</button></div>'+
 (stale?'<div class="prompt-warn">Os dados mudaram desde a preparação. Atualize os prompts antes de usar o texto.</div>':"")+
 (!item?'<div class="prompt-warn">Prompt ainda não preparado. Clique em PREPARAR PROMPTS.</div>':msgs+
 '<h3>PROMPT CONSOLIDADO</h3><pre class="prompt-pre">'+esc(item.fullPrompt)+'</pre><h3>RESTRIÇÕES NEGATIVAS</h3><pre class="prompt-pre negative">'+esc(item.negativePrompt)+'</pre>')+
 '<form id="prompt-notes-form" data-prompt-id="'+esc(rec.id_tecnico)+'"><label>Observações adicionais para o prompt<textarea name="userNotes" rows="3" placeholder="Observações opcionais...">'+esc(item?item.userNotes:"")+'</textarea></label><div class="prompt-actions"><button class="btn" type="submit">SALVAR OBSERVAÇÕES</button>'+(item&&!stale&&item.status!=="error"?'<button type="button" class="btn btn-gray" data-prompt-copy="'+esc(rec.id_tecnico)+'">COPIAR PROMPT</button>':"")+'</div></form></section>';
 }
 const notice='<p class="fine">Referências de imagem: a verificação confirma que estão salvas e ativas; elas <strong>não estão anexadas ao texto copiado</strong>. O envio real de imagens ao modelo será implementado na Produção. A composição final é probabilística e exige auditoria visual.</p>';
 return toolbar+counters+list+inspect+notice;
}
g.BCMPrompts={prepareOne,prepareAll,stats,currentItem,infoFor,pageHtml,BASE,NEGATIVE,COMPOSITION};
})(window);