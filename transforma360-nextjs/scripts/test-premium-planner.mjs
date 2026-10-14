import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=(filename)=>ts.transpileModule(
  readFileSync(new URL('../src/lib/'+filename,import.meta.url),'utf8'),
  {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const dataUrl=(js)=>'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
const engineUrl=dataUrl(compile('training-engine.ts'));
const premium=compile('premium-planner.ts').replaceAll("'./training-engine'","'"+engineUrl+"'");
const {createAutomaticPlan,validateExtendedAssessment,defaultTrainingDetails}=await import(dataUrl(premium));
const common={goal:'massa',experience:'iniciante',training_place:'academia',
  equipment:[],days_per_week:3,minutes_per_session:45,age_confirmed:true,readiness:'ready',
  ...defaultTrainingDetails(),age_years:28,height_cm:173,body_mass_kg:65.5};
assert.equal(validateExtendedAssessment(common),null);
assert.match(validateExtendedAssessment({...common,age_years:null}),/idade/);
assert.match(validateExtendedAssessment({...common,height_cm:119}),/altura/);
assert.match(validateExtendedAssessment({...common,body_mass_kg:0}),/peso/);
assert.match(validateExtendedAssessment({...common,readiness:'requires_clearance'}),/profissional/);
assert.match(validateExtendedAssessment({...common,days_per_week:4,preferred_days:['seg','ter']}),/dias suficientes/);
assert.match(validateExtendedAssessment({...common,preferred_days:['seg','seg']}),/dias da semana/);
assert.match(validateExtendedAssessment({...common,focus_areas:['peito','peito']}),/focos/);
assert.throws(()=>createAutomaticPlan({...common,age_years:17}),/idade/);
let tested=0;
for(const goal of ['massa','gordura','recomposicao','condicionamento','consistencia']){
 for(const place of ['academia','casa','ar_livre']){
  for(const days of [1,2,3,4,5]){
    const profile={...common,goal,training_place:place,days_per_week:days,months_training:0};
    const plan=createAutomaticPlan(profile);
    assert.equal(plan.version,1);
    assert.equal(plan.days.length,days);
    assert.equal(plan.personalization.method,'evidence_rules_v1');
    assert.equal(plan.personalization.baselineLoadPolicy,'calibrar_na_primeira_sessao');
    assert.ok(plan.days.every(day=>day.exercises.length>0&&day.exercises.every(e=>e.sets>=1&&e.reps.length>0)));
    assert.ok(plan.days.every(day=>day.exercises.every(e=>!/[0-9]\s?kg/.test(e.tip))));
    tested++;
  }
 }
}
const arranged=createAutomaticPlan({...common,days_per_week:2,preferred_days:['seg','qui'],focus_areas:['peito']});
assert.deepEqual(arranged.personalization.scheduledDays,['seg','qui']);
assert.ok(arranged.days.every(d=>d.exercises.every(e=>e.sets>0)));
const repeat=createAutomaticPlan({...common});
assert.deepEqual(repeat,createAutomaticPlan({...common}), 'deterministic output expected');
console.log('PASS: premium intake fields, triage, 75 goal/place/frequency combinations, load safety, schedule and deterministic output ('+tested+' combinations)');
