// Server-generated model decisions are untrusted, even when the API returns JSON Schema.
import type {PersonalizedBlueprint} from './premium-planner';
import type {TrainingDay} from './training-engine';

export type AiDecision={
  summary:string;
  sessions:{index:number;exercise_ids:string[];coach_note:string}[];
};
const clean=(s:string,max:number)=>s.replace(/[\u0000-\u001F<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);

export function applySafeAiDecisions(
  candidate:PersonalizedBlueprint, response:unknown, model:string
):PersonalizedBlueprint{
  if(!response||typeof response!=='object')throw new Error('Resposta da IA não é um objeto.');
  const r=response as Partial<AiDecision>;
  if(typeof r.summary!=='string'||r.summary.trim().length<15||r.summary.length>800
    ||!Array.isArray(r.sessions)||r.sessions.length!==candidate.days.length)
    throw new Error('Resposta da IA não corresponde ao plano validado.');
  const seen=new Set<number>();
  const mapped:TrainingDay[]=[];
  for(const decision of r.sessions){
    if(!decision||!Number.isInteger(decision.index)||seen.has(decision.index)
      ||typeof decision.coach_note!=='string'||decision.coach_note.trim().length<10
      ||decision.coach_note.length>450||!Array.isArray(decision.exercise_ids))
      throw new Error('Sessão inválida na resposta do modelo.');
    const base=candidate.days.find(d=>d.index===decision.index);
    if(!base||decision.exercise_ids.length!==base.exercises.length)throw new Error('Sessão da IA não existe no plano.');
    const allowable=new Map(base.exercises.map(e=>[e.id,e]));
    const returned=new Set(decision.exercise_ids);
    if(returned.size!==allowable.size||decision.exercise_ids.some(id=>typeof id!=='string'||!allowable.has(id)))
      throw new Error('A IA tentou incluir ou remover exercícios não aprovados.');
    const exercises=decision.exercise_ids.map(id=>allowable.get(id)!);
    mapped.push({...base,exercises,focus:clean(decision.coach_note,240)});
    seen.add(decision.index);
  }
  if(seen.size!==candidate.days.length)throw new Error('A IA não organizou todos os dias.');
  return {...candidate,
    days:mapped.sort((a,b)=>a.index-b.index),
    rationale:'Orientação da IA (sujeita à validação): '+clean(r.summary,400)+'. '+candidate.rationale,
    personalization:{...candidate.personalization!,method:'model_guided_v1',model}
  };
}

export function aiSchema(){
  return {name:'safe_training_preferences',strict:true,schema:{
    type:'object',additionalProperties:false,
    required:['summary','sessions'],
    properties:{
      summary:{type:'string'},
      sessions:{type:'array',items:{
        type:'object',additionalProperties:false,
        required:['index','exercise_ids','coach_note'],
        properties:{
          index:{type:'integer'},
          exercise_ids:{type:'array',items:{type:'string'}},
          coach_note:{type:'string'}
        }
      }}
    }
  }};
}
