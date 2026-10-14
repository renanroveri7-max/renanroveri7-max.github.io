import {makeTrainingBlueprint,validateAssessment,type TrainingAssessment,type TrainingBlueprint,type ExerciseSuggestion} from './training-engine';
export type DayKey='seg'|'ter'|'qua'|'qui'|'sex'|'sab'|'dom';
export type FocusArea='corpo_inteiro'|'peito'|'costas'|'pernas'|'gluteos'|'ombros'|'bracos'|'cardio';
export type TrainingDetails={
 age_years:number|null;height_cm:number|null;body_mass_kg:number|null;
 daily_activity:'sedentario'|'leve'|'moderado'|'alto';months_training:number;
 preferred_days:DayKey[];focus_areas:FocusArea[];
 cardio_preference:'gosto'|'neutro'|'nao_gosto';
 progression_preference:'leve'|'moderada';sleep_quality:'boa'|'regular'|'ruim';
};
export type ExtendedTrainingAssessment=TrainingAssessment&TrainingDetails;
export const defaultTrainingDetails=():TrainingDetails=>({
 age_years:null,height_cm:null,body_mass_kg:null,daily_activity:'leve',months_training:0,
 preferred_days:[],focus_areas:[],cardio_preference:'neutro',progression_preference:'leve',sleep_quality:'regular'
});
export const dayNames:Record<DayKey,string>={seg:'Segunda',ter:'Terça',qua:'Quarta',qui:'Quinta',sex:'Sexta',sab:'Sábado',dom:'Domingo'};
export const focusNames:Record<FocusArea,string>={corpo_inteiro:'Corpo inteiro',peito:'Peito',costas:'Costas',pernas:'Pernas',gluteos:'Glúteos',ombros:'Ombros',bracos:'Braços',cardio:'Condicionamento'};
export function validateExtendedAssessment(a:ExtendedTrainingAssessment):string|null {
 const base=validateAssessment(a);if(base)return base;
 if(!Number.isInteger(a.age_years)||a.age_years!<18||a.age_years!>90)return 'Informe uma idade entre 18 e 90 anos.';
 if(!Number.isInteger(a.height_cm)||a.height_cm!<120||a.height_cm!>230)return 'Informe a altura entre 120 e 230 cm.';
 if(typeof a.body_mass_kg!=='number'||!Number.isFinite(a.body_mass_kg)||a.body_mass_kg<30||a.body_mass_kg>350)return 'Informe o peso entre 30 e 350 kg.';
 if(!['sedentario','leve','moderado','alto'].includes(a.daily_activity))return 'Escolha o nível de atividade.';
 if(!Number.isInteger(a.months_training)||a.months_training<0||a.months_training>600)return 'Informe seu histórico de treino em meses.';
 const days:DayKey[]=['seg','ter','qua','qui','sex','sab','dom'];
 if(!Array.isArray(a.preferred_days)||new Set(a.preferred_days).size!==a.preferred_days.length||a.preferred_days.some(d=>!days.includes(d)))return 'Confira os dias da semana selecionados.';
 if(a.preferred_days.length>0&&a.preferred_days.length<a.days_per_week)return 'Selecione dias suficientes para sua frequência ou deixe os dias em aberto.';
 const areas:FocusArea[]=['corpo_inteiro','peito','costas','pernas','gluteos','ombros','bracos','cardio'];
 if(!Array.isArray(a.focus_areas)||new Set(a.focus_areas).size!==a.focus_areas.length||a.focus_areas.some(f=>!areas.includes(f)))return 'Revise os focos de treino.';
 if(!['gosto','neutro','nao_gosto'].includes(a.cardio_preference)||!['leve','moderada'].includes(a.progression_preference)||!['boa','regular','ruim'].includes(a.sleep_quality))return 'Confira os detalhes da rotina.';
 return null;
}
export type PersonalizedBlueprint=TrainingBlueprint&{personalization?:{
 method:'evidence_rules_v1'|'model_guided_v1';model?:string;scheduledDays:DayKey[];focusAreas:FocusArea[];
 baselineLoadPolicy:'calibrar_na_primeira_sessao';
 evidence:{label:string;url:string}[];}};
export function createAutomaticPlan(a:ExtendedTrainingAssessment):PersonalizedBlueprint{
 const invalid=validateExtendedAssessment(a);if(invalid)throw new Error(invalid);
 const experience=a.months_training<3?'iniciante':a.months_training<12&&a.experience==='avancado'?'intermediario':a.experience;
 const plan=makeTrainingBlueprint({...a,experience});
 const focus:Record<FocusArea,string>={corpo_inteiro:'core',peito:'empurrar',costas:'puxar',pernas:'agachar',gluteos:'quadril',ombros:'ombros',bracos:'puxar',cardio:'cardio'};
 const target=a.focus_areas.find(x=>x!=='corpo_inteiro');
 const workoutDays=plan.days.map((d,i)=>{
   let ex=d.exercises.slice();
   const max=a.minutes_per_session<=30?3:a.minutes_per_session<=45?4:a.minutes_per_session<=60?5:6;
   if(target&&a.minutes_per_session>=60){
     const found=ex.find(e=>e.movement===focus[target]);
     if(found&&ex.length<max)ex.push({...found,id:found.movement+'-focus-'+i,sets:1,tip:found.tip+' Complementar, opcional.'});
   }
   const favorCardio=(a.goal==='gordura'||a.goal==='condicionamento'||a.cardio_preference==='gosto');
   if(favorCardio&&a.cardio_preference!=='nao_gosto'&&a.minutes_per_session>=30&&!ex.some(e=>e.movement==='cardio')){
     const cardio:ExerciseSuggestion={id:'cardio-auto-'+i,name:'Caminhada em ritmo confortável',movement:'cardio',sets:1,reps:a.minutes_per_session<=30?'5–8 min':'8–12 min',restSeconds:0,tip:'Ritmo que permita conversar.'};
     if(ex.length<max)ex.push(cardio);
     else if(a.goal==='gordura'||a.goal==='condicionamento'){
       const core=ex.findIndex(e=>e.movement==='core');
       if(core>=0)ex[core]=cardio;
     }
   }
   ex=ex.map((item):ExerciseSuggestion=>{
     const timed=item.movement==='cardio'||item.movement==='mobilidade';
     const reps=timed?item.reps:item.movement==='core'?'8 por lado':a.goal==='condicionamento'||a.goal==='gordura'?'12':'10';
     return {...item,reps,sets:timed?item.sets:experience==='iniciante'?Math.min(2,item.sets):item.sets,
       tip:item.tip+(timed?'':' Escolha uma carga confortável e controlável; o aplicativo não inventa quilos.')};
   });
   return {...d,exercises:ex,focus:a.focus_areas.length?'Preferências: '+a.focus_areas.slice(0,2).map(x=>focusNames[x]).join(' e ')+' · treino equilibrado':d.focus};
 });
 const rest=a.sleep_quality==='ruim'?'Você relatou sono ruim: mantenha esforço leve e priorize recuperação.':'Aumente o esforço gradualmente, sem pressa.';
 return {...plan,days:workoutDays,
   rationale:'Sugestão educativa elaborada por regras fundamentadas no objetivo, experiência, local e disponibilidade. '+plan.rationale,
   safety:[...plan.safety,rest,'Peso corporal e altura não servem para calcular uma carga de musculação em kg.'],
   personalization:{method:'evidence_rules_v1',
     scheduledDays:a.preferred_days.length?a.preferred_days.slice(0,a.days_per_week):[],
     focusAreas:[...a.focus_areas],baselineLoadPolicy:'calibrar_na_primeira_sessao',
     evidence:[
      {label:'ACSM (2026) — Treinamento resistido em adultos',url:'https://pubmed.ncbi.nlm.nih.gov/41843416/'},
      {label:'OMS — Orientações de atividade física',url:'https://www.who.int/initiatives/behealthy/physical-activity/'}]}
 };
}
