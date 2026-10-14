'use client';
import {useCallback,useEffect,useState} from 'react';
import {LockKeyhole,RefreshCcw,Sparkles,ShieldCheck} from 'lucide-react';

type AiStatus='checking'|'ready'|'daily_limit'|'subscription_required'|'provider_not_configured'|'temporarily_unavailable'|'unauthenticated';
const statusMessage:Record<AiStatus,string>={
 checking:'Verificando sua assinatura e a conexão de IA…',
 ready:'IA disponível para sua conta. O plano será criado pelo modelo e validado antes de salvar.',
 daily_limit:'Seu limite diário de gerações foi atingido. Você pode usar seu plano atual.',
 subscription_required:'Acesso premium ainda não liberado nesta conta. A cobrança de assinaturas será configurada em outra etapa.',
 provider_not_configured:'A integração está preparada, mas falta ativar a chave do provedor no servidor.',
 temporarily_unavailable:'Não foi possível verificar o serviço de IA. Tente novamente.',
 unauthenticated:'Entre novamente para acessar a IA.'
};
export default function AiPlanCard({onGenerate,busy}:{onGenerate:()=>Promise<void>;busy:boolean}){
 const [status,setStatus]=useState<AiStatus>('checking');
 const [remaining,setRemaining]=useState<number|null>(null);
 const [consent,setConsent]=useState(false);
 const [refreshing,setRefreshing]=useState(false);
 const check=useCallback(async()=>{
  setRefreshing(true);
  try{
   const res=await fetch('/api/ai/training-plan',{cache:'no-store'});
   const data=await res.json();
   const codes:AiStatus[]=['ready','daily_limit','subscription_required','provider_not_configured','temporarily_unavailable','unauthenticated'];
   setStatus(codes.includes(data.status)?data.status:'temporarily_unavailable');
   setRemaining(typeof data.remaining==='number'?data.remaining:null);
  }catch{setStatus('temporarily_unavailable')}
  finally{setRefreshing(false)}
 },[]);
 useEffect(()=>{void check()},[check]);
 return <section className="pl-ai-card" aria-label="Gerador premium com IA">
  <div className="pl-ai-header"><span className="pl-ai-icon"><Sparkles size={23}/></span><div>
   <span className="pl-kicker">EXPERIÊNCIA PREMIUM · IA REAL</span>
   <h3>Gerar minha ficha com IA</h3>
   <p>O modelo organiza a sequência e explica suas escolhas dentro de uma biblioteca controlada. Séries e repetições seguem os limites verificados pelo sistema.</p>
  </div></div>
  <div className="pl-ai-status"><ShieldCheck size={16}/>{statusMessage[status]}</div>
  {remaining!==null&&<small className="pl-ai-remaining">Gerações restantes hoje: {remaining}</small>}
  <label className="pl-ai-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
   <span>Autorizo enviar ao provedor de IA as respostas mínimas da minha avaliação, incluindo idade, altura e peso, somente para gerar o plano. Entendo que esses dados serão processados por serviço externo e que posso continuar sem IA.</span>
  </label>
  <div className="pl-ai-actions">
   <button type="button" className="pl-ai-generate" disabled={busy||status!=='ready'||!consent}
    onClick={()=>void onGenerate()}><Sparkles size={18}/>{busy?'Gerando e validando…':'Criar com IA'}</button>
   <button type="button" className="pl-ai-recheck" disabled={refreshing||busy} onClick={()=>void check()}>
    <RefreshCcw size={15}/>{refreshing?'Verificando…':'Verificar acesso'}</button>
  </div>
  <p className="pl-ai-footnote"><LockKeyhole size={14}/> A chave fica apenas no servidor. A IA não decide quantos quilos você deve levantar e não oferece diagnóstico. Não é necessário ter assinatura para usar a versão de teste baseada em regras.</p>
 </section>;
}
