# Biblical Modeler — Google Flow Bridge v0.3.0

Extensão experimental para testar a comunicação entre o Biblical Character Modeler e uma guia aberta do Google Flow na sua sessão normal do Chrome.

## Atualização da extensão

1. Baixe e extraia o ZIP 0.3.0 para uma pasta permanente.
2. Em `chrome://extensions`, desative ou remova a Flow Bridge anterior.
3. Ative o Modo do desenvolvedor e clique em **Carregar sem compactação**.
4. Selecione a pasta que contém `manifest.json` da versão 0.3.0.
5. Atualize o Biblical Modeler com Ctrl + F5; na aba **Google Flow**, clique em **TESTAR EXTENSÃO**. O painel deve responder versão 0.3.0.

## Prova de envio direto do prompt (não gera imagens)

1. Abra um único projeto em `flow.google.com` e deixe vazio o campo inferior do compositor de imagens.
2. Selecione **Jeremias — Jovem (JER-001)** no catálogo do Biblical Modeler.
3. Clique **TESTAR ENVIO DIRETO DO PROMPT (NÃO GERA)** e confirme a ação.
4. Verifique visualmente se o texto completo apareceu no campo de criação do Flow. Não clique em Gerar nesta etapa.

A extensão identifica **um único** editor contenteditable visível na região inferior-central. Ela recusa sobrescrever campos com conteúdo, limita o texto a 35 mil caracteres e utiliza somente um comando de inserção de texto do navegador. Não lê cookies, tokens, senhas, URLs privadas, imagens ou conteúdo anterior ao teste; **não clica em Gerar**, não consome créditos e não utiliza APIs privadas. Se o campo não estiver no formato esperado, o teste falhará sem tentar o envio.

**Limite:** o preenchimento do campo não comprova que uma geração automatizada usando os créditos Ultra ou o retorno automático de imagens são suportados. O teste precisa ser validado no navegador do usuário.
