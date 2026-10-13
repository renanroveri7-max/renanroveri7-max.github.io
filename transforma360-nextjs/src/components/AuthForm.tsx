'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
type AuthView='login'|'signup'|'forgot';

// Supabase pode bloquear temporariamente emails de confirmação/recuperação por limite
// do provedor SMTP. Não sugerir que o link foi enviado quando a API retornou erro.
function friendlyAuthError(err:unknown):string {
  const item=err && typeof err==='object' ? err as {message?:string;code?:string;status?:number}: {};
  const raw=typeof item.message==='string'?item.message:'';
  const code=typeof item.code==='string'?item.code:'';
  if(item.status===429 || /email.rate.limit|over_email_send_rate_limit|rate.limit.exceeded|too.many.requests/i.test(raw+' '+code)){
    return 'O serviço de email atingiu o limite temporário de envios. Nenhum link foi enviado agora. Aguarde um tempo antes de tentar novamente. Se continuar, contate o suporte do TRANSFORMA 360.';
  }
  return raw || 'Não foi possível concluir a autenticação. Tente novamente.';
}
export default function AuthForm({enabled}:{enabled:boolean}){
  const router=useRouter();const [view,setView]=useState<AuthView>('login');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [loading,setLoading]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState(false);
  const submit=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();if(!enabled)return;setLoading(true);setError(false);setMessage('');
    const client=createClient();const origin=window.location.origin;
    try{
      if(view==='forgot'){
        const {error:err}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?next=/redefinir`});
        if(err)throw err;
        setMessage('Se o email estiver cadastrado, enviaremos instruções de recuperação.');
      }else if(view==='signup'){
        if(password.length<8)throw new Error('Use uma senha de pelo menos 8 caracteres.');
        const {data,error:err}=await client.auth.signUp({email,password,options:{emailRedirectTo:`${origin}/auth/callback`}});
        if(err)throw err;
        if(data.session){router.replace('/app');router.refresh();}
        else setMessage('Cadastro solicitado. Confira sua caixa de entrada para confirmar o email, se essa proteção estiver habilitada no Supabase.');
      }else{
        const {error:err}=await client.auth.signInWithPassword({email,password});
        if(err)throw err;
        router.replace('/app');router.refresh();
      }
    }catch(err){setError(true);setMessage(friendlyAuthError(err));}
    finally{setLoading(false)}
  };
  return <main className="t-auth"><div className="t-auth-card"><Link href="/" className="t-public-brand">TRANSFORMA<span>360</span></Link><h1>{view==='login'?'Bem-vindo de volta':view==='signup'?'Criar conta':'Recuperar acesso'}</h1><p>{view==='login'?'Entre na sua conta para acessar seus registros protegidos.':view==='signup'?'Crie sua conta com email e senha.':'Enviaremos um link para redefinir sua senha.'}</p>{!enabled&&<p className="t-auth-feedback error">O Supabase ainda não foi configurado. O login real está desativado; você pode <Link href="/demo" style={{textDecoration:'underline'}}>testar a demonstração</Link> sem conta.</p>}<form onSubmit={e=>void submit(e)}><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></label>{view!=='forgot'&&<label>Senha<input type="password" required minLength={view==='signup'?8:1} autoComplete={view==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></label>}<button className="t-primary" type="submit" disabled={!enabled||loading}>{loading?'Aguarde...':view==='login'?'Entrar':view==='signup'?'Criar conta':'Enviar link'}</button></form>{message&&<p role="status" className={`t-auth-feedback ${error?'error':''}`}>{message}</p>}<div className="t-auth-links"><button type="button" onClick={()=>{setView(view==='signup'?'login':'signup');setMessage('')}}>{view==='signup'?'Já tenho conta':'Criar uma conta'}</button><button type="button" onClick={()=>{setView(view==='forgot'?'login':'forgot');setMessage('')}}>{view==='forgot'?'Voltar ao login':'Esqueci minha senha'}</button></div><p><Link href="/demo" style={{color:'#caff8a'}}>Explorar demo sem cadastro →</Link></p></div></main>
}
