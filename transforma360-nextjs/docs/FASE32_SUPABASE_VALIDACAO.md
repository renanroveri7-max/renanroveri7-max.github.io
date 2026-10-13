# TRANSFORMA 360 — Fase 3.2 (Supabase real)

**Situação:** aplicação Next.js na Vercel; Supabase ainda não conectado nem validado. Não inserir dados reais antes dos testes.

## Dependências da publicação

1. Um projeto Supabase sob controle do proprietário, de preferência nome `transforma360`.
2. Rodar e revisar `sql/001_schema_rls.sql` no SQL Editor do projeto **uma única vez**.
3. Nas configurações do Supabase Authentication, habilitar Email; ativar confirmação de email e configurar remetente SMTP para uso comercial.
4. Authentication → URL Configuration:
   - Site URL: `https://renanroveri7-max-github-io.vercel.app` (verificar se é o endereço final)
   - Redirect URLs: `https://renanroveri7-max-github-io.vercel.app/auth/callback` e, para recuperação, a mesma rota com query `next=/redefinir` se necessário.
   - Para desenvolvimento opcional: `http://localhost:3000/auth/callback`.
5. Na Vercel, projeto Next.js correto, criar três variáveis de ambiente públicas com escopos Production e Preview apropriados:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto, `https://...supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave **publishable** (`sb_publishable_...`)
   - `NEXT_PUBLIC_SITE_URL`: URL HTTPS publicada da aplicação
6. **Não colocar** segredo `service_role`, chave secreta `sb_secret_`, token pessoal ou senha no repositório, em `NEXT_PUBLIC_` ou neste chat.
7. Fazer redeploy para incorporar variáveis `NEXT_PUBLIC_` no bundle Next.js.
8. Testar cadastro, confirmação de email, login, logout, recuperação de senha, acesso não autenticado a `/app` e contas diferentes.
9. Fazer testes automatizados com duas contas descartáveis criadas apenas para QA usando `node scripts/test-rls.mjs` após definir variáveis em ambiente local seguro. O script falha se detectar dados preexistentes nessas contas; não usar contas pessoais.
10. Desligar proteção Vercel apenas após revisar que nenhum dado real esteja acessível sem sessão, o SQL esteja protegido por RLS e as duas contas tenham sido testadas. O plano Hobby/uso comercial e LGPD exigem validação antes de vender.

## Comportamento de segurança esperado

- `/demo`: armazenamento isolado no navegador; nenhum dado remoto.
- `/entrar`: exige Supabase configurado para habilitar login.
- `/app`: requer usuário autenticado e consulta ao Supabase; não reaproveita dados da demo.
- Banco: `profiles`, `workouts`, `meals`, `weight_logs`, `water_logs` com RLS por `auth.uid() = user_id`.
- Se a chamada remota falhar, deve informar erro sem exibir sucesso falso.

## Cuidados

Evitar coleta de diagnósticos, medicamentos, fotos e outros dados sensíveis nesta fase. Antes de comercializar, implementar aviso de privacidade, consentimento aplicável, exclusão/portabilidade de conta, política de retenção e revisão jurídica/profissional.
