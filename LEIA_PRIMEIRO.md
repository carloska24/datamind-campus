# DataMind — Aula 01

Um campus de estudo visual e narrado da aula de Data Science e Big Data na Indústria, com contas individuais de alunos e administração local.

## Campus com login

Execute `INICIAR_WINDOWS.bat` ou `npm start` e abra http://127.0.0.1:4173. No primeiro acesso, crie seu administrador em **Configure seu campus**, com senha de pelo menos 12 caracteres. Depois, os alunos podem usar **Criar conta** (cadastro aberto) e **Entrar**. O avatar abre a conta; o administrador acompanha alunos e progresso, desativa/reativa acessos e gera links de recuperação. Cada aluno tem caderno e progresso próprios, salvos no servidor.

Este endereço funciona somente no computador do servidor. Para acesso pela internet, o projeto possui configuração de serviço pago e disco persistente no Render. Veja [Publicação no Render](docs/PUBLICACAO_RENDER.md) e [Contas, validação e limites](docs/ETAPA_2_CONTAS.md), que documenta a etapa local original.

## Abrir imediatamente

1. Extraia todo o ZIP para uma pasta no seu computador. Não abra dentro do ZIP.
2. Entre na pasta `aula01-studio/dist`.
3. Abra `ABRIR.html` no Chrome ou Edge.

Esta versão contém a aplicação React compilada e funciona sem instalar dependências. Os desenhos, ícones e conteúdo estão incorporados. Mantenha a pasta `materiais` ao lado do arquivo para abrir PDFs e notebook. A narração usa as vozes do navegador/sistema, quando disponíveis.

## Usar narração da OpenAI ou Gemini

1. Instale Node.js **22.12 ou mais recente**: https://nodejs.org/
2. No Windows, execute `INICIAR_WINDOWS.bat` na raiz do projeto. No macOS/Linux, execute `./INICIAR_MAC_LINUX.sh`.
3. Mantenha a janela do terminal aberta e acesse http://127.0.0.1:4173 no Chrome ou Edge.
4. Entre com sua conta de administrador e abra **Ouvir as aulas**.
5. Escolha OpenAI ou Google Gemini, cole a chave no campo protegido e clique em **Salvar chave neste computador**. Isso só precisa ser feito uma vez para cada provedor.
6. Escolha um módulo, trecho e voz. Clique em reproduzir para gerar o trecho. Nas próximas aberturas, a chave salva já estará disponível.

O servidor usa somente módulos e textos do material, não oferece leitura arbitrária de arquivos. As chaves salvas ficam em `.local/api-keys.json`, fora de `dist`, do navegador e das exportações do caderno. Essa configuração persiste ao sair da tela, recarregar a página ou reiniciar o servidor. A interface recebe apenas o status da configuração; a chave é enviada pelo servidor ao provedor via HTTPS ao gerar áudio. Não é registrada em logs. Para excluir, clique em **Remover chave salva**. Cada provedor tem sua própria chave.

A configuração é um arquivo local não criptografado. Não inclua `.local` ao compartilhar o projeto; a pasta está no `.gitignore`. A versão portátil `dist/ABRIR.html` continua usando voz do navegador: para reutilizar chaves e gerar áudio por API, abra pelo iniciador local.

### Alternativa: configuração no servidor

Você também pode criar um arquivo `.env` na raiz do projeto (veja `.env.example`) com `OPENAI_API_KEY` e/ou `GEMINI_API_KEY`. O servidor carrega esse arquivo ao iniciar. Variáveis do ambiente têm prioridade sobre chaves salvas na interface; nesse caso, a tela informa que a chave já está configurada e a alteração deve ser feita no ambiente ou `.env`, seguida de reinício do servidor. Essas chaves não usam o prefixo `VITE_`, para não serem incluídas no código público.

Salve a chave antes de reproduzir. Alunos usam a configuração do administrador; não podem salvar, substituir ou remover chaves.

A voz é sintética, gerada por IA. A geração por API pode ter cobrança própria, quota e restrição de acesso ao modelo. Não há áudio de API pré-gerado no pacote. O serviço envia ao provedor somente o roteiro do trecho selecionado. Cada trecho é gerado quando você solicita; não há geração automática da aula inteira. A opção de continuação gera o trecho seguinte ao finalizar o atual. Áudios já gerados são reaproveitados em memória durante a tela atual. É possível baixar o trecho gerado como MP3 (OpenAI) ou WAV (Gemini).

### Controles

- Play/pausa e parar.
- Trecho anterior e próximo.
- Velocidade: 0,75×, 1×, 1,25×, 1,5×.
- Na voz do navegador, reinicie o trecho para aplicar uma nova velocidade.
- Na API, o controle de velocidade e a posição de reprodução atuam no áudio recebido.
- O roteiro é dividido em 4 partes: conceito, prática, pergunta, resposta. A tela acompanha o trecho atual, sem sincronização palavra por palavra.
- “Pare e pense” foi desenhado para você pausar antes de ouvir a resposta.

### Modelo de voz

OpenAI: `gpt-4o-mini-tts`, endpoint `/v1/audio/speech`.
Gemini: padrão `gemini-3.8-flash-tts`, endpoint Interactions (`/v1beta/interactions`). O campo permite alterar para outro modelo TTS compatível com esse endpoint, conforme acesso da sua conta. Não use um modelo de chat comum. A compatibilidade de modelos mais antigos com `generateContent` não está implementada nesta versão.

Integrações construídas com base na documentação consultada em 03/10/2026. Foram verificadas com testes simulados; geração real exige uma chave e conta autorizada do usuário. Nenhuma chamada faturável foi utilizada para validar este pacote.

### Falha de conexão ao reproduzir

Se a chave está salva, mas aparece uma mensagem de conexão bloqueada (ou `fetch failed` em versões anteriores), feche o servidor atual e reabra pelo `INICIAR_WINDOWS.bat` ou `INICIAR_MAC_LINUX.sh`. Um servidor iniciado dentro de um ambiente restrito de ferramenta de desenvolvimento pode aceitar a página local e, ao mesmo tempo, não ter permissão para conectar à API externa. Não é necessário salvar a chave novamente. Se a falha persistir, confira internet, proxy e firewall. Erros de quota, modelo e permissão da chave são informados separadamente.

## O que você encontra

As atividades têm endereço próprio. Aulas, trechos de áudio, etapas do KDD, laboratórios e cartões permanecem selecionados ao recarregar. Você pode copiar a URL da atividade; ao compartilhá-la, o destinatário precisa ter acesso ao mesmo campus. O servidor `127.0.0.1` continua acessível somente no computador em que foi iniciado.

No início, **De onde você parou** retoma a última atividade da sua conta (ou deste navegador no modo portátil). **Próximo módulo recomendado** indica o primeiro módulo ainda não marcado como compreendido. A retomada de áudio abre o trecho salvo e aguarda seu comando. Ao concluir a trilha, o campus direciona à revisão. Veja [Etapa 1](docs/ETAPA_1_AUDITORIA.md) e [Etapa 2](docs/ETAPA_2_CONTAS.md).

- Painel inicial com arte de equipamentos industriais e identidade visual baseada no curso.
- Trilha de 14 módulos, busca e filtros.
- Aulas com figuras originais do PDF, página e fonte, ampliação, conceito, exemplo industrial, pergunta e código.
- Cinco etapas do KDD clicáveis, com exemplos e armadilhas.
- Laboratório temperatura/defeitos: dispersão interativa, contagem versus taxa, destaque por produto e filtro de temperatura.
- Laboratório produção/energia: ranking e gabarito das sete perguntas.
- Narração em português, com vozes locais e adaptadores de API.
- 14 cartões de revisão.
- Caderno com exportação e importação JSON; aceita cópias do primeiro HTML.
- PDF original, caderno de estudo e notebook Python na pasta `materiais`.

## Guardar seus estudos

Com login, caderno, progresso e última atividade ficam na conta, no servidor. No portátil, ficam neste navegador quando permitido. Use **Meu caderno → Exportar caderno** para preservar uma cópia ou importar na outra versão. Chaves de API ficam fora da exportação. Faça backup privado de `.local` para preservar as contas, estudos e configurações do servidor; não compartilhe essa pasta. O estudo da versão anterior não é atribuído automaticamente às novas contas.

## Desenvolvimento no Cursor ou Antigravity

Abra a pasta raiz `aula01-studio` no editor. No terminal:

```bash
npm ci
npm run dev
```

Para reconstruir a versão pronta:

```bash
npm run build
npm test
```

Para desenvolvimento com API, mantenha `npm start` em outro terminal. O Vite encaminha `/api` ao servidor local na porta 4173.

A versão compilada acompanha o pacote. Para apenas estudar com o servidor local, Node.js é suficiente; não é necessário instalar os pacotes de desenvolvimento.

## Organização

- `src/App.tsx`: navegação e telas de estudo.
- `src/components/Illustrations.tsx`: capas raster, arte industrial e ampliador das figuras do curso.
- `public/course-art`: artes geradas e figuras originais extraídas do PDF.
- `src/components/Charts.tsx`: gráficos e cálculos.
- `src/components/AudioStudio.tsx`: player e configuração de voz.
- `src/data`: conteúdo da aula e datasets.
- `src/styles.css`: sistema visual e responsividade.
- `server`: servidor local e adaptadores de narração.
- `scripts`: geração da versão portátil.
- `tests`: contratos de áudio com respostas simuladas.
- `public/materiais`: documentos que entram na versão compilada.
- `dist`: aplicação pronta para estudar.
- `docs`: referências, decisões e validação.

## Origem do conteúdo

Base: PDF Aula 01 do Prof. Me Daniel Vieira, 63 páginas. Exemplos de PCBA, cautelas estatísticas, cinco Vs e roteiro de revisão são complementos didáticos. As referências de página seguem a ordem física do PDF. A aplicação não é um produto oficial do SENAI, Brilliant ou DataCamp.
