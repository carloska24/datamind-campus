# Arquitetura

React + TypeScript + Vite. Componentes de UI, ilustrações SVG e ícones Lucide. CSS próprio com regras de responsividade. Conteúdo local em JSON. O servidor oferece login, cadastro aberto, administração de contas e estudo persistido por usuário em arquivo privado. A versão portátil conserva estudo individual. Veja [Contas de alunos](ETAPA_2_CONTAS.md) para decisões e limites.

Servidor Node.js com módulos nativos; sem dependências para iniciar a versão já compilada. Bind exclusivo em 127.0.0.1, validação de Host e Origin, limite de corpo, máximo de duas gerações simultâneas, timeout de 90 segundos, cancelamento de requisição encerrada e endpoints fixos dos provedores.

## Audio

A tela faz POST `/api/tts` com provedor, módulo, trecho e voz, em sessão autenticada. O servidor usa a chave configurada no ambiente (`OPENAI_API_KEY`, `GEMINI_API_KEY` ou `GOOGLE_API_KEY`) ou, em seguida, a chave salva em `.local/api-keys.json`. Chaves temporárias enviadas com o pedido de áudio não são usadas. O `.env` da raiz é carregado ao iniciar, sem substituir variáveis já definidas no processo.

POST `/api/credentials` salva ou substitui uma chave; DELETE `/api/credentials` remove a configuração local do provedor. Ambas as rotas exigem sessão de administrador, origem local autorizada e corpo JSON. O arquivo é atualizado por gravação temporária e renomeação, com operações serializadas. As permissões de arquivo são restritas nos sistemas que suportam os modos POSIX. A configuração não é criptografada e depende das permissões locais do usuário; `.local` é ignorada no Git e não entra em `dist`.

GET `/api/health` informa apenas se cada provedor está configurado e a origem da configuração, sem devolver chaves. A tela reconhece a configuração ao abrir e guarda somente a preferência de provedor no navegador. A chave digitada é apagada do campo após salvar ou trocar de provedor. A interface não modifica variáveis de ambiente.

O servidor escolhe o texto da base local, faz a chamada HTTPS ao serviço e devolve bytes de áudio. Não persiste áudio nem expõe erro bruto do provedor. A cache de áudio está em memória no navegador e é limpa ao trocar configuração ou sair da tela.

OpenAI: POST https://api.openai.com/v1/audio/speech, modelo `gpt-4o-mini-tts`, resposta MP3.
Gemini: POST https://generativelanguage.googleapis.com/v1beta/interactions, modelo padrão `gemini-3.8-flash-tts`, resposta de áudio em steps/content; mantém WAV ou encapsula PCM em WAV 24 kHz, mono, 16 bits.

Cada módulo tem quatro trechos. A reprodução evidencia o trecho em execução, não timestamps de palavras. Velocidade local e download de trecho gerado. Voz do navegador usa Web Speech API e `pt-BR`, com fallback para voz portuguesa disponível. Se não houver voz, informa a limitação. O navegador/OS pode implementar voz local ou online; este projeto não pode garantir operação offline de todos os sintetizadores.

## Fontes técnicas

- React: https://react.dev/learn
- Vite: https://vite.dev/guide/
- Pandas: https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html
- OpenAI: https://developers.openai.com/api/docs/guides/text-to-speech
- Gemini: https://ai.google.dev/gemini-api/docs/speech-generation

Consulta em 03/10/2026. O acesso real aos serviços depende da conta do usuário.
