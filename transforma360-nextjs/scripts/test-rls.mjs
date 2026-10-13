/**
 * TRANSFORMA 360 — RLS smoke test with two disposable Supabase Auth accounts.
 * No admin/service role key. NEVER use real customer accounts.
 *
 * Usage: Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * T360_TEST_A_EMAIL/PASSWORD and T360_TEST_B_EMAIL/PASSWORD locally and run:
 * node scripts/test-rls.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'T360_TEST_A_EMAIL', 'T360_TEST_A_PASSWORD',
  'T360_TEST_B_EMAIL', 'T360_TEST_B_PASSWORD',
];
for (const key of required) {
  if (!process.env[key]) throw new Error('Missing local environment variable: ' + key);
}
if (process.env.T360_TEST_A_EMAIL.toLowerCase() === process.env.T360_TEST_B_EMAIL.toLowerCase()) {
  throw new Error('Need two distinct disposable test accounts');
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!/^https:\/\/[^ ]+\.supabase\.co\/?$/.test(url) || !key.startsWith('sb_publishable_')) {
  throw new Error('Supply a project Supabase URL and a publishable key only');
}
const options = {auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}};
const a = createClient(url,key,options);
const b = createClient(url,key,options);
const credentials = [
  [a, process.env.T360_TEST_A_EMAIL, process.env.T360_TEST_A_PASSWORD],
  [b, process.env.T360_TEST_B_EMAIL, process.env.T360_TEST_B_PASSWORD],
];
const ids = [];
for (const [client,email,password] of credentials) {
  const {data,error} = await client.auth.signInWithPassword({email,password});
  if (error || !data.user?.id) throw new Error('Cannot authenticate test account: ' + email + ' (' + (error?.message||'unknown') + ')');
  ids.push(data.user.id);
}
const [uidA, uidB] = ids;
if (uidA === uidB) throw new Error('Both sessions resolved to the same user');

const sampleDay = '2088-01-21';
const workoutId = randomUUID(), mealId=randomUUID(), weightId=randomUUID();
const created = [];
async function insertTest(table, payload, where) {
  const {error} = await a.from(table).insert(payload);
  if (error) throw new Error(table + ' insert with user A failed: ' + error.message);
  created.push([table, where]);
}
async function assertSafe(table, target, label) {
  const {data, error} = await b.from(table).select('*').eq('user_id',uidA);
  if (error) throw new Error(table + ' read with user B errored: '+error.message);
  if ((data||[]).some(x => target(x))) throw new Error('RLS LEAK: B can read A in ' + table);
  // Inserts with A's user_id must never succeed under B session.
  const crossPayload = label;
  const {error: crossInsertError} = await b.from(table).insert(crossPayload);
  if (!crossInsertError) throw new Error('RLS LEAK: B can insert as A in '+table);
  const {data:updated,error:updateError} = await b.from(table).update({user_id:uidB}).eq('user_id',uidA).select('*');
  if (!updateError && updated?.length) throw new Error('RLS LEAK: B can update A in '+table);
  const {data:deleted,error:deleteError} = await b.from(table).delete().eq('user_id',uidA).select('*');
  if (!deleteError && deleted?.length) throw new Error('RLS LEAK: B can delete A in '+table);
  const {data:remaining,error:remainingError} = await a.from(table).select('*').eq('user_id',uidA);
  if (remainingError || !remaining?.some(target)) throw new Error('B mutation affected A row (or missing row) in '+table);
  console.log('PASS:',table,'B cannot view, insert as A, update or delete A');
}

try {
  // Dedicated, empty test accounts only: profiles insert must fail if already exists.
  await insertTest('profiles', {user_id:uidA, display_name:'QA temporary A'}, {user_id:uidA});
  await insertTest('workouts', {id:workoutId,user_id:uidA,day:sampleDay,sets:[{id:randomUUID(),exercise:'QA agachamento',reps:1,load:null}]}, {id:workoutId});
  await insertTest('meals', {id:mealId,user_id:uidA,day:sampleDay,title:'QA temporário',ingredients:['Água'],portion:'teste'}, {id:mealId});
  await insertTest('weight_logs', {id:weightId,user_id:uidA,day:sampleDay,kilograms:70}, {id:weightId});
  await insertTest('water_logs', {user_id:uidA,day:sampleDay,milliliters:250}, {user_id:uidA,day:sampleDay});

  const checks = [
    ['profiles',x=>x.user_id===uidA,{user_id:uidA,display_name:'QA attack'}],
    ['workouts',x=>x.id===workoutId,{id:randomUUID(),user_id:uidA,day:sampleDay,sets:[{id:randomUUID(),exercise:'QA',reps:1,load:null}]}],
    ['meals',x=>x.id===mealId,{id:randomUUID(),user_id:uidA,day:sampleDay,title:'QA attack',ingredients:['Água'],portion:'test'}],
    ['weight_logs',x=>x.id===weightId,{id:randomUUID(),user_id:uidA,day:'2088-01-22',kilograms:70}],
    ['water_logs',x=>x.user_id===uidA && x.day===sampleDay,{user_id:uidA,day:'2088-01-22',milliliters:250}],
  ];
  for (const [table,filter,attempt] of checks) await assertSafe(table,filter,attempt);
  console.log('PASS: all five tables enforce owner isolation for these two test accounts');
} finally {
  for (const [table,where] of created.reverse()){
    let q=a.from(table).delete();
    for (const [k,v] of Object.entries(where)) q=q.eq(k,v);
    const {error}=await q;
    if(error) console.error('CLEANUP REQUIRED:',table,error.message);
  }
  await Promise.all([a.auth.signOut(),b.auth.signOut()]);
}
