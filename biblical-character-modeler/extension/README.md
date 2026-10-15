# Biblical Character Modeler — Flow Bridge v0.4.0

Extensão experimental Chrome Manifest V3. Funciona apenas no domínio do Biblical Character Modeler, em comunicação com uma guia já aberta do Google Flow.

## Atualização

1. Extraia o ZIP 0.4.0 para uma pasta permanente.
2. Vá a `chrome://extensions`, remova/desative a versão antiga e ative **Modo do desenvolvedor**.
3. Clique **Carregar sem compactação**, apontando para a pasta que contém `manifest.json`.
4. No Biblical Character Modeler, pressione **Ctrl+F5**. Entre na aba Google Flow e clique **TESTAR EXTENSÃO**; deve aparecer 0.4.0.

## Diagnóstico sem consumir créditos

1. Abra **uma única guia** do Google Flow, dentro do seu projeto.
2. No nosso aplicativo, clique **MAPEAR IMAGENS**. Anote a quantidade inicial de mídias grandes detectadas.
3. Para uma comparação posterior, depois de criar uma imagem no Flow **por sua própria escolha**, retorne ao site e clique novamente em **MAPEAR IMAGENS** (com o resultado visível na guia Flow).
4. O painel compara as contagens. Caso permaneçam idênticas, isso **não prova** falta de resultados, pois o Flow pode exibir imagens por outros mecanismos ou fora da área visível.

**A extensão não clica em Gerar, não usa créditos, não lê conteúdos de prompts, não devolve fotos, não acessa cookies/tokens e não chama endpoints internos.** Os resultados são apenas quantidade, posição, dimensão e classe de origem (https/blob/data) de elementos renderizados. URLs das imagens nunca são transmitidas. Não representa integração completa nem confirma viabilidade de recuperação de mídia original.

O envio direto de prompt da versão 0.3.0 continua disponível: ele exige confirmação e campo vazio, e não inicia geração.
