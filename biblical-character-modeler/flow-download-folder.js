(function(g){
"use strict";
// Acesso opt-in à pasta LOCAL. Nenhum arquivo é enviado à rede.
// O Chrome só permite acessar arquivos depois da autorização explícita do usuário.
let directory=null;
let matches=[];
const IMAGE_EXT=/\.(png|jpe?g|webp)$/i;
const MAX_ENTRIES=3000;
const MAX_CANDIDATES=350;
const MAX_RESULTS=18;
const MAX_FILE_SIZE=25*1024*1024;
function available(){return typeof g.showDirectoryPicker==="function"&&g.isSecureContext;}
function setHandle(h){
 if(!h||h.kind!=="directory"||typeof h.values!=="function")throw Error("A pasta selecionada não oferece leitura autorizada.");
 directory=h;
 matches=[];
}
function getName(){return directory?directory.name:"";}
function hasHandle(){return !!directory;}
function selectDirectory(){
 if(!available())throw Error("Seu Chrome não disponibiliza seleção de pastas. Use IMPORTAR IMAGEM GERADA, que aceita JPG, PNG e WebP.");
 // Chamada sincronamente no clique para preservar a ativação do usuário.
 return g.showDirectoryPicker({id:"bcm-flow-downloads",mode:"read"});
}
function authorize(){
 if(!directory)throw Error("Selecione a pasta onde o Chrome salva as imagens do Flow.");
 if(typeof directory.requestPermission!=="function")return Promise.resolve("granted");
 // Iniciar a autorização no próprio clique, antes de qualquer processamento assíncrono.
 return directory.requestPermission({mode:"read"});
}
async function scan(){
 if(!directory)throw Error("Nenhuma pasta autorizada.");
 const permission=await directory.queryPermission({mode:"read"});
 if(permission!=="granted")throw Error("Acesso à pasta não autorizado. Clique em BUSCAR IMAGENS para solicitar novamente.");
 matches=[];
 const candidates=[];
 let scanned=0,imagesFound=0;
 for await(const entry of directory.values()){
  if(++scanned>MAX_ENTRIES)throw Error("Esta pasta contém arquivos demais para o teste (mais de 3.000 entradas). Escolha uma subpasta dedicada às imagens do Flow.");
  if(entry.kind!=="file"||!IMAGE_EXT.test(entry.name))continue;
  if(++imagesFound>MAX_CANDIDATES)throw Error("Muitas imagens na pasta (mais de 350). Escolha uma subpasta com menos arquivos para evitar travamentos.");
  candidates.push(entry);
 }
 const results=[];
 for(let i=0;i<candidates.length;i+=12){
  const batch=await Promise.all(candidates.slice(i,i+12).map(async(entry)=>{
   try{
    const file=await entry.getFile();
    if(file.size<100||file.size>MAX_FILE_SIZE)return null;
    return {id:g.crypto.randomUUID(),name:file.name,size:file.size,lastModified:file.lastModified,handle:entry};
   }catch{return null;}
  }));
  results.push(...batch.filter(Boolean));
 }
 results.sort((a,b)=>b.lastModified-a.lastModified);
 matches=results.slice(0,MAX_RESULTS);
 return {entriesScanned:scanned,totalImages:results.length,candidates:matches.map(({id,name,size,lastModified})=>({id,name,size,lastModified}))};
}
async function getFile(id){
 const matched=matches.find(m=>m.id===id);
 if(!matched)throw Error("A imagem não está mais na lista. Busque novamente na pasta.");
 const f=await matched.handle.getFile();
 if(f.size>MAX_FILE_SIZE)throw Error("O download ultrapassa o limite de 25 MB.");
 return f;
}
g.BCMFolder={available,setHandle,getName,hasHandle,selectDirectory,authorize,scan,getFile};
})(window);