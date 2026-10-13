# TRANSFORMA 360 — Prévia pública (Fase 2.2)

Publicado em `/transforma360/` no site GitHub Pages conectado ao domínio `renanroveri.com.br`.

**Atenção:** esta é uma DEMONSTRAÇÃO LOCAL do dashboard premium. Inclui as telas Hoje, Treinos, Alimentação, Evolução e Perfil. O salvamento ocorre no navegador, não no servidor. Não contém login, contas, banco remoto, IA, pagamentos nem prescrição clínica. Não inserir dados sensíveis em dispositivos compartilhados.

## Estrutura

- `index.html`: landing, questionário demonstrativo e dashboard 2.2, HTML/CSS/JS incorporados.
- `manifest.webmanifest`: metadados para instalação opcional.
- `sw.js`: cache local restrito à pasta desta aplicação.
- `assets/logo.svg`: identidade visual.

## Evolução para a Fase 3.1

A versão de engenharia foi preparada em Next.js/TypeScript com autenticação SSR, SQL PostgreSQL e RLS, mas **não pode ser executada pelo GitHub Pages**. Para publicar essa versão com login real será necessária hospedagem compatível com Next.js no servidor (por exemplo, Vercel) e projeto Supabase configurado/testado. O domínio poderá ser apontado a essa hospedagem posteriormente, com cuidado para não alterar o site principal.

Documentação de configuração e o projeto Next.js da Fase 3.1 estão no pacote entregue na conversa.

Nenhum segredo ou chave de API deve ser enviado a este repositório público.
