# TRANSFORMA 360 — FASE 3.3.1 · HISTÓRICO DE SÉRIES E PROGRESSÃO CONSERVADORA

## O que mudou

A Fase 3.3.1 estende a área /app/plano. O usuário agora pode salvar, corrigir e excluir cada série individualmente, anotando repetições (ou minutos), carga opcional e esforço percebido RPE 1–10, com confirmação remota do Supabase. Histórico e comparações são separados por semana, sessão e exercício. A conclusão de uma sessão inteira continua independente do registro das séries.

## Progressão educativa e conservadora

- Sem histórico: aprender a técnica e registrar.
- Séries incompletas: consolidar execução antes de progredir.
- Esforço RPE não informado: não sugerir progressão.
- RPE máximo 8–10: não aumentar carga e priorizar recuperação.
- RPE máximo 7: manter.
- Somente com duas sessões completas anteriores e RPE máximo até 6 pode sugerir uma repetição adicional dentro da faixa já prevista e somente se a técnica continuar confortável. **Nunca aumenta carga automaticamente**.
- Só compara exercícios idênticos na mesma sessão e semanas anteriores.

Estas regras são heurísticas educativas; não substituem prescrição, avaliação ou acompanhamento por profissional habilitado.

## Supabase e segurança

Migração SQL aplicada: sql/003_training_set_history.sql (training_set_history_v1). Nova tabela public.training_set_logs com usuário, plano, semana, sessão, exercício, número de série, repetições ou duração, carga, RPE e data. Limites de dados, índice único por série, FK de dono do plano e trigger que confere exercício/índice/série contra o plano salvo. RLS ativa com SELECT/INSERT/UPDATE/DELETE por auth.uid(); nenhum acesso anon.

Testes SQL diretos passaram com duas identidades sintéticas: acesso cruzado bloqueado nas quatro operações, FK de outro usuário bloqueada, cinco entradas inválidas rejeitadas, dados de teste revertidos integralmente. Os dados existentes da Fase 3.2 e 3.3 não foram apagados.

Os testes JS de histórico, progressão e valores permitidos são executados por npm run test:training, junto com o motor anterior, no pipeline GitHub de typecheck e build.

## QA pendente com conta real

1. Acesse /app/plano, abra uma semana e registre uma série real; informe repetições ou duração, carga opcional e RPE, depois salve.
2. Atualize a página: a série deve permanecer. Edite e depois teste exclusão de apenas aquela série.
3. Registre séries em outra semana, abra o histórico e confira os totais reais sem misturar exercícios.
4. Valide a segunda conta: ela não deve enxergar as séries da primeira.
5. Confirme que o histórico manual de treinos da Fase 3.2 continua independente e que a exclusão intencional do plano exclui apenas os registros do novo módulo.

Antes da venda: revisão profissional dos conteúdos, LGPD e dados potencialmente sensíveis, política de privacidade e exclusão integral da conta, aviso auth_leaked_password_protection no Supabase, revisão SMTP/antiabuso e segurança pública do deploy.

**Sem prescrição clínica, aumento automático de pesos ou dados fictícios apresentados como progresso do usuário.**
