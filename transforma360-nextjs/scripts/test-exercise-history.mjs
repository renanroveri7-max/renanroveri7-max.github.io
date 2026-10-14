import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../src/lib/exercise-history.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {validateSetEntry,getExerciseHistory,getExerciseAdvice}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const make=(week,set,rpe,reps=12,exercise_id='agachar-0',session=0)=>({
  id:String(week)+'-'+String(set)+'-'+exercise_id+'-'+String(session),plan_id:'plan-a',week_number:week,session_index:session,
  exercise_id,set_number:set,repetitions:reps,duration_minutes:null,load_kg:4.56,effort_rpe:rpe,
  recorded_at:'2026-10-13T00:00:00Z'
});
const base=[make(1,1,5),make(1,2,6),make(2,1,6,13),make(2,2,6,13)];
assert.deepEqual(getExerciseHistory(base,0,'agachar-0',3).map(x=>x.totalReps),[26,24]);
assert.deepEqual(getExerciseHistory(base,0,'agachar-0',3).map(x=>x.maxRpe),[6,6]);
assert.deepEqual(getExerciseHistory(base,0,'agachar-0',3).map(x=>x.maxLoad),[4.56,4.56]);
assert.match(getExerciseAdvice(base,0,'agachar-0',3,2),/Duas sessões completas/);
assert.match(getExerciseAdvice([make(1,1,9),make(1,2,8)],0,'agachar-0',2,2),/Não aumente a carga/);
assert.match(getExerciseAdvice([make(1,1,null),make(1,2,null)],0,'agachar-0',2,2),/faltam dados de esforço/);
assert.match(getExerciseAdvice([make(1,1,5)],0,'agachar-0',2,2),/menos séries/);
assert.match(getExerciseAdvice(base,1,'agachar-0',3,2),/Sem registros/);
assert.match(getExerciseAdvice(base,0,'puxar-1',3,2),/Sem registros/);
assert.match(getExerciseAdvice(base,0,'agachar-0',1,2),/Sem registros/);
assert.equal(validateSetEntry({repetitions:12,duration_minutes:null,load_kg:4.56,effort_rpe:6},false),null);
assert.equal(validateSetEntry({repetitions:10,duration_minutes:null,load_kg:0.1,effort_rpe:7},false),null);
assert.equal(validateSetEntry({repetitions:null,duration_minutes:12,load_kg:null,effort_rpe:4},true),null);
assert.match(validateSetEntry({repetitions:0,duration_minutes:null,load_kg:null,effort_rpe:null},false),/repetições/);
assert.match(validateSetEntry({repetitions:5,duration_minutes:null,load_kg:501,effort_rpe:null},false),/carga/);
assert.match(validateSetEntry({repetitions:5,duration_minutes:null,load_kg:12.345,effort_rpe:null},false),/carga/);
assert.match(validateSetEntry({repetitions:5,duration_minutes:null,load_kg:null,effort_rpe:11},false),/RPE/);
assert.match(validateSetEntry({repetitions:10,duration_minutes:null,load_kg:null,effort_rpe:null},true),/duração/);
assert.match(validateSetEntry({repetitions:null,duration_minutes:10,load_kg:5,effort_rpe:2},true),/carga/);
assert.equal(getExerciseHistory([make(1,1,7)],0,'agachar-0',2)[0].setCount,1);
console.log('PASS: 20 exercise-history and conservative progression assertions');
