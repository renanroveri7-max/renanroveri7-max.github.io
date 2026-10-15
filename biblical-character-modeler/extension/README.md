# Biblical Character Modeler — Flow Bridge v0.5.0

Extensão experimental do Chrome. Não cria imagens, não inicia gerações e não contorna restrições de acesso do Google Flow.

## Novo teste: captura da prévia visível (não equivale ao original)

1. Em `chrome://extensions`, desative a versão antiga. Carregue **sem compactação** a pasta `extension` v0.5.0 (deve conter manifest.json).
2. No Biblical Character Modeler, atualize a página e entre na aba Google Flow.
3. Clique **TESTAR EXTENSÃO** e confirme a versão **0.5.0**.
4. Abra apenas uma guia do Flow, já dentro de um projeto e com a imagem desejada ampliada.
5. No Biblical Modeler, selecione o personagem e a fase corretos. Clique **TESTAR CAPTURA DA IMAGEM ABERTA (NÃO GERA)**.
6. Se o navegador permitir leitura da imagem no canvas, o nosso site mostrará a prévia **sem salvá-la**.
7. Se a imagem for de outro projeto/personagem, **DESCARTE**. Para salvar, verifique visualmente e clique **CONFIRMAR IDENTIDADE E SALVAR PRÉVIA**. O arquivo fica com status **PENDENTE DE AUDITORIA** em armazenamento IndexedDB.

## Restrições de segurança

- A captura só é tentada mediante clique e confirmação do usuário.
- A extensão não lê cookies, credenciais, URLs de mídia ou endpoints privados; não clica em Gerar.
- É utilizada apenas uma imagem visível e ampliada, não a galeria toda.
- O navegador pode bloquear canvas de imagem hospedada em outro domínio por CORS. Em caso de bloqueio, não haverá captura; **não há tentativa de contornar a proteção**.
- O arquivo é uma prévia JPEG da imagem renderizada, não garantidamente o original do Flow. O limite é 3 MB e resolução máxima 1920 pixels no lado maior.
- As imagens são gravadas somente após confirmação explícita do usuário, na identidade e fase selecionadas, e seguem pendentes de auditoria.
- Caso esse teste não consiga capturar a imagem, continue usando o botão nativo de download do Google Flow e a importação manual do nosso app enquanto verificamos opções de integração oficialmente suportadas.

### Atualização dos arquivos

Os arquivos `manifest.json`, `background.js`, `site-bridge.js` estão nesta mesma pasta. Para instalação sem compactação, eles devem permanecer juntos na mesma pasta.
