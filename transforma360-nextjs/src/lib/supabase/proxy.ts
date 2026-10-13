import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfigured, supabasePublicConfig } from '@/lib/config';
export async function refreshSession(request: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.next({request});
  const {url,key} = supabasePublicConfig();
  let response = NextResponse.next({request});
  const supabase = createServerClient(url,key,{
    cookies: {
      getAll() {return request.cookies.getAll();},
      setAll(items) {
        items.forEach(({name,value})=>request.cookies.set(name,value));
        response = NextResponse.next({request});
        items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }
  });
  // getClaims valida o token antes que Server Components façam checagem de acesso.
  await supabase.auth.getClaims();
  return response;
}
