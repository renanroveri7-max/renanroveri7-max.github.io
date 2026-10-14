import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {supabaseConfigured} from '@/lib/config';
import TrainingPlanner from '@/components/TrainingPlanner';

export const dynamic='force-dynamic';
export default async function PlanPage(){
  if(!supabaseConfigured())redirect('/entrar?setup=1');
  const client=await createClient();
  const {data,error}=await client.auth.getClaims();
  if(error||!data?.claims?.sub)redirect('/entrar');
  return <TrainingPlanner userId={String(data.claims.sub)}/>;
}
