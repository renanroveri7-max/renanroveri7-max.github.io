# CONFIGURAR SUPABASE — TRANSFORMA 360

## 1. Criar o projeto

Acesse o [Supabase](https://supabase.com/dashboard), crie um projeto seu e aguarde o banco PostgreSQL ficar pronto.

## 2. Instalar tabelas e RLS

No menu **SQL Editor** do seu projeto, copie o conteúdo de `sql/001_schema_rls.sql`, revise e execute uma vez. O SQL cria `profiles`, `workouts`, `meals`, `weight_logs`, `water_logs` e índices. Ativa RLS nas cinco tabelas, retira acesso do papel `anon` e permite operações `select`, `insert`, `update`, `delete` **somente** quando `auth.uid()` corresponde ao `user_id` da linha.

⚠️ Embora as políticas estejam escritas, elas não foram validadas contra seu projeto. Faça os testes de isolamento antes de inserir dados reais.

## 3. Variáveis de ambiente

Duplique `.env.example` para `.env.local` na raiz da aplicação. Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

A URL e a publishable key são públicas por design; a segurança é a combinação de autenticação, RLS e regras do servidor. Nunca insira `service_role`, secret key ou credenciais pessoais no HTML, arquivos públicos ou variáveis `NEXT_PUBLIC_`.

## 4. Configurar autenticação

No painel Supabase: **Authentication → URL Configuration**. Defina Site URL `http://localhost:3000` e permita `http://localhost:3000/auth/callback` em Redirect URLs. Ative Email e defina se exige confirmação de endereço. Em produção, substitua pelas URLs reais do domínio, com HTTPS.

Em **Authentication → Providers**, confira o provedor Email. Em produção, configure também envio de email, limites de taxa e proteção contra abuso.

## 5. Iniciar o projeto

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/entrar`, crie uma conta, confirme email conforme configuração e entre. O painel privado será `/app`. Sem sessão válida ele redireciona para `/entrar`.

## 6. Validar RLS com duas contas

1. Crie conta A e B com emails diferentes.
2. Logue com A, registre um treino, uma refeição, um peso e água.
3. Logue com B (em janela anônima), confirme que os registros de A não aparecem.
4. Via SDK autenticado com B, tente fazer `insert` usando `user_id` de A e `delete`/`update` de uma linha pertencente a A. As operações não devem permitir mudança; em algumas mutações o PostgREST pode retornar 0 linhas sem erro: verifique o banco.
5. Faça o inverso (A contra B).
6. Teste link de recuperação, confirmação de email, logout, cookie vencido, acesso direto a `/app` sem login.
7. Revise políticas de SQL e logs no próprio Supabase.

## 7. Regras de dados e comunicação

A demonstração `/demo` usa `localStorage` e não transmite dados para o Supabase. A área `/app` usa consultas do projeto autenticado; se houver erro de rede ou de autorização, **mostra erro** e não simula sucesso remoto.

Evite enviar diagnósticos, medicamentos, fotos íntimas e dados sensíveis ao cadastro de teste. O projeto não implementa fluxos de consentimento LGPD completos, exclusão remota por usuário, armazenamento de fotos, backup do cliente, nem políticas de retenção.
