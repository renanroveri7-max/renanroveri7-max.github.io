'use client';

import {useState, type FormEvent} from 'react';
import {CheckCircle2,Clock3,History,Plus,Save,Trash2,TrendingUp} from 'lucide-react';
import {createClient} from '@/lib/supabase/browser';
import type {ExerciseSuggestion} from '@/lib/training-engine';
import {getExerciseAdvice,getExerciseHistory,validateSetEntry,type ExerciseSetLog,type SetEntry} from '@/lib/exercise-history';

type Props={
  userId:string;
  planId:string;
  week:number;
  sessionIndex:number;
  exercises:ExerciseSuggestion[];
  logs:ExerciseSetLog[];
  onChanged:()=>Promise<void>;
};
type SetProps=Omit<Props,'exercises'> & {exercise:ExerciseSuggestion;setNumber:number};
const isTimedExercise=(movement:string)=>movement==='cardio'||movement==='mobilidade';
const showWeight=(value:number|null)=>value===null?'Sem carga':value.toLocaleString('pt-BR',{maximumFractionDigits:2})+' kg';

function SetEditor({userId,planId,week,sessionIndex,exercise,setNumber,logs,onChanged}:SetProps){
  const [draftValue,setDraftValue]=useState<string|null>(null);
  const [draftLoad,setDraftLoad]=useState<string|null>(null);
  const [draftRpe,setDraftRpe]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState('');
  const existing=logs.find(r=>r.week_number===week&&r.session_index===sessionIndex&&r.exercise_id===exercise.id&&r.set_number===setNumber);
  const timed=isTimedExercise(exercise.movement);
  const value=draftValue??(existing?String(timed?existing.duration_minutes??'':existing.repetitions??''):'');
  const load=draftLoad??(existing?.load_kg===null||existing?.load_kg===undefined?'':String(existing.load_kg));
  const rpe=draftRpe??(existing?.effort_rpe===null||existing?.effort_rpe===undefined?'':String(existing.effort_rpe));

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    if(busy)return;
    setFeedback('');
    const validCount=/^[0-9]+$/.test(value.trim())?Number(value.trim()):NaN;
    const normalizedLoad=load.trim().replace(',','.');
    const validLoad=normalizedLoad===''?null:/^\d+(?:\.\d{1,2})?$/.test(normalizedLoad)?Number(normalizedLoad):NaN;
    const validRpe=rpe===''?null:/^\d+$/.test(rpe)?Number(rpe):NaN;
    const entry:SetEntry={
      repetitions:timed?null:validCount,
      duration_minutes:timed?validCount:null,
      load_kg:timed?null:validLoad,
      effort_rpe:validRpe
    };
    const err=validateSetEntry(entry,timed);
    if(err){setFeedback(err);return}
    setBusy(true);
    try{
      const client=createClient();
      const {error}=await client.from('training_set_logs').upsert({
        user_id:userId,plan_id:planId,week_number:week,session_index:sessionIndex,
        exercise_id:exercise.id,set_number:setNumber,
        repetitions:entry.repetitions,duration_minutes:entry.duration_minutes,
        load_kg:entry.load_kg,effort_rpe:entry.effort_rpe,
        recorded_at:new Date().toISOString()
      },{onConflict:'user_id,plan_id,week_number,session_index,exercise_id,set_number'});
      if(error)throw error;
      await onChanged();
      setDraftValue(null);setDraftLoad(null);setDraftRpe(null);
      setFeedback('Série salva na nuvem.');
    }catch(e){setFeedback('O Supabase não confirmou: '+(e instanceof Error?e.message:'falha inesperada'))}
    finally{setBusy(false)}
  };
  const remove=async()=>{
    if(!existing||busy||!window.confirm('Apagar somente esta série do histórico?'))return;
    setBusy(true);setFeedback('');
    try{
      const client=createClient();
      const {error}=await client.from('training_set_logs').delete()
        .eq('id',existing.id).eq('user_id',userId).eq('plan_id',planId);
      if(error)throw error;
      await onChanged();
      setDraftValue(null);setDraftLoad(null);setDraftRpe(null);
      setFeedback('Série removida.');
    }catch(e){setFeedback('Falha ao remover no Supabase: '+(e instanceof Error?e.message:'erro inesperado'))}
    finally{setBusy(false)}
  };
  return <form className="pl-set-row" onSubmit={e=>void submit(e)}>
    <span className="pl-set-number">{setNumber.toString().padStart(2,'0')}</span>
    <label>
      <span>{timed?'Minutos':'Repetições'}</span>
      <input aria-label={(timed?'Minutos':'Repetições')+' da série '+setNumber+' de '+exercise.name} type="number"
        min="1" max={timed?240:300} step="1" required placeholder={timed?'10':'12'}
        value={value} onChange={e=>setDraftValue(e.target.value)}/>
    </label>
    {!timed&&<label><span>Carga (kg)</span><input aria-label={'Carga em kg da série '+setNumber+' de '+exercise.name}
      inputMode="decimal" placeholder="Opcional" value={load}
      onChange={e=>setDraftLoad(e.target.value)} maxLength={8}/></label>}
    <label><span>RPE / 10</span><select aria-label={'Esforço RPE da série '+setNumber+' de '+exercise.name}
      value={rpe} onChange={e=>setDraftRpe(e.target.value)}>
      <option value="">Não informado</option>{[1,2,3,4,5,6,7,8,9,10].map(n=><option value={n} key={n}>{n}</option>)}
    </select></label>
    <div className="pl-set-actions">
      <button type="submit" disabled={busy} className="pl-save-set"><Save size={15}/>{busy?'Salvando':existing?'Atualizar':'Salvar'}</button>
      {existing&&<button type="button" className="pl-delete-set" disabled={busy}
        onClick={()=>void remove()} aria-label={'Excluir série '+setNumber}><Trash2 size={15}/></button>}
    </div>
    {feedback&&<span className={'pl-set-message '+(feedback.includes('nuvem')||feedback==='Série removida.'?'success':'')} role="status">{feedback}</span>}
  </form>;
}

export default function ExerciseTracker({userId,planId,week,sessionIndex,exercises,logs,onChanged}:Props){
  const current=logs.filter(x=>x.week_number===week&&x.session_index===sessionIndex);
  const savedCount=current.length;
  const expectedCount=exercises.reduce((total,x)=>total+x.sets,0);
  return <section className="pl-exercise-tracker">
    <div className="pl-tracker-top"><div><span className="pl-kicker"><TrendingUp size={13}/> REGISTRO DE EXECUÇÃO</span><h4>Séries, repetições e esforço</h4><p>Informe apenas o que foi realmente realizado. A carga é opcional; RPE significa esforço percebido de 1 (muito leve) a 10 (máximo).</p></div><span className="pl-tracker-count"><CheckCircle2 size={16}/>{savedCount}/{expectedCount} séries</span></div>
    {exercises.map((ex,j)=>{
      const timed=isTimedExercise(ex.movement);
      const previous=getExerciseHistory(logs,sessionIndex,ex.id,week);
      const allHistory=getExerciseHistory(logs,sessionIndex,ex.id,5);
      const logged=current.filter(l=>l.exercise_id===ex.id);
      return <div className="pl-tracker-exercise" key={ex.id}>
        <div className="pl-tracker-title"><span className="pl-count">{j+1}</span><div><h5>{ex.name}</h5><small>{ex.sets} {ex.sets===1?'série':'séries'} sugeridas × {ex.reps} · {ex.tip}</small></div></div>
        {previous.length>0&&<p className="pl-last-performance"><History size={15}/>
          Último registro comparável (semana {previous[0].week}): {previous[0].setCount} séries, {timed?previous[0].totalMinutes+' min':previous[0].totalReps+' rep.'}
          {!timed&&previous[0].meanLoad!==null?' · carga média '+showWeight(previous[0].meanLoad):''}
          {previous[0].maxRpe!==null?' · RPE máx. '+previous[0].maxRpe:''}
        </p>}
        <div className="pl-sets">{Array.from({length:ex.sets},(_,n)=><SetEditor key={n+1}
          userId={userId} planId={planId} week={week} sessionIndex={sessionIndex}
          exercise={ex} setNumber={n+1} logs={logs} onChanged={onChanged}/>)}</div>
        <p className="pl-exercise-advice"><Clock3 size={16}/>{getExerciseAdvice(logs,sessionIndex,ex.id,week,ex.sets)}</p>
        {allHistory.length>0&&<details className="pl-ex-history"><summary><History size={15}/> Consultar histórico deste exercício ({allHistory.length} {allHistory.length===1?'semana':'semanas'})</summary>
          <div className="pl-history-list">{allHistory.map(h=><div key={h.week}><strong>Semana {h.week}</strong><span>{h.setCount} séries · {timed?h.totalMinutes+' min':h.totalReps+' repetições'}{!timed&&h.maxLoad!==null?' · até '+showWeight(h.maxLoad):''}{h.maxRpe!==null?' · RPE até '+h.maxRpe:''}</span></div>)}</div>
          <div className="pl-history-sets">{logs.filter(l=>l.session_index===sessionIndex&&l.exercise_id===ex.id)
            .slice().sort((a,b)=>a.week_number-b.week_number||a.set_number-b.set_number)
            .map(l=><small key={l.id}>S{l.week_number} · série {l.set_number}: {timed?l.duration_minutes+' min':l.repetitions+' rep.'} · {showWeight(l.load_kg)}{l.effort_rpe!==null?' · RPE '+l.effort_rpe:''}</small>)}</div>
        </details>}
        {logged.length===0&&<p className="pl-no-data">Ainda não há séries registradas nesta semana para este exercício.</p>}
      </div>;
    })}
    <p className="pl-tracker-disclaimer"><Plus size={15}/> Registrar uma série não significa que a sessão inteira foi concluída. Use a confirmação de sessão depois de terminar. Nunca treine com dor ou mal-estar.</p>
  </section>;
}
