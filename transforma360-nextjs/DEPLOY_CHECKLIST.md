# TRANSFORMA 360 — Fase 3.1: estado de implantação

## Concluído
- [x] Portfólio original preservado no GitHub Pages.
- [x] Demonstração Fase 2.2 publicada em `https://renanroveri.com.br/transforma360/`.
- [x] Projeto Next.js + TypeScript integralmente importado para `transforma360-nextjs/`.
- [x] Ficheiros SQL de PostgreSQL e políticas RLS versionados.
- [x] Configuração `vercel.json` adicionada.
- [x] Pipeline de CI GitHub Actions configurado para `transforma360-nextjs/**`.
- [x] Primeira instalação npm + TypeScript typecheck + `next build` aprovados. Execução: https://github.com/renanroveri7-max/renanroveri7-max.github.io/actions/runs/38479699481

## Ainda pendente
- [ ] Criar projeto Vercel e importar o repositório `renanroveri7-max/renanroveri7-max.github.io`.
- [ ] Na Vercel, definir **Root Directory = transforma360-nextjs** e framework **Next.js**.
- [ ] Publicar primeiro sob URL de preview da Vercel; não modificar o CNAME do portfólio.
- [ ] Testar acesso às rotas /, /demo, /entrar e /app no deploy Vercel.
- [ ] Criar/configurar projeto Supabase do proprietário.
- [ ] Aplicar/revisar SQL `sql/001_schema_rls.sql` no Supabase.
- [ ] Definir variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na Vercel, sem expor credenciais privadas.
- [ ] Configurar URL de site/redirecionamentos Supabase Auth.
- [ ] Validar sessão, recuperação e isolamento com duas contas reais diferentes.
- [ ] Considerar subdomínio do app e requisitos legais antes de produção.
