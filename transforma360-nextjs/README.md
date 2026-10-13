# TRANSFORMA 360 · Fase 3.1 — Next.js + TypeScript + Supabase

## O que é

Migração da Fase 2.2 para projeto Next.js 16 (App Router) e TypeScript, mantendo o dashboard dark premium e as cinco telas: Hoje, Treinos, Alimentação, Evolução e Perfil. Os arquivos da Fase 2.2 estão preservados em `legacy/FASE22_ABRA_AQUI.html`.

**IMPORTANTE: esta entrega NÃO tem um projeto Supabase do usuário conectado.** A integração existe no código, mas somente funcionará após você configurar sua própria conta, o SQL e as variáveis de ambiente. O botão Entrar informa que está desativado enquanto faltam credenciais. Não há pagamentos, IA, prescrição de dieta ou avaliação clínica automatizada.

## Testar sem Supabase (no seu computador)

1. Instale Node.js 20.9+ (recomendado Node 22 LTS).
2. Abra um terminal dentro desta pasta.
3. Execute `npm install` (precisa de internet para baixar dependências).
4. Execute `npm run dev` e abra `http://localhost:3000`.
5. Clique em **Explorar demo** (`/demo`). Os registros são salvos no `localStorage` do navegador; não são sincronizados e não dependem do Supabase.

Se preferir abrir algo agora, sem instalar Node nem bibliotecas, abra `legacy/FASE22_ABRA_AQUI.html`: é a versão anterior original funcional, não a nova arquitetura Next.js.

## Conectar sua conta Supabase

Leia **`docs/CONFIGURAR_SUPABASE.md`**. Em resumo:

1. Crie um projeto no painel Supabase.
2. Execute `sql/001_schema_rls.sql` pelo SQL Editor (revise antes de executar).
3. Copie `.env.example` para `.env.local`, preencha URL e chave **publishable** do seu projeto.
4. Configure a URL do site e URLs de redirecionamento do Supabase Auth.
5. Reinicie `npm run dev`; crie duas contas para validar autenticação e isolamento de registros.

**NUNCA** copie `service_role`, secret keys, senhas ou tokens para o frontend ou para este chat.

## Visão técnica

- `src/app/page.tsx` — página inicial.
- `src/app/demo/page.tsx` — demonstração local, sem conta.
- `src/app/entrar/page.tsx` — login, cadastro e recuperação por email.
- `src/app/redefinir/page.tsx` — redefinição de senha.
- `src/app/auth/callback/route.ts` — troca de código PKCE por sessão autenticada.
- `src/app/app/page.tsx` — página protegida, valida claims no servidor.
- `src/proxy.ts` + `src/lib/supabase/` — renovação de sessão via cookies.
- `src/components/FitnessApp.tsx` — cinco telas em React com ações.
- `src/lib/repository.ts` — leitura e mutação autenticadas no Supabase; adaptador local separado.
- `sql/001_schema_rls.sql` — PostgreSQL, constraints e RLS para cada operação.
- `src/types/models.ts` — modelos de domínio TypeScript.

## Limites desta fase

- O ambiente de trabalho local não conseguiu acessar o registro npm. Posteriormente, o GitHub Actions executou **npm install, typecheck e build com sucesso**: https://github.com/renanroveri7-max/renanroveri7-max.github.io/actions/runs/38479699481. Isso valida a compilação, não login ou dados online.
- A estrutura Supabase SSR/PKCE e SQL existem, porém não foram testados contra uma conta real.
- A triagem médica do questionário da Fase 1 **não foi migrada** nesta fase: não envie dados clínicos para os campos de texto livre. A priorização foi autenticação e isolamento dos registros.
- Os dados locais da Fase 2.2 não são automaticamente importados para uma conta remota, por segurança.
- Sem upload de fotos, vídeos, pagamentos, prescrição personalizada, cálculo nutricional ou IA.
- Sem backend especial de billing/admin; planejar nas próximas fases.

## Segurança para validação antes do lançamento

Execute os testes com pelo menos duas contas reais diferentes: impedir que A veja/edite/apague registros de B. Revise as políticas no dashboard; confirme a configuração de email/cookies, CORS, limites, backup, exclusão de conta e LGPD com profissionais adequados. Não comercialize esta etapa como um serviço de acompanhamento clínico.

## Publicação pela Vercel

O código está no repositório `renanroveri7-max/renanroveri7-max.github.io`, na pasta **`transforma360-nextjs`**. Para deploy, criar projeto Vercel separado e configurar **Root Directory: `transforma360-nextjs`** e framework **Next.js**. O domínio personalizado do portfólio deve permanecer inalterado. Publicar primeiro uma URL de preview. Só configurar variáveis Supabase após criar e revisar o projeto. Veja também `DEPLOY_CHECKLIST.md`.
