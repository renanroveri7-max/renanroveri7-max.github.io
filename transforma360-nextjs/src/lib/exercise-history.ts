/**
 * Conservative educational feedback based exclusively on a user's recorded data.
 * No automatic increases of external load or medical conclusions.
 */
export type ExerciseSetLog = {
  id:string;
  plan_id:string;
  week_number:number;
  session_index:number;
  exercise_id:string;
  set_number:number;
  repetitions:number|null;
  duration_minutes:number|null;
  load_kg:number|null;
  effort_rpe:number|null;
  recorded_at:string;
};
export type ExerciseHistory = {
  week:number;
  setCount:number;
  totalReps:number|null;
  totalMinutes:number|null;
  meanLoad:number|null;
  maxLoad:number|null;
  maxRpe:number|null;
};

export function getExerciseHistory(
  logs:ExerciseSetLog[],session:number,exercise:string,beforeWeek=5
):ExerciseHistory[]{
  const subset=logs.filter(l=>l.session_index===session&&l.exercise_id===exercise
    &&l.week_number<beforeWeek);
  const weeks=[...new Set(subset.map(l=>l.week_number))].sort((a,b)=>b-a);
  return weeks.map(week=>{
    const rows=subset.filter(l=>l.week_number===week);
    const rep=rows.filter(r=>r.repetitions!==null).map(r=>r.repetitions as number);
    const duration=rows.filter(r=>r.duration_minutes!==null).map(r=>r.duration_minutes as number);
    const loads=rows.filter(r=>r.load_kg!==null).map(r=>Number(r.load_kg));
    const rpes=rows.filter(r=>r.effort_rpe!==null).map(r=>r.effort_rpe as number);
    return {week,setCount:rows.length,
      totalReps:rep.length?rep.reduce((a,b)=>a+b,0):null,
      totalMinutes:duration.length?duration.reduce((a,b)=>a+b,0):null,
      meanLoad:loads.length?Math.round((loads.reduce((a,b)=>a+b,0)/loads.length)*100)/100:null,
      maxLoad:loads.length?Math.max(...loads):null,
      maxRpe:rpes.length?Math.max(...rpes):null
    };
  });
}
export function getExerciseAdvice(
  logs:ExerciseSetLog[],session:number,exercise:string,week:number,expectedSets:number
):string{
  const history=getExerciseHistory(logs,session,exercise,week);
  if(!history.length)return 'Sem registros anteriores deste exercício: priorize execução confortável e anote o esforço.';
  const last=history[0];
  if(last.maxRpe!==null&&last.maxRpe>=8)
    return 'Esforço alto na última sessão (RPE 8–10). Não aumente a carga; considere reduzir o volume e priorize a recuperação.';
  if(last.setCount<expectedSets)
    return 'A sessão anterior teve menos séries registradas que o previsto. Consolide a rotina antes de progredir.';
  if(last.maxRpe===null)
    return 'Ainda faltam dados de esforço (RPE). Mantenha o volume e a carga enquanto observa sua resposta.';
  if(last.maxRpe===7)return 'Esforço moderado na última sessão (RPE 7). Mantenha o ritmo e evite aumentar a carga.';
  if(last.maxRpe<=6 && history.length>=2
    &&history[1].maxRpe!==null &&history[1].maxRpe<=6
    &&history[1].setCount>=expectedSets)
    return 'Duas sessões completas com esforço baixo (RPE até 6). Se estiver confortável e sem dor, considere apenas 1 repetição a mais por série, respeitando a faixa sugerida; não aumente a carga automaticamente.';
  if(last.maxRpe<=6)
    return 'Última sessão bem tolerada. Repita a execução e mantenha a mesma carga; aguarde mais dados antes de progredir.';
  return 'Mantenha a execução controlada e não aumente a carga automaticamente.';
}
export type SetEntry = {
  repetitions:number|null;
  duration_minutes:number|null;
  load_kg:number|null;
  effort_rpe:number|null;
};
export function validateSetEntry(entry:SetEntry,isTimed:boolean):string|null{
  if(isTimed){
    if(entry.repetitions!==null||entry.duration_minutes===null||!Number.isInteger(entry.duration_minutes)
      ||entry.duration_minutes<1||entry.duration_minutes>240)return 'Informe a duração de 1 a 240 minutos.';
    if(entry.load_kg!==null)return 'Atividades por tempo não aceitam carga neste módulo.';
  }else{
    if(entry.duration_minutes!==null||entry.repetitions===null||!Number.isInteger(entry.repetitions)
      ||entry.repetitions<1||entry.repetitions>300)return 'Informe de 1 a 300 repetições.';
    if(entry.load_kg!==null && (!Number.isFinite(entry.load_kg)||entry.load_kg<0
      ||entry.load_kg>500||Math.abs(Math.round(entry.load_kg*100)-entry.load_kg*100)>0.000001))
      return 'Informe uma carga de 0 a 500 kg, com até duas casas decimais.';
  }
  if(entry.effort_rpe!==null&&(!Number.isInteger(entry.effort_rpe)||entry.effort_rpe<1||entry.effort_rpe>10))
    return 'Esforço RPE deve estar entre 1 e 10.';
  return null;
}
