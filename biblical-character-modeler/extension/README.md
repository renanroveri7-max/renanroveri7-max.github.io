# Biblical Character Modeler — Google Flow Bridge (PoC v0.1.0)

## Escopo comprovável
Extensão Chrome Manifest V3 que faz a comunicação entre o site https://renanroveri.com.br/biblical-character-modeler/ e uma aba aberta em https://flow.google.com/.

A extensão permite:
- verificar se a extensão está instalada e responde;
- detectar uma guia aberta no Google Flow;
- abrir/focar uma guia do Flow;
- realizar uma inspeção **estrutural e somente leitura** da guia Flow (número de elementos de imagem, canvas e campos editáveis).

**Não** autentica no Google, não cria projetos, não gera imagens, não baixa imagens e não sincroniza resultados. O acesso à geração via assinatura Ultra e qualquer importação automática ainda dependem de validação técnica e das regras do Google.

## Instalação local para teste
1. Extraia o ZIP da extensão para uma pasta permanente no computador (não mova os arquivos durante o teste).
2. Abra chrome://extensions no Google Chrome (ou edge://extensions no Microsoft Edge).
3. Ative **Modo do desenvolvedor**.
4. Clique **Carregar sem compactação** e escolha a pasta contendo este manifest.json.
5. Abra o Biblical Character Modeler, atualize Ctrl + F5 e vá à aba **Google Flow**.
6. Clique **TESTAR EXTENSÃO**, depois **DETECTAR FLOW** e **INSPECIONAR FLOW** com o Flow aberto e autenticado na sua própria guia.

### Segurança
A extensão solicita acesso apenas ao domínio flow.google.com e só recebe mensagens originadas do domínio exato do nosso site. Não lê cookies, tokens, senhas, requisições de rede ou conteúdo das imagens. Não realiza ações que consumam créditos.

### Limitações do teste
As contagens de elementos DOM são indícios de acesso estrutural. NÃO são prova de acesso às imagens geradas e tampouco demonstram capacidade de acionar a geração. Não há API pública documentada do Flow que reutilize automaticamente a assinatura Ultra em um site terceiro.
