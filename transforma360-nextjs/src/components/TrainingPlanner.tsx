'use client';

import Link from 'next/link';
import {useCallback,useEffect,useMemo,useState, type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,CalendarDays,Check,CheckCircle2,ChevronRight,ClipboardCheck,Dumbbell,Info,LockKeyhole,RefreshCw,ShieldAlert,Sparkles,Trash2,TrendingUp} from 'lucide-react';
import {createClient} from '@/lib/supabase/browser';
import {makeTrainingBlueprint,recommendationForSession,validateAssessment,
  type Equipment,type TrainingAssessment,type TrainingBlueprint,type TrainingCheckin} from '@/lib/training-engine';
import {goalLabels,type Goal,type Place} from '@/types/models';

type StoredPlan={id:string;blueprint:TrainingBlueprint;created_at:string};
type Props={userId:string};
const initial:TrainingAssessment={goal:'consistencia',experience:'iniciante',training_place:'academia',equipment:[],days_per_week:3,minutes_per_session:45,age_confirmed:false,readiness:'ready'};
const placeLabels:Record<Place,string>={academia:'Academia',casa:'Em casa',ar_livre:'Ao ar livre'};
const shortDate=(date:string)=>new Date(date).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});

export default function TrainingPlanner({userId}:Props){
  const [assessment,setAssessment]=useState<TrainingAssessment>(initial);
  const [consent,setConsent]=useState(false);
  const [plan,setPlan]=useState<StoredPlan|null>(null);
  const [checkins,setCheckins]=useState<TrainingCheckin[]>([]);
  const [week,setWeek]=useState(1);
  const [editing,setEditing]=useState(true);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [feedback,setFeedback]=useState('');
  const [isError,setIsError]=useState(false);
  const completeCount=checkins.filter(c=>c.week_number===week).length;
  const notice=(message:string,error=false)=>{setFeedback(message);setIsError(error)};
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const client=createClient();
      const [assessmentResult,planResult]=await Promise.all([
        client.from('training_assessments').select('goal,experience,training_place,equipment,days_per_week,minutes_per_session,age_confirmed,readiness,consent_accepted_at').eq('user_id',userId).maybeSingle(),
        client.from('training_plans').select('id,blueprint,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(1)
      ]);
      if(assessmentResult.error)throw assessmentResult.error;
      if(planResult.error)throw planResult.error;
      if(assessmentResult.data){
        const a=assessmentResult.data;
        setAssessment({goal:a.goal as Goal,experience:a.experience as TrainingAssessment['experience'],
          training_place:a.training_place as Place,equipment:(a.equipment||[]) as Equipment[],
          days_per_week:a.days_per_week,minutes_per_session:a.minutes_per_session,
          age_confirmed:a.age_confirmed,readiness:a.readiness as TrainingAssessment['readiness']});
        setConsent(Boolean(a.consent_accepted_at));
      }
      const latest=(planResult.data?.[0]||null) as StoredPlan|null;
      setPlan(latest);
      setEditing(!latest);
      if(latest){
        const result=await client.from('training_checkins').select('id,session_index,week_number,effort,completed_at')
          .eq('user_id',userId).eq('plan_id',latest.id).order('week_number');
        if(result.error)throw result.error;
        setCheckins((result.data||[]) as TrainingCheckin[]);
      }else setCheckins([]);
      setIsError(false);
    }catch(err){notice('Não foi possível consultar o plano na nuvem: '+(err instanceof Error?err.message:'falha inesperada'),true)}
    finally{setLoading(false)}
  },[userId]);
  useEffect(()=>{void load()},[load]);
  const planValid=useMemo(()=>{
    if(!plan)return false;
    const b=plan.blueprint;
    return b?.version===1&&b.weeks===4&&Array.isArray(b.days)&&b.days.length>0&&b.days.length<=5
      &&b.days.every(d=>Array.isArray(d.exercises)&&d.exercises.length>0);
  },[plan]);
  const generate=async(e:FormEvent)=>{
    e.preventDefault();
    const err=validateAssessment(assessment);
    if(err){notice(err,true);return}
    if(!consent){notice('Leia e aceite o uso dos dados mínimos da avaliação para criar o plano.',true);return}
    setBusy(true);notice('');
    try {
      const client=createClient();
      const blueprint=makeTrainingBlueprint(assessment);
      const {error:assessmentError}=await client.from('training_assessments').upsert({
        user_id:userId,...assessment,consent_accepted_at:new Date().toISOString(),updated_at:new Date().toISOString()
      },{onConflict:'user_id'});
      if(assessmentError)throw assessmentError;
      const {data,error}=await client.from('training_plans').insert({user_id:userId,blueprint}).select('id,blueprint,created_at').single();
      if(error)throw error;
      if(!data?.id)throw new Error('O Supabase não confirmou o novo plano.');
      setPlan(data as StoredPlan);setCheckins([]);setWeek(1);setEditing(false);
      notice('Plano de quatro semanas salvo na sua conta. Revise os exercícios e adapte ao seu conforto.');
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(err){notice('O plano não foi confirmado na nuvem: '+(err instanceof Error?err.message:'erro inesperado'),true)}
    finally{setBusy(false)}
  };
  const markSession=async(sessionIndex:number,effort:TrainingCheckin['effort'])=>{
    if(!plan||busy)return;
    setBusy(true);notice('');
    try{
      const client=createClient();
      const {error}=await client.from('training_checkins').upsert({
        user_id:userId,plan_id:plan.id,session_index:sessionIndex,week_number:week,effort
      },{onConflict:'user_id,plan_id,session_index,week_number'});
      if(error)throw error;
      const {data,error:fetchError}=await client.from('training_checkins')
        .select('id,session_index,week_number,effort,completed_at')
        .eq('user_id',userId).eq('plan_id',plan.id).order('week_number');
      if(fetchError)throw fetchError;
      setCheckins((data||[]) as TrainingCheckin[]);
      notice('Sessão confirmada no Supabase. O próximo ajuste considera o esforço informado.');
    }catch(err){notice('O Supabase não confirmou o registro: '+(err instanceof Error?err.message:'erro inesperado'),true)}
    finally{setBusy(false)}
  };
  const deleteTraining=async()=>{
    if(busy||!window.confirm('Apagar DEFINITIVAMENTE suas avaliações, planos e conclusões de treino desta área? Os registros manuais da aba Treinos continuarão salvos.'))return;
    setBusy(true);notice('');
    try{
      const client=createClient();
      const result=await client.from('training_plans').delete().eq('user_id',userId);
      if(result.error)throw result.error;
      const assess=await client.from('training_assessments').delete().eq('user_id',userId);
      if(assess.error)throw assess.error;
      setPlan(null);setCheckins([]);setAssessment(initial);setConsent(false);setWeek(1);setEditing(true);
      notice('Avaliação, planos e conclusões removidos da sua conta.');
    }catch(err){notice('Não foi possível concluir a exclusão remota: '+(err instanceof Error?err.message:'erro inesperado'),true)}
    finally{setBusy(false)}
  };
  const toggleEquipment=(item:Equipment)=>setAssessment(a=>({...a,equipment:a.equipment.includes(item)?a.equipment.filter(x=>x!==item):[...a.equipment,item]}));
  const showForm=editing||!plan;
  return <main className="pl-shell">
    <div className="pl-container">
      <header className="pl-header">
        <Link href="/app" className="pl-back"><ArrowLeft size={17}/> Voltar ao painel</Link>
        <Link href="/" className="pl-brand">TRANSFORMA<span>360</span></Link>
      </header>
      <div className="pl-hero">
        <span className="pl-eyebrow"><Sparkles size={15}/> PLANEJAMENTO INTELIGENTE • FASE 3.3</span>
        <h1>Seu treino. Seu ritmo.<br/><em>Um plano para evoluir.</em></h1>
        <p>Organize uma rotina de quatro semanas com base nas suas escolhas e acompanhe a consistência. Sem promessas irreais, sem dados inventados.</p>
        <div className="pl-hero-stats">
          <span><ShieldAlert size={16}/> Triagem antes do plano</span><span><CalendarDays size={16}/> 4 semanas</span><span><LockKeyhole size={16}/> Dados privados</span>
        </div>
      </div>
      {feedback&&<p className={'pl-alert '+(isError?'pl-alert-error':'pl-alert-ok')} role="status">{feedback}</p>}
      {loading?<section className="pl-panel"><p>Carregando seus dados protegidos no Supabase…</p></section>:<>
        {plan&&planValid&&!showForm&&<div className="pl-toolbar"><div><span className="pl-kicker">PROGRAMA ATIVO</span><h2>Plano de {plan.blueprint.weeks} semanas</h2><p>Criado em {shortDate(plan.created_at)} · {plan.blueprint.days.length} sessões por semana · {plan.blueprint.createdFor.minutes_per_session} min disponíveis</p></div><button className="pl-outline" type="button" onClick={()=>{setEditing(true);notice('')}}><RefreshCw size={16}/> Reavaliar e gerar novo plano</button></div>}
        {plan&&!planValid&&<p className="pl-alert pl-alert-error">Este plano possui uma versão não reconhecida. Reavalie antes de utilizá-lo.</p>}
        {showForm?<section className="pl-panel">
          <div className="pl-section-head"><div><span className="pl-kicker">01 · SEU PONTO DE PARTIDA</span><h2>Avaliação inicial</h2><p>Responda somente o necessário para organizar a rotina. Não informe doenças, medicamentos ou diagnósticos.</p></div><ClipboardCheck size={30}/></div>
          <form onSubmit={e=>void generate(e)} className="pl-form">
            <div className="pl-fields">
              <label>Objetivo principal<select value={assessment.goal} onChange={e=>setAssessment(a=>({...a,goal:e.target.value as Goal}))}>{Object.entries(goalLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
              <label>Experiência com exercícios<select value={assessment.experience} onChange={e=>setAssessment(a=>({...a,experience:e.target.value as TrainingAssessment['experience']}))}><option value="iniciante">Iniciante ou retornando após pausa</option><option value="intermediario">Já treino com regularidade</option><option value="avancado">Experiente, com boa técnica</option></select></label>
              <label>Onde prefere treinar<select value={assessment.training_place} onChange={e=>setAssessment(a=>({...a,training_place:e.target.value as Place}))}>{Object.entries(placeLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
              <label>Dias disponíveis por semana<select value={assessment.days_per_week} onChange={e=>setAssessment(a=>({...a,days_per_week:Number(e.target.value)}))}>{[1,2,3,4,5].map(day=><option value={day} key={day}>{day} {day===1?'dia':'dias'}</option>)}</select></label>
              <label>Tempo disponível por sessão<select value={assessment.minutes_per_session} onChange={e=>setAssessment(a=>({...a,minutes_per_session:Number(e.target.value)}))}>{[20,30,45,60,90].map(m=><option value={m} key={m}>{m} minutos</option>)}</select></label>
            </div>
            {assessment.training_place!=='academia'&&<fieldset className="pl-fieldset"><legend>Equipamentos que realmente possui (opcional)</legend><label><input type="checkbox" checked={assessment.equipment.includes('halteres')} onChange={()=>toggleEquipment('halteres')}/> Halteres</label><label><input type="checkbox" checked={assessment.equipment.includes('elasticos')} onChange={()=>toggleEquipment('elasticos')}/> Elásticos de resistência</label></fieldset>}
            <fieldset className="pl-fieldset"><legend>Triagem de segurança (sem coletar diagnósticos)</legend><label><input type="radio" name="readiness" checked={assessment.readiness==='ready'} onChange={()=>setAssessment(a=>({...a,readiness:'ready'}))}/> Não conheço impedimento atual e posso praticar atividade leve com segurança.</label><label><input type="radio" name="readiness" checked={assessment.readiness==='requires_clearance'} onChange={()=>setAssessment(a=>({...a,readiness:'requires_clearance'}))}/> Tenho dúvidas, sintomas, restrição ou orientação para avaliação profissional.</label><small>Se houver dor no peito, desmaio, falta de ar desproporcional ou outra preocupação, não inicie um treino pelo aplicativo: procure orientação clínica apropriada.</small></fieldset>
            <div className="pl-consent">
              <label><input type="checkbox" checked={assessment.age_confirmed} onChange={e=>setAssessment(a=>({...a,age_confirmed:e.target.checked}))}/> Confirmo que tenho pelo menos 18 anos.</label>
              <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Concordo com o armazenamento das minhas respostas e do plano na minha conta, para planejamento de exercícios. Posso apagar esses dados nesta tela.</label>
              <p>O resultado é uma <strong>sugestão educativa automatizada</strong>, não avaliação clínica, diagnóstico ou acompanhamento individual por profissional de educação física. A comercialização depende de revisão de privacidade e requisitos legais.</p>
            </div>
            {assessment.readiness==='requires_clearance'&&<div className="pl-alert pl-alert-error"><ShieldAlert size={19}/> Por segurança, a geração fica bloqueada até que você tenha orientação profissional apropriada.</div>}
            <button className="pl-primary" disabled={busy||assessment.readiness!=='ready'||!consent||!assessment.age_confirmed} type="submit"><Sparkles size={19}/>{busy?'Salvando na nuvem…':'Gerar meu plano de 4 semanas'}<ArrowRight size={17}/></button>
          </form>
          {plan&&<button type="button" className="pl-text-button" onClick={()=>setEditing(false)}>Voltar ao plano atual</button>}
        </section>:null}
        {plan&&planValid&&!showForm&&<div className="pl-plan">
          <section className="pl-panel"><div className="pl-section-head"><div><span className="pl-kicker">02 · PROGRESSÃO GRADUAL</span><h2>Suas quatro semanas</h2><p>Marque suas sessões concluídas. As sugestões de ajuste usam apenas seus registros.</p></div><TrendingUp size={27}/></div>
            <div className="pl-weeks">{[1,2,3,4].map(w=><button key={w} type="button" className={'pl-week '+(week===w?'selected':'')} onClick={()=>setWeek(w)}><span>SEMANA</span><strong>{String(w).padStart(2,'0')}</strong><small>{checkins.filter(c=>c.week_number===w).length} / {plan.blueprint.days.length} sessões</small></button>)}</div>
            <div className="pl-progress"><span style={{width:(completeCount/plan.blueprint.days.length*100)+'%'}}/></div>
            <p className="pl-week-note">{plan.blueprint.weeklyProgression[week-1]}</p>
          </section>
          <div className="pl-workouts">{plan.blueprint.days.map((d)=>{
            const done=checkins.find(c=>c.week_number===week&&c.session_index===d.index);
            return <article className="pl-panel pl-day" key={d.index}>
              <div className="pl-day-header"><div><span className="pl-kicker">SESSÃO {String(d.index+1).padStart(2,'0')}</span><h3>{d.title}</h3><p>{d.focus} · até {d.duration} min disponíveis</p></div>{done?<span className="pl-done"><CheckCircle2 size={16}/> Concluída</span>:<span className="pl-pending">Pendente</span>}</div>
              <p className="pl-note"><Info size={16}/>{d.warmup}</p>
              <div className="pl-exercise-list">{d.exercises.map((ex,j)=><div className="pl-exercise" key={ex.id}><span className="pl-count">{j+1}</span><div><strong>{ex.name}</strong><small>{ex.tip}</small></div><div className="pl-exercise-meta"><b>{ex.sets} × {ex.reps}</b><small>{ex.restSeconds>0?'Descanso '+ex.restSeconds+'s':'Ritmo confortável'}</small></div></div>)}</div>
              <p className="pl-recommendation"><Sparkles size={16}/>{recommendationForSession(checkins,d.index,week)}</p>
              <div className="pl-complete"><span>{done?'Esforço registrado: '+({leve:'Leve',adequado:'Adequado',dificil:'Difícil'} as const)[done.effort]:'Concluiu? Registre como foi a sessão:'}</span><div className="pl-effort-buttons">{(['leve','adequado','dificil'] as const).map(eff=><button key={eff} type="button" disabled={busy} className={done?.effort===eff?'chosen':''} onClick={()=>void markSession(d.index,eff)}>{eff==='leve'?'Leve':eff==='adequado'?'Adequado':'Difícil'}{done?.effort===eff&&<Check size={14}/>}</button>)}</div></div>
            </article>
          })}</div>
          <section className="pl-panel pl-safety"><div><ShieldAlert size={24}/><h2>Segurança e limites do plano</h2></div><ul>{plan.blueprint.safety.map(t=><li key={t}>{t}</li>)}</ul><p>{plan.blueprint.rationale}</p><div className="pl-footer-actions"><Link href="/app" className="pl-outline"><ArrowLeft size={16}/> Painel e histórico manual</Link><button type="button" className="pl-danger" onClick={()=>void deleteTraining()} disabled={busy}><Trash2 size={17}/> Apagar avaliação e planos</button></div></section>
        </div>}
        {!plan&&<p className="pl-footnote">Seus treinos anteriores continuam no painel. O novo plano é separado do histórico manual e só aparece após você confirmar o salvamento.</p>}
      </>}
    </div>
  </main>;
}
