# TRANSFORMA 360 — FASE 3.3 · TREINOS PERSONALIZADOS

## Entrega inicial no projeto existente

Rota autenticada: **`/app/plano`**. O dashboard tem um atalho nas abas **Hoje** e **Treinos** quando a conta está no modo Supabase.

### Funcionalidades implementadas

- Avaliação com objetivo, experiência, local de treino, equipamentos, dias/semana e duração.
- Confirmação de maioridade e consentimento explícito antes de persistir os dados.
- Triagem leve, sem nomes de doenças ou medicamentos. Se o usuário tiver restrições, sintomas ou dúvidas sobre aptidão, o plano automático fica bloqueado.
- Motor **determinístico, explicável e versionado** (não IA generativa, não diagnóstico ou prescrição clínica).
- Microciclo inicial de **4 semanas**, de 1 a 5 sessões/semana, com exercícios adaptados ao local e equipamentos.
- Sessões com sugestões de séries, repetições, descanso e instruções resumidas de execução.
- Registro por semana de sessão concluída e percepção subjetiva simples de esforço.
- Progressão por repetição **somente sugerida** depois de sessões anteriores registradas como leves; **sem aumento automático de carga**.
- Reavaliação, criação de novo plano mantendo o histórico, exclusão deliberada da avaliação e de todos os planos/check-ins relacionados.
- Leitura e escrita reais pelo Supabase, verificando erros ao salvar.
- Layout responsivo mantendo a identidade visual dark-premium. `/demo` e registros manuais anteriores continuam independentes.

### Banco Supabase

Migração aplicada com êxito: `sql/002_training_personalization.sql`, nome `training_assessments_plans_checkins_v1`.

Tabelas:

1. `training_assessments`: avaliação mínima por conta, com consentimento.
2. `training_plans`: snapshots de planos por conta, versionados no JSON.
3. `training_checkins`: conclusão de sessão por plano/semana.

Segurança: RLS ativa, 4 políticas explícitas (SELECT, INSERT, UPDATE e DELETE) em cada tabela; acesso `anon` revogado; `user_id` com FK para `auth.users`. Um FK composto `(plan_id,user_id)` impede check-ins ligados ao plano de outro usuário.

### Validações efetuadas

- Migração SQL aplicada via conector Supabase: **`success:true`**.
- Teste direto no PostgreSQL usando dois usuários sintéticos A/B, `role authenticated` e `auth.uid()`: **APROVADO** para SELECT/UPDATE/DELETE e tentativas de inserção como outro usuário nas três tabelas, mais teste de FK composta entre donos. Transação revertida (`ROLLBACK`), sem manter dados sintéticos.
- Testes determinísticos de motor: `npm run test:training` cobre 75 combinações de local, frequência e duração; bloqueio por menoridade, pendência de orientação profissional, equipamento inválido e progressão por esforço.
- Pipeline de validação GitHub Actions: `typecheck`, `test:training`, `build`.
- **A ser validado por usuário real no navegador:** geração, persistência após F5, check-in, progressão e exclusão.

### Importantes limites de segurança

- O conteúdo **não substitui avaliação ou acompanhamento presencial/remoto de um profissional habilitado**. Ninguém deve usar o plano se houver contraindicação ou desconforto.
- As respostas de triagem podem ser dados de saúde; revisar bases legais LGPD, minimização, retenção, consentimento e operação de direitos antes de qualquer lançamento.
- Não foram implementados vídeos instrucionais certificados, ajuste clínico, detecção de lesões, recomendações de cargas, periodização individual por profissional, onboarding médico, dieta personalizada ou pagamentos.
- A aplicação ainda está sob proteção Vercel para visitantes não autorizados. Não desativar para público até concluir privacidade, testes de produto e revisão de segurança.
- Verificar pendência `auth_leaked_password_protection` do Supabase antes de lançamento.

### QA no navegador (sem diagnósticos nem dados pessoais sensíveis)

1. Entre em `https://renanroveri7-max-github-io.vercel.app/app` e clique **Criar ou abrir plano**.
2. Confirme 18+ e consentimento; escolha uma rotina realista. Teste primeiro a opção de pendência de orientação: o botão de gerar deve ficar bloqueado.
3. Troque para `Não conheço impedimento atual`, preencha os demais campos e gere o plano.
4. Confirme 4 semanas e sessões propostas; atualize com F5, abra de novo e confira persistência.
5. Marque uma sessão como **Leve**; atualize, confira check-in e experimente semana 2. Só depois de duas sessões leves comparáveis, a semana 3 pode sugerir uma repetição adicional.
6. Em outra conta, `/app/plano` deve começar sem plano, e não pode ver o plano da primeira.
7. Teste reavaliação e criação de novo plano sem apagar registros antigos; ao testar **Apagar avaliação e planos**, confirme que o plano some na conta e permaneça ausente após F5.
8. Dados em `/app` (perfil/treinos/refeições/água/peso) não podem ser afetados pela exclusão do novo módulo.

## Próximas evoluções

Revisão dos exercícios por educador físico credenciado, inclusão de registros por exercício/carga/RIR/RPE com validação, adequação de treinamento conforme adaptação individual, notificações e integração da programação ao histórico manual. Separar claramente conteúdo educativo do atendimento por profissionais.

## Teste real inicial da Fase 3.3 — verificado

- Usuário informou que concluiu o fluxo de avaliação e geração de plano na interface.
- Consulta independente ao Supabase confirmou **1 avaliação**, **1 plano** com `blueprint.version = 1` e número de sessões dentro dos limites previstos, e **4 check-ins** persistidos no banco.
- Integridade: plano vinculado a conta existente no Supabase Auth, e todos os quatro check-ins vinculados ao mesmo dono de seu plano.
- A conferência foi feita por contagens agregadas e não expôs conteúdo pessoal das respostas.
- Essa verificação confirma persistência na nuvem, mas não atesta se a pessoa executou fisicamente os treinos ou se exercícios e progressão foram revisados por profissional habilitado.
- Próximo QA: revisar separação entre conta A e B na interface da Fase 3.3, reavaliação, progressão após semanas distintas e exclusão segura; posteriormente revisão técnica das propostas por profissional de educação física.

## QA de isolamento entre duas contas reais — confirmado

- Usuário testou a rota `/app/plano` com uma segunda conta e confirmou que **não aparecem a avaliação, o plano nem as sessões da primeira conta**.
- Consulta agregada independente no Supabase: **2 contas**, das quais **1 possui plano** e **1 não possui dados de avaliação/plano/check-ins**. Total no momento da verificação: **1 avaliação, 1 plano e 4 check-ins**.
- Em conjunto com a auditoria RLS transacional anterior, essa é uma validação positiva da separação dos dados, mas não substitui pentest ou auditoria completa antes da comercialização.
- Pendência técnica observada: `auth_leaked_password_protection` (WARN) no Security Advisor do Supabase. Ativar proteção contra senhas comprometidas quando disponível e revisar exigências legais de dados de saúde/LGPD.
