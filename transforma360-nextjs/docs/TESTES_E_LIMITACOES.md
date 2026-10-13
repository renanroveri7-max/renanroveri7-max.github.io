# Relatório honesto — Fase 3.1

## O que pôde ser verificado no ambiente de criação

- [x] Arquivos Next.js App Router, TypeScript e estilos criados.
- [x] Sintaxe transpilada de todos os arquivos `.ts`/`.tsx` sem erros de sintaxe com TypeScript 5.8.3 instalado no ambiente.
- [x] SQL preparado com RLS por usuário para cinco tabelas e políticas separadas para quatro operações.
- [x] Projeto original Fase 2.2 preservado no ZIP como HTML utilizável sem dependências.
- [x] Estrutura do código separa `demo` (storage local) de `cloud` (Supabase).
- [x] Proteção de rota planejada no código via `auth.getClaims()` no servidor; refresh por Proxy do Next 16.
- [x] Nenhuma chave secreta ou credencial do usuário foi incluída.

## O que NÃO pôde ser executado aqui

- [ ] `npm install` — registro `registry.npmjs.org` inacessível neste ambiente (`EAI_AGAIN`).
- [ ] `npm run build` e `npm run dev` na versão Next.js nova — bibliotecas não instaladas.
- [ ] Teste real de UI Next.js no browser — depende do processo acima.
- [ ] Cadastro, login, recuperação, consulta e sincronização ao vivo — faltam projeto e credenciais do Supabase.
- [ ] Testes multiusuário das políticas RLS — exigem Supabase com pelo menos duas contas.
- [ ] Validação em Android/iOS — ainda não feita.

## Checklist obrigatório depois do `npm install`

1. `npm run typecheck` e `npm run build`: corrigir eventuais diferenças de versão das dependências.
2. `npm run dev`: abrir `/`, `/demo`, `/entrar`, `/app` e `/redefinir`.
3. Sem Supabase: `/entrar` deve informar ausência de configuração; `/demo` precisa permitir registros que persistem após refresh.
4. Com Supabase: efetuar cadastro, confirmar email, login, reset de senha, logout e acesso protegido.
5. Registros cloud precisam aparecer após recarregar navegador e em outros dispositivos do mesmo usuário.
6. Sem rede: modo cloud deve mostrar falha e não atualizar registro como se tivesse sido salvo.
7. Verificar isolamento de dados via políticas com usuário A e usuário B.
8. Verificar responsividade sem rolagem horizontal e foco por teclado.

## Funcionalidades futuras, não entregues

Questionário completo migrado, triagem clínica, prescrições de treino/alimentação validadas, vídeos de exercícios, fotografia de evolução, pagamentos Pix/cartão, controle de assinatura, IA personalizada, painel administrador, backup e exclusão remota de conta.
