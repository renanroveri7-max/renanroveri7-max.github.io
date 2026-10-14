import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const content=readFileSync(new URL('../src/lib/ai-plan-validator.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(content,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {aiSchema,applySafeAiDecisions}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

const base={version:1,weeks:4,
  days:[{index:0,title:'A',focus:'Força básica',warmup:'Leve',cooldown:'Leve',duration:45,
    exercises:[{id:'agachar-0',name:'Agachar',movement:'agachar',sets:2,reps:'10',restSeconds:60,tip:'Leve'},
      {id:'empurrar-1',name:'Empurrar',movement:'empurrar',sets:2,reps:'10',restSeconds:60,tip:'Leve'}]},
    {index:1,title:'B',focus:'Parte superior',warmup:'Leve',cooldown:'Leve',duration:45,
      exercises:[{id:'puxar-0',name:'Remada',movement:'puxar',sets:2,reps:'12',restSeconds:60,tip:'Leve'}]}],
  rationale:'Treino de teste',personalization:{method:'evidence_rules_v1',scheduledDays:[],focusAreas:[],
    baselineLoadPolicy:'calibrar_na_primeira_sessao',evidence:[]}};
const valid={summary:'A ordem começa com padrões mais exigentes enquanto há disposição e preserva todos os exercícios.',
 sessions:[
   {index:0,exercise_ids:['empurrar-1','agachar-0'],coach_note:'Comece pelo movimento de membros superiores e mantenha o controle da execução.'},
   {index:1,exercise_ids:['puxar-0'],coach_note:'Mantenha a remada com controle de tronco e pausas adequadas.'}
 ]};
const result=applySafeAiDecisions(base,valid,'gpt-4.1-mini');
assert.equal(result.personalization.method,'model_guided_v1');
assert.equal(result.days[0].exercises[0].id,'empurrar-1');
assert.equal(result.days[0].exercises[0].sets,2);
assert.equal(result.days[0].exercises[0].reps,'10');
assert.equal(result.days[0].exercises[0].restSeconds,60);
assert.equal(base.days[0].exercises[0].id,'agachar-0'); // no input mutation
assert.match(result.rationale,/IA/);
const invalids=[
 {...valid,sessions:[valid.sessions[0]]},
 {...valid,sessions:[valid.sessions[0],valid.sessions[0]]},
 {...valid,sessions:[{...valid.sessions[0],exercise_ids:['agachar-0','agachar-0']},valid.sessions[1]]},
 {...valid,sessions:[{...valid.sessions[0],exercise_ids:['agachar-0','exercise_inventado']},valid.sessions[1]]},
 {...valid,sessions:[{...valid.sessions[0],exercise_ids:['agachar-0']},valid.sessions[1]]},
 {...valid,sessions:[{...valid.sessions[0],index:9},valid.sessions[1]]},
 {...valid,sessions:[{...valid.sessions[0],coach_note:'oi'},valid.sessions[1]]},
 {...valid,summary:'pouco'},
 null
];
for(const candidate of invalids)assert.throws(()=>applySafeAiDecisions(base,candidate,'gpt-4.1-mini'));
const schema=aiSchema();
assert.equal(schema.strict,true);
assert.equal(schema.schema.additionalProperties,false);
assert.deepEqual(schema.schema.required,['summary','sessions']);
console.log('PASS: safe AI decisions reorder only, preserve doses, reject invented IDs/duplicates/missing sessions and enforce strict schema');
