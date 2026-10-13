import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/config';
export async function GET(request:NextRequest){
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  const rawNext=url.searchParams.get('next')||'/app';
  // Somente destinos internos conhecidos, impedindo redirect externo.
  const next=rawNext==='/redefinir'?'/redefinir':'/app';
  if(!supabaseConfigured())return NextResponse.redirect(new URL('/entrar?setup=1',url.origin));
  if(code){const client=await createClient();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,url.origin));}
  return NextResponse.redirect(new URL('/entrar?error=confirmacao',url.origin));
}
