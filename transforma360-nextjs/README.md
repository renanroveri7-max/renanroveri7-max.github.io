# TRANSFORMA 360 — Fase 3.1 (Next.js + Supabase)

## Estado
Esta pasta é reservada ao projeto **Next.js/TypeScript**. O código completo está no pacote local da Fase 3.1 entregue ao proprietário e **ainda precisa ser importado para este diretório** antes de iniciar uma implantação.

A versão pública de demonstração está preservada em [../transforma360](../transforma360), sob `https://renanroveri.com.br/transforma360/`, e permanece independente.

## Deploy planejado na Vercel

- Importar repositório `renanroveri7-max/renanroveri7-max.github.io` na Vercel como **novo projeto**, sem mudar o domínio do portfólio.
- Configurar **Root Directory** como `transforma360-nextjs` **depois de confirmar que package.json e src/ estão presentes**.
- Framework: Next.js, runtime Node 20.9+.
- Instalar/build: usar comandos padrão `npm install` e `npm run build`.
- Primeiro domínio de testes: o fornecido pela Vercel (não mudar CNAME do domínio principal).
- Credenciais `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` somente no painel de variáveis Vercel; nunca em commits.
- A conexão com Supabase, migração SQL e testes de RLS são necessários antes de considerar contas ou dados online operacionais.

## Segurança
Não há checkout, IA ou autenticação publicada nesta pasta. A demonstração local usa dados mantidos no navegador; não armazenar dados sensíveis em computador compartilhado. O código da Fase 3.1 deve ser validado em build e testes de isolamento antes do lançamento.

## Fonte da Fase 3.1
O workflow do repositório aceita um manifesto comprimido `source.manifest.xz.b64` para restaurar os arquivos de texto na pasta. O manifesto deve ser enviado apenas depois de revisão de segredos, inclusão dos ativos públicos e testes. O workflow **não** implanta o Next.js automaticamente.
