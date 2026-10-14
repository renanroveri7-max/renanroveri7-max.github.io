// Deterministic tests without extra packages. Loads the pure TS engine after
// transpilation with the project's TypeScript dev dependency.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/lib/training-engine.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const engine=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputText).toString('base64'));
const base={goal:'recomposicao',experience:'iniciante',training_place:'academia',equipment:[],days_per_week:3,minutes_per_session:45,age_confirmed:true,readiness:'ready'};

for(const place of ['academia','casa','ar_livre']){
  for(const days of [1,2,3,4,5]){
    for(const duration of [20,30,45,60,90]){
      const profile={...base,training_place:place,days_per_week:days,minutes_per_session:duration};
      const plan=engine.makeTrainingBlueprint(profile);
      assert.equal(plan.days.length,days);
      assert.equal(plan.weeks,4);
      assert.equal(plan.version,1);
      assert.ok(plan.days.every(d=>d.exercises.length>0&&d.exercises.every(x=>x.sets>=1&&x.name.length>5)));
      assert.ok(plan.days.every(d=>d.duration===duration));
    }
  }
}
assert.match(engine.validateAssessment({...base,age_confirmed:false}),/18 anos/);
assert.match(engine.validateAssessment({...base,readiness:'requires_clearance'}),/profissional/);
assert.match(engine.validateAssessment({...base,days_per_week:7}),/1 a 5/);
assert.match(engine.validateAssessment({...base,equipment:['halteres','halteres']}),/equipamentos/);
assert.throws(()=>engine.makeTrainingBlueprint({...base,readiness:'requires_clearance'}),/profissional/);
const checks=[
{id:'a',session_index:0,week_number:1,effort:'leve',completed_at:'2026-10-01'},
{id:'b',session_index:0,week_number:2,effort:'leve',completed_at:'2026-10-08'}
];
assert.match(engine.recommendationForSession(checks,0,3),/Duas sessões foram leves/);
assert.match(engine.recommendationForSession([{...checks[0],effort:'dificil'}],0,2),/reduza o esforço/);
assert.match(engine.recommendationForSession([],0,1),/aprender o movimento/);
console.log('PASS: 75 profile combinations, safety gates, ownership-neutral rules and effort-based progression');
