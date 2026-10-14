import type {Goal, Place} from '@/types/models';

export type Experience = 'iniciante' | 'intermediario' | 'avancado';
export type Readiness = 'ready' | 'requires_clearance';
export type Equipment = 'halteres' | 'elasticos';

export type TrainingAssessment = {
  goal: Goal;
  experience: Experience;
  training_place: Place;
  equipment: Equipment[];
  days_per_week: number;
  minutes_per_session: number;
  age_confirmed: boolean;
  readiness: Readiness;
};

export type ExerciseSuggestion = {
  id: string;
  name: string;
  movement: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tip: string;
};

export type TrainingDay = {
  index: number;
  title: string;
  focus: string;
  warmup: string;
  exercises: ExerciseSuggestion[];
  cooldown: string;
  duration: number;
};

export type TrainingBlueprint = {
  version: 1;
  createdFor: Pick<TrainingAssessment,'goal'|'experience'|'training_place'|'days_per_week'|'minutes_per_session'>;
  weeks: 4;
  days: TrainingDay[];
  safety: string[];
  weeklyProgression: string[];
  rationale: string;
};

export type TrainingCheckin = {
  id: string;
  session_index: number;
  week_number: number;
  effort: 'leve' | 'adequado' | 'dificil';
  completed_at: string;
};

const goals:Goal[]=['massa','gordura','recomposicao','condicionamento','consistencia'];
const places:Place[]=['academia','casa','ar_livre'];
const experienceLevels:Experience[]=['iniciante','intermediario','avancado'];
const readinessValues:Readiness[]=['ready','requires_clearance'];
const equipmentValues:Equipment[]=['halteres','elasticos'];
const minutes=[20,30,45,60,90];

export function validateAssessment(data:TrainingAssessment):string|null {
  if(!data.age_confirmed)return 'Este módulo está disponível apenas para pessoas com 18 anos ou mais.';
  if(!goals.includes(data.goal)||!places.includes(data.training_place)||!experienceLevels.includes(data.experience))return 'Revise as opções da avaliação.';
  if(!Number.isInteger(data.days_per_week)||data.days_per_week<1||data.days_per_week>5)return 'Escolha de 1 a 5 dias de treino por semana.';
  if(!minutes.includes(data.minutes_per_session))return 'Escolha uma duração disponível.';
  if(!Array.isArray(data.equipment)||data.equipment.length>2||new Set(data.equipment).size!==data.equipment.length||!data.equipment.every(x=>equipmentValues.includes(x)))return 'Revise os equipamentos selecionados.';
  if(!readinessValues.includes(data.readiness))return 'Preencha a triagem de segurança.';
  if(data.readiness!=='ready')return 'Sem gerar plano automaticamente: busque orientação de um profissional habilitado antes de iniciar.';
  return null;
}

type Movement = 'agachar'|'quadril'|'empurrar'|'puxar'|'ombros'|'core'|'cardio'|'mobilidade';
type CatalogEntry = Pick<ExerciseSuggestion,'name'|'tip'>;

function choose(movement:Movement,a:TrainingAssessment):CatalogEntry {
  const gym=a.training_place==='academia';
  const dumb=a.equipment.includes('halteres');
  const band=a.equipment.includes('elasticos');
  switch(movement){
    case 'agachar':
      return gym?{name:'Agachamento guiado na máquina',tip:'Ajuste a amplitude ao conforto e mantenha os pés firmes.'}:
      dumb?{name:'Agachamento com halter',tip:'Mantenha a carga próxima ao corpo; comece leve.'}:
      {name:'Agachamento para sentar e levantar',tip:'Use um banco estável e amplitude confortável.'};
    case 'quadril':
      return gym||dumb?{name:'Levantamento romeno com halteres leves',tip:'Movimento controlado do quadril, coluna neutra; sem forçar amplitude.'}:
      {name:'Ponte de glúteos no solo',tip:'Eleve o quadril sem arquear excessivamente a lombar.'};
    case 'empurrar':
      return gym?{name:'Supino na máquina',tip:'Ajuste a máquina e use uma carga com movimento controlado.'}:
      {name:'Flexão inclinada com apoio firme',tip:'Apoie as mãos em superfície estável, sem móveis soltos.'};
    case 'puxar':
      return gym?{name:'Remada sentada na máquina',tip:'Tronco estável e ombros afastados das orelhas.'}:
      dumb?{name:'Remada unilateral com halter',tip:'Apoie o corpo em base estável e evite giros do tronco.'}:
      band?{name:'Remada com elástico',tip:'Use somente uma fixação segura e inspecione o elástico antes.'}:
      {name:'Elevação em W deitado de barriga para baixo',tip:'Sem carga, mova os braços lentamente e evite desconforto cervical.'};
    case 'ombros':
      return gym?{name:'Desenvolvimento na máquina',tip:'Use amplitude sem dor e controle o movimento.'}:
      dumb?{name:'Desenvolvimento com halteres leves',tip:'Comece leve e mantenha o tronco estável.'}:
      band?{name:'Elevação lateral com elástico leve',tip:'Controle a subida e não encolha os ombros.'}:
      {name:'Deslizamento de braços na parede',tip:'Sem carga, mantenha as costelas baixas e a amplitude confortável.'};
    case 'core':return {name:'Dead bug',tip:'Movimento lento, com respiração normal e sem arquear a lombar.'};
    case 'cardio':return {name:'Caminhada em ritmo confortável',tip:'Mantenha intensidade em que ainda consiga conversar.'};
    case 'mobilidade':return {name:'Mobilidade leve de ombros e quadril',tip:'Movimentos suaves, sem forçar alongamentos dolorosos.'};
  }
}
function makeExercise(m:Movement,index:number,a:TrainingAssessment):ExerciseSuggestion{
  const c=choose(m,a);
  const isTimed=m==='cardio'||m==='mobilidade';
  const isCore=m==='core';
  const isStart=a.experience==='iniciante';
  return {id:m+'-'+index,name:c.name,movement:m,
    sets:isTimed?1:(isCore?2:isStart?2:3),
    reps:isTimed?(m==='cardio'?'8–15 min':'5–8 min'):(isCore?'6–10 por lado':a.goal==='massa'||a.goal==='recomposicao'?'8–12':'10–15'),
    restSeconds:isTimed?0:isCore?45:isStart?75:90,
    tip:c.tip};
}
const sequences:Movement[][]={
  1: [['agachar','empurrar','puxar','core']],
  2: [['agachar','empurrar','puxar','core'],['quadril','puxar','ombros','core']],
  3: [['agachar','empurrar','puxar','core'],['quadril','puxar','ombros','core'],['agachar','quadril','empurrar','core']],
  4: [['empurrar','puxar','ombros','core'],['agachar','quadril','core','cardio'],['puxar','empurrar','ombros','core'],['quadril','agachar','core','cardio']],
  5: [['empurrar','puxar','ombros','core'],['agachar','quadril','core'],['puxar','empurrar','ombros','core'],['quadril','agachar','core'],['cardio','mobilidade']]
} as unknown as Record<number,Movement[][]>;

const labels:Record<number,string[]>={
  1:['Corpo inteiro A'],
  2:['Corpo inteiro A','Corpo inteiro B'],
  3:['Corpo inteiro A','Corpo inteiro B','Corpo inteiro C'],
  4:['Superiores A','Inferiores A','Superiores B','Inferiores B'],
  5:['Superiores A','Inferiores A','Superiores B','Inferiores B','Condicionamento leve']
};

export function makeTrainingBlueprint(a:TrainingAssessment):TrainingBlueprint{
  const invalid=validateAssessment(a);
  if(invalid)throw new Error(invalid);
  const budget=a.minutes_per_session<=20?3:a.minutes_per_session<=30?4:a.minutes_per_session<=45?4:a.minutes_per_session<=60?5:6;
  const days:TrainingDay[]=sequences[a.days_per_week].map((seq,i)=>{
    const variants:Movement[]=seq.slice();
    if(a.minutes_per_session>=60 && a.days_per_week!==5)variants.push(i%2===0?'cardio':'mobilidade');
    if(a.minutes_per_session>=90 && a.days_per_week<=3)variants.push('ombros');
    const isConditioning=a.days_per_week===5&&i===4;
    const chosen=(isConditioning?variants:variants.slice(0,budget)).map((m,j)=>makeExercise(m,j,a));
    const warmup='4–7 min de movimentos leves + uma série de familiarização com técnica.';
    return {index:i,title:labels[a.days_per_week][i],focus:isConditioning?'Atividade leve e mobilidade':'Técnica, controle e esforço moderado',
      warmup,exercises:chosen,cooldown:'Finalize com respiração tranquila e caminhada leve, se desejar.',duration:a.minutes_per_session};
  });
  const frequencyRationale=a.days_per_week>=4?'Alternância entre membros superiores e inferiores para distribuir o esforço.':'Sessões alternadas de corpo inteiro, com descanso entre treinos quando possível.';
  return {version:1,createdFor:{goal:a.goal,experience:a.experience,training_place:a.training_place,days_per_week:a.days_per_week,minutes_per_session:a.minutes_per_session},
    weeks:4,days,safety:[
      'Sugestão educativa, não prescrição clínica ou substituto de profissional habilitado.',
      'Interrompa o exercício ao sentir dor, tontura, falta de ar fora do esperado ou mal-estar; busque orientação adequada.',
      'Reserve recuperação entre sessões intensas; não é obrigatório treinar em dias consecutivos.',
      'Comece com esforço controlado, priorizando técnica e execução confortável.'
    ],
    weeklyProgression:[
      'Semana 1 — familiarização: pratique técnica e escolha variações confortáveis; sem pressa de aumentar cargas.',
      'Semana 2 — consolidação: se a sessão anterior foi leve e bem tolerada, avance uma repetição dentro da faixa sugerida.',
      'Semana 3 — progressão gradual: apenas se duas sessões comparáveis foram leves, considere o topo da faixa de repetições; nunca aumente carga automaticamente.',
      'Semana 4 — revisão: mantenha ou reduza o esforço se estiver acumulando fadiga; reavalie a rotina ao final.'
    ],
    rationale:frequencyRationale+' Exercícios selecionados por local, equipamentos, disponibilidade e experiência declarada; ajuste sempre ao conforto individual.'
  };
}

export function recommendationForSession(checkins:TrainingCheckin[],sessionIndex:number,week:number):string{
  const earlier=checkins.filter(c=>c.session_index===sessionIndex&&c.week_number<week).sort((a,b)=>b.week_number-a.week_number);
  if(week===1||!earlier.length)return 'Priorize aprender o movimento e registrar o esforço após concluir a sessão.';
  if(earlier[0].effort==='dificil')return 'A sessão anterior foi difícil: mantenha ou reduza o esforço e dê prioridade à recuperação.';
  if(week>=3 && earlier.length>=2 && earlier[0].effort==='leve'&&earlier[1].effort==='leve')
    return 'Duas sessões foram leves: considere 1 repetição adicional por série dentro da faixa indicada, se a técnica seguir confortável.';
  if(earlier[0].effort==='leve')
    return 'Última sessão leve: considere 1 repetição adicional dentro da faixa, mantendo a execução controlada.';
  return 'Mantenha a mesma faixa de repetições e o esforço moderado, sem aumentar a carga automaticamente.';
}
