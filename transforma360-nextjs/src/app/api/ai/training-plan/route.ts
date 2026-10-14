import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {createAutomaticPlan,type ExtendedTrainingAssessment} from '@/lib/premium-planner';
import {validateExtendedAssessment} from '@/lib/premium-planner';
import {applySafeAiDecisions,aiSchema} from '@/lib/ai-plan-validator';

export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=40;

const response=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
const allowedModels=['gpt-4.1-mini','gpt-4o-mini'];
const modelName=()=>allowedModels.includes(process.env.OPENAI_TRAINING_MODEL||'')
  ?process.env.OPENAI_TRAINING_MODEL!: 'gpt-4.1-mini';
const providerReady=()=>Boolean(process.env.OPENAI_API_KEY?.trim());
const utcStart=()=>new Date(new Date().toISOString().slice(0,10)+'T00:00:00Z').toISOString();

async function currentUser(){
  const client=await createClient();
  const {data,error}=await client.auth.getUser();
  return {client,user:!error?data.user:null};
}
function activeEntitlement(e:unknown):e is {status:string;expires_at:string|null;daily_limit:number}{
  if(!e||typeof e!=='object')return false;
  const x=e as {status?:string;expires_at?:string|null;daily_limit?:number};
  return (x.status==='active'||x.status==='trial')
    &&(!x.expires_at||new Date(x.expires_at).getTime()>Date.now())
    &&typeof x.daily_limit==='number';
}

export async function GET(){
  try{
    const {client,user}=await currentUser();
    if(!user)return response({status:'unauthenticated',available:false},401);
    const {data:entitlement,error}=await client.from('ai_entitlements')
      .select('status,expires_at,daily_limit').eq('user_id',user.id).maybeSingle();
    if(error)return response({status:'temporarily_unavailable',available:false},503);
    if(!providerReady())return response({status:'provider_not_configured',available:false});
    if(!activeEntitlement(entitlement))return response({status:'subscription_required',available:false});
    const {count,error:countErr}=await client.from('ai_generation_attempts')
      .select('id',{count:'exact',head:true}).eq('user_id',user.id).gte('requested_at',utcStart());
    if(countErr)return response({status:'temporarily_unavailable',available:false},503);
    const remaining=Math.max(0,entitlement.daily_limit-(count||0));
    return response({status:remaining>0?'ready':'daily_limit',available:remaining>0,remaining});
  }catch{
    return response({status:'temporarily_unavailable',available:false},503);
  }
}
export async function POST(request:NextRequest){
  try{
    // JSON-only cross-site POSTs also require browser's same-origin Origin.
    const origin=request.headers.get('origin');
    if(!origin||origin!==new URL(request.url).origin)return response({error:'Origem inválida.'},403);
    if(!request.headers.get('content-type')?.startsWith('application/json'))return response({error:'Envie JSON.'},415);
    if(Number(request.headers.get('content-length')||0)>512)return response({error:'Requisição grande demais.'},413);
    const {client,user}=await currentUser();
    if(!user)return response({error:'Entre na conta para continuar.'},401);
    if(!providerReady())return response({error:'A IA ainda precisa ser ativada pelo administrador.'},503);
    const {data:entitlement,error:entErr}=await client.from('ai_entitlements')
      .select('status,expires_at,daily_limit').eq('user_id',user.id).maybeSingle();
    if(entErr)return response({error:'Não foi possível validar a assinatura.'},503);
    if(!activeEntitlement(entitlement))return response({error:'Acesso à IA requer assinatura ativa ou acesso de teste autorizado.'},402);
    const body:unknown=await request.json();
    if(!body||typeof body!=='object'||(body as Record<string,unknown>).confirmProviderConsent!==true)
      return response({error:'Autorize explicitamente o envio da avaliação ao provedor de IA.'},400);

    const {data:row,error:profileError}=await client.from('training_assessments')
      .select('goal,experience,training_place,equipment,days_per_week,minutes_per_session,age_confirmed,readiness,age_years,height_cm,body_mass_kg,daily_activity,months_training,preferred_days,focus_areas,cardio_preference,progression_preference,sleep_quality')
      .eq('user_id',user.id).maybeSingle();
    if(profileError||!row)return response({error:'Salve primeiro sua avaliação completa.'},400);
    const assessment={...row,body_mass_kg:row.body_mass_kg===null?null:Number(row.body_mass_kg)} as ExtendedTrainingAssessment;
    const invalid=validateExtendedAssessment(assessment);
    if(invalid)return response({error:invalid},422);
    const base=createAutomaticPlan(assessment);
    // Consent records that these minimal profile fields may be processed externally.
    const {error:consentError}=await client.from('training_assessments')
      .update({ai_provider_consent_at:new Date().toISOString()}).eq('user_id',user.id);
    if(consentError)return response({error:'Não foi possível registrar seu consentimento.'},503);

    const {data:claimed,error:claimError}=await client.rpc('claim_training_ai_attempt');
    if(claimError)return response({error:'Não foi possível reservar uma geração de IA.'},503);
    if(claimed==='daily_limit')return response({error:'Limite diário de gerações de IA atingido. Tente amanhã.'},429);
    if(claimed!=='ok')return response({error:'Seu acesso à IA não está ativo.'},402);

    const profileForModel={
      goal:assessment.goal,experience:assessment.experience,
      age_years:assessment.age_years,height_cm:assessment.height_cm,body_mass_kg:assessment.body_mass_kg,
      activity:assessment.daily_activity,sleep_quality:assessment.sleep_quality,
      place:assessment.training_place,equipment:assessment.equipment,
      days_per_week:assessment.days_per_week,minutes_per_session:assessment.minutes_per_session,
      focus_areas:assessment.focus_areas,cardio_preference:assessment.cardio_preference,
      months_training:assessment.months_training
    };
    // Exercise identity, sets/reps/rest, safety warnings and provenance are not model-editable.
    const candidates=base.days.map(day=>({
      index:day.index,title:day.title,focus:day.focus,
      exercises:day.exercises.map(ex=>({
        id:ex.id,name:ex.name,movement:ex.movement,sets:ex.sets,
        repetitions:ex.reps,restSeconds:ex.restSeconds
      }))
    }));
    const system=[
      'Você é um assistente de planejamento EDUCATIVO de atividade física para adultos, não um médico.',
      'Use apenas os exercícios e IDs que foram previamente selecionados por regras de segurança.',
      'Para cada sessão, devolva TODOS os exercise_ids existentes, exatamente uma vez. Você pode apenas reordená-los.',
      'Explique a prioridade e a ordem para a pessoa em português do Brasil, sem mencionar diagnósticos ou criar prescrições médicas.',
      'Nunca indique quilogramas de carga, doses de exercício adicionais, novos exercícios ou promessas de resultado.',
      'Considere a experiência e as preferências, sem inferir força a partir da altura ou massa corporal.',
      'Base científica curada: ACSM 2026, revisão de 137 revisões sistemáticas de treino resistido em adultos saudáveis; consistência, progressão e seleção de volume conforme objetivo.',
      'OMS recomenda atividade física regular e fortalecimento dos principais grupos musculares em 2 ou mais dias por semana quando possível.',
      'Se disponibilidade for 1 dia, não invente um segundo dia. Nunca ultrapasse o plano de exercícios aprovado.',
      'A resposta deve seguir estritamente o JSON Schema informado.'
    ].join(' ');
    const provider=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
      signal:AbortSignal.timeout(26000),
      body:JSON.stringify({
        model:modelName(),store:false,max_output_tokens:1700,temperature:0.2,
        input:[
          {role:'system',content:system},
          {role:'user',content:JSON.stringify({assessment:profileForModel,approved_sessions:candidates})}
        ],
        text:{format:{type:'json_schema',...aiSchema()}}
      })
    });
    if(!provider.ok)return response({error:provider.status===429
      ?'O provedor de IA atingiu seu limite. Tente novamente mais tarde.'
      :'O provedor de IA não conseguiu gerar o plano. Nenhum plano incompleto foi salvo.'},503);
    const result=await provider.json() as {
      status?:string;output?:{content?:{type:string;text?:string}[]}[];
    };
    if(result.status!=='completed')return response({error:'A geração não foi concluída. Nenhum plano foi salvo.'},503);
    const raw=result.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text;
    if(!raw)return response({error:'A IA não retornou uma resposta validável.'},503);
    let decision:unknown;
    try{decision=JSON.parse(raw)}catch{return response({error:'A IA retornou dados inválidos.'},503)}
    let blueprint;
    try{blueprint=applySafeAiDecisions(base,decision,modelName())}
    catch{return response({error:'O resultado da IA não passou pela validação de segurança.'},503)}
    const {data:plan,error:saveError}=await client.from('training_plans')
      .insert({user_id:user.id,blueprint}).select('id,created_at,blueprint').single();
    if(saveError||!plan)return response({error:'Falha ao salvar o plano na sua conta.'},503);
    return response({plan:{id:plan.id,created_at:plan.created_at,blueprint:plan.blueprint}});
  }catch{
    return response({error:'Não foi possível gerar seu plano de IA neste momento.'},503);
  }
}
