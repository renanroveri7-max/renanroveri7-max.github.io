import { redirect } from 'next/navigation';
import FitnessApp from '@/components/FitnessApp';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/config';
export const dynamic = 'force-dynamic';
export default async function PrivatePage(){
  if(!supabaseConfigured())redirect('/entrar?setup=1');
  const client=await createClient();
  const {data,error}=await client.auth.getClaims();
  if(error||!data?.claims?.sub)redirect('/entrar');
  const uid=String(data.claims.sub);
  const {data:info}=await client.auth.getUser();
  return <FitnessApp mode="cloud" userId={uid} userEmail={info.user?.email}/>;
}
