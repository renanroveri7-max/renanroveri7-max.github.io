'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
export default function ResetPassword({enabled}:{enabled:boolean}){
  const router=useRouter();const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!enabled)return;if(password.length<8||password!==confirm){setStatus('A senha deve ter pelo menos 8 caracteres e corresponder à confirmação.');return}setBusy(true);const {error}=await createClient().auth.updateUser({password});setBusy(false);if(error)setStatus(`Não foi possível atualizar: ${error.message}`);else{setStatus('Senha atualizada. Redirecionando...');router.replace('/app');router.refresh()}};
  return <main className="t-auth"><div className="t-auth-card"><Link href="/" className="t-public-brand">TRANSFORMA<span>360</span></Link><h1>Nova senha</h1><p>Abra esta tela pelo link enviado ao seu email.</p>{!enabled&&<p className="t-auth-feedback error">Configure o Supabase primeiro.</p>}<form onSubmit={e=>void submit(e)}><label>Nova senha<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar senha<input type="password" minLength={8} required autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button className="t-primary" type="submit" disabled={!enabled||busy}>Atualizar senha</button></form>{status&&<p role="status" className="t-auth-feedback">{status}</p>}<Link href="/entrar" style={{color:'#caff8a'}}>Voltar ao login</Link></div></main>
}
