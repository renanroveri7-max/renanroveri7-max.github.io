# TRANSFORMA 360 — Fase 3.2: integração real e validação

## Estado confirmado em 13/10/2026

| Entrega | Estado | Evidência |
|---|---|---|
| Projeto Supabase `transforma360` | CONCLUÍDO | ID `fwspbbjuzqfjmbvtuzjo`; organização `transforma360`; região `sa-east-1`; `ACTIVE_HEALTHY` |
| Migração do banco | CONCLUÍDO | Migração `initial_fitness_schema_rls` com sucesso |
| Tabelas | CONCLUÍDO | `profiles`, `workouts`, `meals`, `weight_logs`, `water_logs` |
| Políticas RLS | CONCLUÍDO | 4 por tabela; 20 políticas criadas e verificadas; `anon` sem permissão SELECT |
| Security Advisor | CONCLUÍDO | Nenhum alerta retornado pelo Supabase na verificação |
| Teste sintético SQL de RLS | CONCLUÍDO | Dois UUIDs simulando sessões A/B: B não leu, inseriu como A, atualizou ou apagou registros de A em nenhuma tabela |
| Limpeza QA | CONCLUÍDO | Transação revertida; 0 contas QA e 0 linhas residuais em todas as 5 tabelas |
| Variáveis na Vercel | CONCLUÍDO | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, escopos production + preview |
| Novo deploy Next.js | CONCLUÍDO | Vercel deployment `dpl_8Sj98eJgvTxJDJWtR816QafG1FwK`, estado `READY` |
| Autorização de callback no Supabase Auth | **PENDENTE** | Sem ferramenta conectada que modifique a configuração do Auth; deve ser ajustada no painel |
| Teste real cadastro/email/sessão/recovery | **PENDENTE** | Ainda não realizados com contas QA reais e confirmação por email |
| Vercel Deployment Protection | **ATIVA** | SSO do workspace habilitado para endereços `.vercel.app`; preservado até revisão de lançamento |
| Supabase SMTP customizado / limites | **PENDENTE** | Revisar antes de convidar público e enviar emails em volume |
| LGPD, exclusão de conta e políticas | **PENDENTE** | Imprescindível antes da comercialização |

### O que o teste RLS garante — e o que não garante

O teste direto usou transação do PostgreSQL (`BEGIN` ... `ROLLBACK`), criou identidades temporárias em `auth.users`, selecionou o papel `authenticated` com `request.jwt.claim.sub` e validou SELECT/INSERT/UPDATE/DELETE entre A e B. Não houve alteração persistente.

Esse teste avalia as **políticas no banco**, não comprova que um email real chegou, que o SDK do navegador criou uma sessão válida ou que a renovação de cookies e os redirecionamentos de Auth funcionam.

## Passo obrigatório no painel: URLs de autenticação

A ferramenta Supabase conectada pode criar projetos, executar SQL e gerar chaves; **não expõe ações para modificar `Authentication → URL Configuration`**. Não alterar campos do Auth indiretamente pelo SQL.

Acesse:

**https://supabase.com/dashboard/project/fwspbbjuzqfjmbvtuzjo/auth/url-configuration**

Configure:

- **Site URL:** `https://renanroveri7-max-github-io.vercel.app`
- **Redirect URLs:** `https://renanroveri7-max-github-io.vercel.app/auth/callback`
- **Redirect URLs:** `https://renanroveri7-max-github-io.vercel.app/auth/callback?next=/redefinir` (link usado na recuperação de senha; se a interface aplicar regras glob ao caractere `?`, usar `https://renanroveri7-max-github-io.vercel.app/auth/callback**`).
- Opcional em desenvolvimento: `http://localhost:3000/auth/callback**`.

**Não inclua URLs arbitrárias de terceiros** na lista de redirecionamentos.

Confira também:
- Email habilitado e verificação de email exigida em `Authentication → Providers`.
- Template de confirmação/recovery, remetente e configuração SMTP em `Authentication → Email` ou área SMTP correspondente.
- Para produção, preferir provedor SMTP próprio, limites de taxa e proteção antiabuso.

Docs oficiais: https://supabase.com/docs/guides/auth/redirect-urls e https://supabase.com/docs/guides/auth/passwords

## Teste real a realizar após autorizar os URLs

1. Confirmar que o site está acessível durante o teste. A Vercel hoje protege `.vercel.app` com login Vercel; não abrir para o público antes de revisar o produto.
2. Criar **duas contas QA descartáveis** com emails próprios acessíveis, via `/entrar`.
3. Confirmar emails, autenticar separadamente, verificar acesso a `/app`.
4. Conta A: gravar perfil, treino, refeição, peso e água. Conta B: registros devem estar vazios.
5. Tentar ler/inserir/alterar/excluir a linha de A por B via SDK autenticado (script `scripts/test-rls.mjs`). Os testes SQL anteriores não substituem este fluxo.
6. Testar logout, link de redefinição, atualização de senha, recarga e expiração de sessão.
7. Conferir fluxos em janela anônima e celular.
8. Verificar se os emails de confirmação usam o destino exato e se não há redirecionamento aberto.
9. **Só depois** revisar retirada da proteção Vercel, aviso de privacidade/LGPD e lançamento fechado para beta.

## Segurança

Nunca inserir `service_role` ou `sb_secret_` em arquivos do GitHub, mensagens ou variáveis `NEXT_PUBLIC_`. As chaves publicáveis são adequadas ao navegador **somente com RLS corretamente aplicada**. Os dados demo locais não são sincronizados com o banco e não devem conter informações clínicas reais.

## Atualização QA com a primeira conta real (13/10/2026)

- **Confirmado diretamente por consulta SQL:** 1 usuário no Supabase Auth, 1 perfil, 1 treino, 1 refeição, 1 registro de peso e 1 registro de água (1.000 ml registrados naquele momento).
- **Integridade referencial:** os registros de treino, alimentação e peso estão ligados por `user_id` a uma conta existente em `auth.users`.
- **Confirmado pelo testador no navegador:** cadastro e confirmação de email funcionaram; o perfil e os registros permaneceram após recarregar a página.
- **Ainda pendente:** segunda conta real e teste cruzado de isolamento ponta a ponta; recuperação de senha; ambiente de email/SMTP em produção; políticas LGPD e acesso público.
- **Observação de segurança:** o Supabase Security Advisor indicou um aviso `auth_leaked_password_protection` (proteção contra senhas vazadas desativada); revisar as configurações de senha do Auth antes do lançamento.

## QA com segunda conta real — 13/10/2026

- Testador confirmou no navegador: segunda conta criada e autenticada; dashboard exibiu dados zerados, sem mostrar dados da primeira conta.
- Consulta independente ao Supabase Auth: **2 usuários**, ambos com email confirmado.
- Consulta no PostgreSQL por associação de `user_id`: **1 conta com registros** (perfil, treino, refeição, pesagem, hidratação) e **1 conta sem nenhum desses registros**.
- Em conjunto com o teste SQL transacional RLS (SELECT/INSERT/UPDATE/DELETE entre duas identidades simuladas), o isolamento básico está validado; ainda não equivale a auditoria de segurança ou teste de invasão completo.
- **Pendências**: recuperação de senha ponta a ponta com email, checklist de privacidade/LGPD, proteção contra senhas vazadas, acessibilidade pública da Vercel e testes de produção.
