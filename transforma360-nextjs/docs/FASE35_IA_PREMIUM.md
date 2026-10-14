# TRANSFORMA 360 — Fase 3.5: integração real de IA (beta protegida)

## Estado verificável

- Backend implementado na rota `GET/POST /api/ai/training-plan`, com `OPENAI_API_KEY` **somente no servidor** e modelo padrão `gpt-4.1-mini` (permitido também `gpt-4o-mini`).
- A rota recebe os dados persistidos no Supabase após autenticação. Não aceita dados de avaliação arbitrários no corpo do POST.
- Solicita consentimento explícito, registra `ai_provider_consent_at` e envia apenas os campos de avaliação necessários ao provedor. Não envia nome, email, ID do usuário ou histórico de mensagens.
- Chamada real à OpenAI Responses API com `store:false`, limite de tokens, timeout e saída com JSON Schema `strict:true`.
- O modelo só pode **reordenar exercícios de um plano predefinido e escrever explicações breves**. O sistema rejeita novos exercícios, repetições/cargas alteradas, dias extras, duplicidades e falhas de esquema. Não diagnostica nem prescreve kg.
- Só salva plano após validação e confirmação do Supabase; não substitui plano antigo quando há falha.
- Separação: `model_guided_v1` para plano realmente processado pelo modelo; `evidence_rules_v1` para versão local sem IA.
- UI `AiPlanCard`: consulta disponibilidade, pede consentimento específico, gera com IA **apenas** com acesso real. A alternativa baseada em regras permanece identificada claramente.

## Banco e privacidade

- Migração `sql/005_ai_entitlements.sql` aplicada: `ai_entitlements`, `ai_generation_attempts`, `training_assessments.ai_provider_consent_at`.
- Entitlement por usuário: `trial`, `active` ou `inactive`, validade opcional e cota diária de 1–10 chamadas. Padrão 2.
- RLS ativa; usuário autenticado pode ler só seu entitlement e suas tentativas. **Não pode ativar sua própria assinatura nem criar tentativas livremente.**
- RPC `claim_training_ai_attempt()` é `SECURITY DEFINER` com `auth.uid()`, checagem do entitlement, lock por usuário e cota diária atômica.
- Limitação beta: a cota reserva a tentativa antes da chamada e a tentativa conta mesmo se a API externa falhar. Para a versão comercial, adotar job com estados e reconciliação segura no backend.
- A API não registra prompt, texto bruto da IA nem dados corporais nos logs.
- O status só libera `ready` quando a chave está no servidor e a conta tem entitlement ativo dentro da validade e da cota.

## Como ativar o provedor (depende do proprietário do projeto)

1. Criar/abrir conta em https://platform.openai.com/api-keys e configurar faturamento API separado da assinatura ChatGPT. Criar uma API key com permissões suficientes.
2. Na Vercel: projeto `renanroveri7-max-github-io` > Settings > Environment Variables > adicionar `OPENAI_API_KEY`, com valor marcado como secreto/sensitive para Production (e Preview se necessário). **Jamais enviar chave neste chat, GitHub ou `NEXT_PUBLIC_*`.**
3. Opcional: `OPENAI_TRAINING_MODEL=gpt-4.1-mini` (alternativa permitida: `gpt-4o-mini`). Redeployar Production para incorporar o segredo.
4. Liberar uma **conta de teste identificada pelo proprietário**, por meio de operação administrativa segura no SQL Editor do Supabase (nunca a partir do navegador):

```sql
insert into public.ai_entitlements(user_id,status,expires_at,daily_limit)
select id,'trial',now()+interval '7 days',2 from auth.users
where email = 'EMAIL_DE_TESTE_ESCOLHIDO';
```

5. Acessar `/app/plano`, responder à avaliação, marcar consentimento com envio ao provedor, clicar `Verificar acesso` e depois `Criar com IA`.
6. Verificar que a nova ficha traz `personalization.method = model_guided_v1` somente após uma chamada real bem-sucedida e que uma segunda conta sem entitlement recebe HTTP 402.

## Testes e restrições de segurança

- Teste SQL transacional com dois usuários sintéticos e rollback: bloqueia leitura/escrita entre contas, impede autoativação da assinatura e valida 2 reservas seguidas de bloqueio da terceira tentativa.
- `scripts/test-ai-plan.mjs`: tenta injetar exercícios inexistentes, séries faltando, IDs repetidos, índices trocados e explicações inválidas, além de validar preservação de volume, repetições e descanso.
- O pipeline da CI executa `typecheck`, `test:training` (incluindo testes do motor IA) e `build`.
- Sem credencial real e sem entitlement ativo, **não é possível declarar teste ponta a ponta com a API externa como concluído**.

## Evidências cientificamente curadas (não há busca em tempo real)

- ACSM 2026, revisão de revisões em adultos saudáveis: https://pubmed.ncbi.nlm.nih.gov/41843416/
- OMS, atividade física e força para adultos: https://www.who.int/initiatives/behealthy/physical-activity/
- As fontes são passadas como **princípios resumidos** no prompt e o catálogo no servidor limita a saída. Não há navegação aleatória pela internet nem garantia de prescrição individual baseada exclusivamente em artigos.

## Pendências antes de vender

- Integração de pagamento com webhook assinado que concede/revoga o entitlement; não há cobrança implementada.
- Auditoria LGPD para uso de dados corporais potencialmente sensíveis e transferência a operador externo; consentimento, retenção, direitos e exclusão.
- Revisão de biblioteca de exercícios e regras por profissional habilitado; testes com pessoas reais e acessibilidade.
- Tratamento de tentativas falhas com reconciliação de cota, antiabuso extra, monitoramento de gastos/tokens e limites de uso por plano.
- Resolver aviso do Supabase `auth_leaked_password_protection`, testar a API OpenAI de verdade e medir custo/latência.

## Critérios de aceite da próxima QA

- Status sem chave mostra `provider_not_configured` e não chama modelo.
- Status sem assinatura mostra `subscription_required` mesmo com API conectada.
- Consentimento desmarcado bloqueia botão e POST sem autorização retorna 400.
- Com chave e entitlement, uma geração real resulta em plano salvo, sem kg inventado, e uma nova leitura após F5 recupera mesmo `model_guided_v1`.
- Ultrapassar a cota diária retorna 429; a conta B não pode gerar nem visualizar dados da conta A.