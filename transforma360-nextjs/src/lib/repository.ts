import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultData, type Meal, type Profile, type UserData, type Weight, type Workout } from '@/types/models';

// Somente registros inseridos pelo próprio usuário são lidos. O RLS no Postgres
// é a barreira de isolamento real; filtros .eq(user_id) são apenas defesa adicional.
type DbProfile = {display_name:string;goal:Profile['goal'];training_place:Profile['place'];days_per_week:number;minutes_per_session:number;prefers_dark:boolean};
type DbWorkout = {id:string;day:string;created_at:string;sets:Workout['sets']};
type DbMeal = {id:string;day:string;title:string;ingredients:string[];portion:string;created_at:string};
type DbWeight = {id:string;day:string;kilograms:number};
type DbWater = {day:string;milliliters:number};

function assertNoError(error: {message: string}|null, context:string) {if(error) throw new Error(`${context}: ${error.message}`)}
export async function loadUserData(client: SupabaseClient, uid:string): Promise<UserData> {
  const [profile, workouts, meals, weights, water] = await Promise.all([
    client.from('profiles').select('display_name,goal,training_place,days_per_week,minutes_per_session,prefers_dark').eq('user_id',uid).maybeSingle(),
    client.from('workouts').select('id,day,created_at,sets').eq('user_id',uid).order('day',{ascending:false}).limit(500),
    client.from('meals').select('id,day,title,ingredients,portion,created_at').eq('user_id',uid).order('day',{ascending:false}).limit(500),
    client.from('weight_logs').select('id,day,kilograms').eq('user_id',uid).order('day',{ascending:false}).limit(500),
    client.from('water_logs').select('day,milliliters').eq('user_id',uid).order('day',{ascending:false}).limit(365)
  ]);
  [profile,workouts,meals,weights,water].forEach((r,i)=>assertNoError(r.error,['Perfil','Treinos','Alimentação','Pesos','Água'][i]));
  const output=defaultData();
  if(profile.data){const p=profile.data as DbProfile;output.profile={name:p.display_name,goal:p.goal,place:p.training_place,days:p.days_per_week,minutes:p.minutes_per_session,dark:p.prefers_dark}}
  output.workouts=((workouts.data||[]) as DbWorkout[]).map(w=>({id:w.id,date:w.day,createdAt:w.created_at,sets:Array.isArray(w.sets)?w.sets:[]}));
  output.meals=((meals.data||[]) as DbMeal[]).map(m=>({id:m.id,date:m.day,title:m.title,items:m.ingredients,portion:m.portion,createdAt:m.created_at}));
  output.weights=((weights.data||[]) as DbWeight[]).map(w=>({id:w.id,date:w.day,value:Number(w.kilograms)}));
  output.water=Object.fromEntries(((water.data||[]) as DbWater[]).map(w=>[w.day,w.milliliters]));
  return output;
}
export type Mutation =
  | {type:'profile'; profile:Profile}
  | {type:'water'; day:string; ml:number}
  | {type:'workout:add'; workout:Workout}
  | {type:'workout:remove'; id:string}
  | {type:'meal:add'; meal:Meal}
  | {type:'meal:remove'; id:string}
  | {type:'weight:add'; weight:Weight}
  | {type:'weight:remove'; id:string};
export async function mutateCloud(client:SupabaseClient,uid:string,m:Mutation):Promise<void> {
  let result: {error: {message:string}|null};
  switch(m.type){
    case 'profile': result=await client.from('profiles').upsert({user_id:uid,display_name:m.profile.name,goal:m.profile.goal,training_place:m.profile.place,days_per_week:m.profile.days,minutes_per_session:m.profile.minutes,prefers_dark:m.profile.dark,updated_at:new Date().toISOString()},{onConflict:'user_id'});break;
    case 'water': result=await client.from('water_logs').upsert({user_id:uid,day:m.day,milliliters:m.ml},{onConflict:'user_id,day'});break;
    case 'workout:add': result=await client.from('workouts').insert({id:m.workout.id,user_id:uid,day:m.workout.date,sets:m.workout.sets,created_at:m.workout.createdAt});break;
    case 'workout:remove': result=await client.from('workouts').delete().eq('id',m.id).eq('user_id',uid);break;
    case 'meal:add': result=await client.from('meals').insert({id:m.meal.id,user_id:uid,day:m.meal.date,title:m.meal.title,ingredients:m.meal.items,portion:m.meal.portion,created_at:m.meal.createdAt});break;
    case 'meal:remove': result=await client.from('meals').delete().eq('id',m.id).eq('user_id',uid);break;
    case 'weight:add': result=await client.from('weight_logs').insert({id:m.weight.id,user_id:uid,day:m.weight.date,kilograms:m.weight.value});break;
    case 'weight:remove': result=await client.from('weight_logs').delete().eq('id',m.id).eq('user_id',uid);break;
  }
  assertNoError(result.error,'Salvamento remoto');
}
const DEMO_KEY='t360_demo_fase31';
export function loadDemo():UserData {
  if(typeof window==='undefined')return defaultData();
  try {
    const text=window.localStorage.getItem(DEMO_KEY);
    const v=text?JSON.parse(text):null;
    if(v && v.profile && Array.isArray(v.workouts) && Array.isArray(v.meals) && Array.isArray(v.weights) && v.water && typeof v.water==='object')return v as UserData;
  }catch{/* storage pode estar bloqueado */}
  return defaultData();
}
export function saveDemo(data:UserData):boolean {
  try {window.localStorage.setItem(DEMO_KEY,JSON.stringify(data));return true;}catch{return false;}
}
export function removeDemo(){try{window.localStorage.removeItem(DEMO_KEY)}catch{/* sem persistência */}}
export function applyLocal(data:UserData,m:Mutation):UserData {
  const next:UserData=structuredClone(data);
  switch(m.type){
    case 'profile':next.profile=m.profile;break;
    case 'water':next.water[m.day]=m.ml;break;
    case 'workout:add':next.workouts=[m.workout,...next.workouts];break;
    case 'workout:remove':next.workouts=next.workouts.filter(x=>x.id!==m.id);break;
    case 'meal:add':next.meals=[m.meal,...next.meals];break;
    case 'meal:remove':next.meals=next.meals.filter(x=>x.id!==m.id);break;
    case 'weight:add':next.weights=[m.weight,...next.weights];break;
    case 'weight:remove':next.weights=next.weights.filter(x=>x.id!==m.id);break;
  }
  return next;
}
