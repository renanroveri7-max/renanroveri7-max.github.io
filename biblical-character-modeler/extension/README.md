# Biblical Character Modeler — Google Flow Bridge v0.2.0

## Objetivo desta prova de conceito

Testar uma conexão local entre o Biblical Character Modeler e uma guia já aberta do Google Flow na sua conta Google.

Nesta versão, os botões disponíveis no aplicativo são:
- **TESTAR EXTENSÃO**: confirma a presença da extensão 0.2.0.
- **DETECTAR FLOW**: verifica se existe uma guia do Flow.
- **ABRIR / FOCAR FLOW**: abre uma guia ou foca uma existente.
- **INSPECIONAR FLOW**: verifica a disponibilidade de elementos.
- **MAPEAR COMPOSITOR**: somente leitura; classifica metadados dos campos editáveis, posição relativa na tela e contagem de botões na região inferior.

As informações são lidas localmente na guia via API `chrome.scripting.executeScript`. O código **não extrai valores de campos, prompts digitados, URL de projetos, cookies, credenciais, imagens nem conteúdos da conta**.

## Como atualizar a extensão já instalada

1. Extraia o ZIP novo em uma pasta diferente da versão antiga.
2. Abra `chrome://extensions`.
3. Desative/remova a extensão Flow Bridge v0.1.0, para não haver duas pontes recebendo mensagens.
4. Ative **Modo do desenvolvedor**, se necessário.
5. Clique **Carregar sem compactação** e selecione a pasta que contém o arquivo `manifest.json` da nova versão.
6. Atualize nosso aplicativo com Ctrl + F5.
7. Deixe **uma única guia** do Google Flow aberta, já dentro de um projeto. Nenhuma geração deve ser iniciada neste teste.
8. Na aba **Google Flow** do nosso site, clique em **TESTAR EXTENSÃO**, depois **MAPEAR COMPOSITOR**.
9. Envie um print dos resultados, sem digitar dados sensíveis na interface do Flow.

## Escopo e limitações

A extensão não gera imagens, não cria projetos, não submete prompts, não recupera mídia automaticamente e não promete usar os créditos de assinatura Ultra por API. Não utiliza endpoints privados ou engenharia reversa de autenticação. O mapeamento apenas indica onde estão os controles acessíveis via DOM, como próxima evidência técnica.

Se o Google modificar a interface, a detecção visual poderá mudar; esta versão nunca aciona botões de geração.
