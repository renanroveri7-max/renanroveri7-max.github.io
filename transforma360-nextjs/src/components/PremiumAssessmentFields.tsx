'use client';
import type {TrainingDetails,DayKey,FocusArea} from '@/lib/premium-planner';
import {dayNames,focusNames} from '@/lib/premium-planner';

type Props={details:TrainingDetails;onChange:(next:TrainingDetails)=>void};
const weekdays:DayKey[]=['seg','ter','qua','qui','sex','sab','dom'];
const areas:FocusArea[]=['corpo_inteiro','peito','costas','pernas','gluteos','ombros','bracos','cardio'];
export default function PremiumAssessmentFields({details:d,onChange}:Props){
 const modify=(patch:Partial<TrainingDetails>)=>onChange({...d,...patch});
 return <>
  <section className="pl-assessment-group">
    <div className="pl-assessment-group-head"><span>ETAPA 01</span><h3>Seu corpo e histórico</h3><p>Esses dados ajudam a contextualizar sua avaliação. Não usamos o peso corporal para adivinhar cargas de musculação.</p></div>
    <div className="pl-fields">
      <label>Idade (anos)<input required type="number" inputMode="numeric" min={18} max={90} placeholder="Ex.: 28" value={d.age_years??''} onChange={e=>modify({age_years:e.target.value===''?null:Number(e.target.value)})}/></label>
      <label>Altura (cm)<input required type="number" inputMode="numeric" min={120} max={230} placeholder="Ex.: 173" value={d.height_cm??''} onChange={e=>modify({height_cm:e.target.value===''?null:Number(e.target.value)})}/></label>
      <label>Peso atual (kg)<input required type="number" inputMode="decimal" min={30} max={350} step="0.1" placeholder="Ex.: 65,5" value={d.body_mass_kg??''} onChange={e=>modify({body_mass_kg:e.target.value===''?null:Number(e.target.value)})}/></label>
      <label>Tempo de treino regular (meses)<input required type="number" inputMode="numeric" min={0} max={600} placeholder="0 se estiver começando" value={d.months_training} onChange={e=>modify({months_training:e.target.value===''?0:Number(e.target.value)})}/></label>
      <label>Movimentação no dia a dia<select value={d.daily_activity} onChange={e=>modify({daily_activity:e.target.value as TrainingDetails['daily_activity']})}>
        <option value="sedentario">Passo a maior parte do dia sentado(a)</option>
        <option value="leve">Caminho um pouco</option>
        <option value="moderado">Sou ativo(a) com frequência</option>
        <option value="alto">Tenho rotina fisicamente intensa</option>
      </select></label>
      <label>Qualidade habitual do sono<select value={d.sleep_quality} onChange={e=>modify({sleep_quality:e.target.value as TrainingDetails['sleep_quality']})}>
        <option value="boa">Boa</option><option value="regular">Regular</option><option value="ruim">Ruim, acordo pouco recuperado(a)</option>
      </select></label>
    </div>
  </section>
  <section className="pl-assessment-group">
    <div className="pl-assessment-group-head"><span>ETAPA 02</span><h3>Seus objetivos e preferências</h3><p>Seu objetivo principal é selecionado abaixo. Estas preferências definem o foco secundário, sem deixar de treinar os grandes grupos musculares.</p></div>
    <fieldset className="pl-choice-group"><legend>Regiões que gostaria de priorizar (opcional)</legend><div className="pl-chip-grid">{areas.map(k=><label key={k} className={d.focus_areas.includes(k)?'selected':''}><input type="checkbox" checked={d.focus_areas.includes(k)} onChange={()=>modify({focus_areas:d.focus_areas.includes(k)?d.focus_areas.filter(x=>x!==k):[...d.focus_areas,k]})}/>{focusNames[k]}</label>)}</div></fieldset>
    <div className="pl-fields">
      <label>O que acha de exercícios aeróbicos?<select value={d.cardio_preference} onChange={e=>modify({cardio_preference:e.target.value as TrainingDetails['cardio_preference']})}><option value="gosto">Gosto</option><option value="neutro">Indiferente</option><option value="nao_gosto">Prefiro pouco cardio</option></select></label>
      <label>Ritmo de progressão preferido<select value={d.progression_preference} onChange={e=>modify({progression_preference:e.target.value as TrainingDetails['progression_preference']})}><option value="leve">Bem gradual</option><option value="moderada">Moderado e gradual</option></select></label>
    </div>
  </section>
  <section className="pl-assessment-group">
    <div className="pl-assessment-group-head"><span>ETAPA 03</span><h3>Disponibilidade real</h3><p>Escolha os dias em que pode treinar. Se a agenda variar, deixe sem marcar e distribuiremos as sessões sem dia fixo.</p></div>
    <fieldset className="pl-choice-group"><legend>Em quais dias costuma ter tempo? (opcional)</legend><div className="pl-chip-grid">{weekdays.map(k=><label key={k} className={d.preferred_days.includes(k)?'selected':''}><input type="checkbox" checked={d.preferred_days.includes(k)} onChange={()=>modify({preferred_days:d.preferred_days.includes(k)?d.preferred_days.filter(x=>x!==k):[...d.preferred_days,k]})}/>{dayNames[k]}</label>)}</div></fieldset>
    <p className="pl-assessment-help">Os dias e o tempo de cada sessão também são escolhidos abaixo. Se marcar dias específicos, selecione pelo menos o número de dias que deseja treinar.</p>
  </section>
 </>;
}
