# Verificações da entrega

## Auditoria de conteúdo e imagens — 06/10/2026

- Comparação dos 14 módulos, notebook, caderno e PDF original, com revisão independente de conteúdo. Registro: [Auditoria de conteúdo](AUDITORIA_CONTEUDO_AULA01.md).
- Objetivos, aprofundamento, prática e conferência adicionados; referências e complementos identificados. Caderno de 15 páginas sincronizado e renderizado para inspeção visual.
- As 56 células de código do notebook passaram em ambiente novo (Pandas 3.0.1). Transcrições, filtros, médias, correlações, rankings e CSV conferidos; simulações preservam os registros originais.
- TypeScript, build de produção e 25 testes aprovados. HTML portátil: 22 imagens incorporadas, nenhuma referência externa às artes e sintaxe aprovada.
- Aulas 02/03 verificadas no navegador: imagem inteira, sem zoom, prática com resposta recolhida/expandida e ampliador da figura original. Aula 02 em 390×844 sem rolagem horizontal da página; imagem em 304×170,125 px com `contain`.
- Imagem de desktop passou de `cover` em 188×118 para `contain` em 238×133 px no viewport usado. A figura original conserva ampliação própria. Capturas em `output/auditoria-conteudo/`.
- Nenhuma chamada faturável de áudio foi feita nesta auditoria. Narração corresponde ao resumo; código e prática continuam sendo atividades de estudo.
- Servidor local reiniciado para carregar os resumos revisados; tela de entrada confirmada. O reinício encerra sessões em memória; contas, notas, progresso e configuração privada continuam persistentes. A leitura da narração foi conferida sem chamada aos provedores.

Para regenerar materiais: execute `python scripts/build-study-materials.py` em ambiente com ReportLab. Para verificar o notebook: `python scripts/verify-study-materials.py` em ambiente com Pandas.

## Conexão com Gemini — 05/10/2026

- Falha reproduzida: Node.js no ambiente restrito da ferramenta retornava `fetch failed`, com causa `EACCES`, antes de receber uma resposta HTTP do Google.
- Teste HTTPS sem credenciais fora do ambiente restrito: conexão estabelecida (HTTP 403 esperado sem chave).
- Servidor anterior encerrado e reiniciado com acesso à rede autorizado, preservando a chave Gemini salva.
- Teste real de geração: módulo 01, trecho 1, voz Aoede e modelo `gemini-3.8-flash-tts`; HTTP 200, `audio/wav`, arquivo WAV válido de 1.561.264 bytes.
- Interface: botão Play gerou áudio real, o player entrou em **Reproduzindo**, mostrou posição e download; pausa verificada. A chave não foi exibida nem alterada.
- Erros de conexão agora retornam HTTP 502 com orientação sobre rede/iniciador local. Cancelamento e timeout continuam separados de erro de credencial ou quota.
- 16 testes automatizados aprovados, incluindo o tratamento de bloqueio de rede, ausência de segredos nas mensagens e resposta HTTP 502.
- Amostra do teste em `output/audio/Aula01_Teste_Gemini.wav`; captura da reprodução em `output/audio/Gemini_Reproducao.png`.

## Correção da persistência de API — 04/10/2026

- Build TypeScript, produção e versão portátil: aprovados.
- 13 testes automatizados: aprovados, usando chaves fictícias e respostas de voz simuladas.
- Persistência após reiniciar o servidor, geração sem chave no pedido, exclusão persistente, separação entre provedores e prioridade do ambiente: verificadas.
- Gravações simultâneas preservam os dois provedores; falha de gravação não informa sucesso nem altera a configuração em memória.
- Rotas de configuração recusam origem externa/ausente, corpo inválido e métodos não suportados; a configuração privada não é servida como arquivo público.
- Interface no navegador: salvar chave fictícia, campo limpo após salvar, sair e voltar à tela, recarregar e remover chave salva: conferidos.
- Chave fictícia removida ao terminar. Nenhuma chave real foi configurada e nenhuma chamada faturável foi realizada.
- A pasta `.local` está fora do build e ignorada no Git. A persistência é local em arquivo não criptografado; não é sincronização em nuvem.

## Validação do pacote original

Validação em 03/10/2026.

- TypeScript e build de produção: aprovados.
- Cinco testes do adaptador de áudio: aprovados (sem credenciais reais).
- Interface Chromium em 1440×1080 e 390×844: inspecionada.
- Navegação, filtro de módulos, abertura de aula, resposta comentada e marcação de compreensão: conferidos.
- KDD: troca de etapas e conteúdo: conferidos.
- Laboratórios: alternância de medida, ranking por eficiência e filtro: conferidos.
- Caderno: edição e persistência no navegador: conferidas.
- Chave de teste ausente do localStorage: conferida.
- Mensagem para chave inválida: conferida com resposta simulada.
- Player de API: resposta WAV simulada, reprodução, pausa, parada e remoção de chave: conferidos.
- Versão portátil ABRIR.html: abriu via file:// sem erro de JavaScript.
- Sem rolagem horizontal da aplicação em 390 px nas telas verificadas. Tabelas podem rolar dentro do seu próprio painel.

Limites: não houve chamada autenticada aos provedores. A qualidade da voz do navegador depende do sistema do usuário; a geração real de OpenAI/Gemini precisa ser validada com uma chave e acesso ao modelo. O texto destaca trechos, não palavras sincronizadas. Navegadores e sistemas além dos verificados podem ter diferenças em áudio, fontes e armazenamento.
# Identidade visual do curso — 06/10/2026

Build e 25 testes passaram após a integração das imagens. Conferência visual de capas, início, login/cadastro, áudio, temas claro/escuro e aula com ampliador. Layout de início/aula verificado em 390 px; Escape e retorno de foco verificados. Registro detalhado: [Direção visual do curso](DIRECAO_VISUAL_CURSO.md). O HTML portátil recebeu verificação estática de incorporação e sintaxe; a ferramenta de navegador não permite abrir `file:`.
