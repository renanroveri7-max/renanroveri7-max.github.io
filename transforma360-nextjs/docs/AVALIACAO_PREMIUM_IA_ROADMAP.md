# TRANSFORMA 360 — Produto pago: avaliação completa e ficha automática

## Visão de produto aprovada

Transforma 360 é um acompanhamento de exercícios acessível, centrado no usuário. O assinante responde a uma avaliação **uma vez**, recebe um programa pronto (exercícios, frequência, séries, repetições, descanso e dicas de execução) e pode concluir a sessão em um toque. Não é necessário registrar carga, série, repetição ou RPE para usar a ficha. O diário detalhado é uma função avançada **opcional**.

### Fluxo de onboarding

1. Corpo e contexto: idade, altura em cm, peso em kg, tempo de treino em meses, atividade diária e sono.
2. Metas e preferências: hipertrofia, redução de gordura, recomposição, condicionamento e consistência; regiões prioritárias, preferência por cardio e ritmo de progressão.
3. Disponibilidade: dias, duração, local (academia/casa/ar livre) e equipamentos.
4. Segurança e privacidade: triagem de aptidão, idade mínima, consentimento e transparência sobre dados.
5. Plano gerado, já preenchido, com quatro semanas e opção de reavaliação.

**Atenção:** peso, altura, idade e objetivo não permitem inferir uma carga segura em kg em nenhum exercício. Para uma carga numérica, o produto precisará usar registros anteriores ou uma calibração de esforço com orientação validada profissionalmente. Até lá, mostra uma indicação de intensidade autoajustável, e não pesos inventados.

## Implementação desta primeira entrega

- Migração retrocompatível: sql/004_premium_assessment.sql. Adiciona dez colunas à avaliação sem apagar registros existentes. RLS já existente continua ativa. Permite check-in com esforço 'nao_informado', evitando inventar feedback.
- Motor automático: src/lib/premium-planner.ts. Recebe avaliação completa, valida tipos e limites, cruza experiência com meses treinados, aplica regras por objetivo/tempo/equipamentos/prioridades, oferece opções de cardio quando cabíveis, e produz um plano versionado compatível com a persistência existente.
- Interface: src/components/PremiumAssessmentFields.tsx + TrainingPlanner.tsx. Captura dados físicos, rotinas e preferências com justificativas; ficha automaticamente gerada com exercícios/séries/repetições; registro detalhado de séries recolhido e opcional; conclusão de sessão sem pedir nota de esforço; links de evidência na ficha criada.
- Testes: scripts/test-premium-planner.mjs, rodando no CI com os testes anteriores. 75 combinações de objetivos, locais e frequência + validação de limites, recusa em caso de triagem impeditiva, preservação de carga não inferida e saída determinística.
- Layout: mantém dark premium e responsividade. Planos antigos ainda abrem sem exigir preenchimento retroativo.

## Referências científicas selecionadas

- American College of Sports Medicine — posição de 2026 (resumo científico): https://pubmed.ncbi.nlm.nih.gov/41843416/
- American College of Sports Medicine — divulgação da posição: https://acsm.org/science-spotlight-acsm-releases-new-position-stand-on-resistance-training/
- Organização Mundial da Saúde — recomendações de atividade física e fortalecimento muscular: https://www.who.int/initiatives/behealthy/physical-activity/
- ACSM — orientações sobre triagem pré-participação: https://journals.lww.com/acsm-msse/fulltext/2015/11000/updating_acsm_s_recommendations_for_exercise.28.aspx

**Estudos fornecem referências populacionais, não determinam isoladamente uma prescrição individual.** A aplicação precisa de revisão de um profissional de educação física habilitado e, quando indicado, encaminhamento clínico. O motor não deve inferir diagnósticos a partir de altura/peso.

## Arquitetura para IA de verdade (não implementada nesta entrega)

A integração futura deve ocorrer **somente no servidor Next.js**, mediante API externa com chave secreta no ambiente Vercel. O servidor checa autenticação, assinatura ativa e limites de uso; lê apenas os campos necessários e transmite dados de modo consentido, com minimização. A IA recebe contexto e uma base **curada/versionada** de estudos (RAG, se adequado) e devolve um JSON estruturado, não texto livre arbitrário. O JSON deve ser validado por schema, política de contraindicações/triagem, catálogo de exercícios aprovados, equipamento disponível, duração e volume adequado. Planos rejeitados não são publicados nem cobrados como geração bem-sucedida. Registrar versão do modelo, fonte, instruções, data e resultado para auditoria, mas evitar armazenar conteúdo sensível em logs.

Não fazer buscas aleatórias em toda a internet durante cada avaliação. A base científica deve ser revisada periodicamente e conter fontes oficiais e pesquisa de boa qualidade, com critérios para atualização. IA não substitui especialistas nem promete resultados.

O sistema atual é um **gerador automático determinístico baseado em regras e fontes científicas**, explicitamente identificado; não apresentar como IA generativa em produção.

## Lançamento pago — pendências

- Escolher integração de pagamento e ativar entitlement no servidor: gratuito, teste, assinatura ativa, expirado/cancelado. Proteger rota de geração e leituras premium com controles efetivos (não somente esconder botão).
- Selecionar modelo/provedor, definir preço por geração e limites por assinatura, configurar credencial secreta (nunca no navegador) e executar testes estruturados e revisão profissional.
- Revisão profissional de exercícios, progressão e adaptações; biblioteca de alternativas e demonstração visual aprovada.
- LGPD: dados corporais e de saúde, consentimento específico, política clara, retenção, exclusão e tratamento adequado de dados sensíveis.
- Concluir a correção do aviso Supabase Auth "Leaked Password Protection Disabled".
- Teste de interface real: avaliação completa, persistência, ficha automatizada, check-in em um toque, dados entre contas, mobile e exclusão. O código publicado e testes automatizados não equivalem a essa validação.

## Critérios de aceite do usuário

A conta de teste deve poder preencher idade, altura, peso, experiência e disponibilidade; salvar um plano pronto; ver e usar exercícios sem informar cargas; concluir com um toque sem RPE; atualizar F5 e preservar dados; reavaliar; garantir isolamento da segunda conta. Não alegar que modelos de IA de terceiros já estão ligados.
