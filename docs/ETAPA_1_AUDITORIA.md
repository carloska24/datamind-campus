# Etapa 1 da auditoria — fricções corrigidas

Data: 06/10/2026. Base: `23f98aa`, com o visual anterior restaurado.

O usuário orientou seguir a sugestão original da auditoria. Esta entrega implementa a Etapa 1: áudio móvel, buscas, foco, endereços e retomada. A identidade violeta/ciano, as fontes, as ilustrações, o hero e os componentes existentes foram mantidos. As mudanças de layout são locais e vinculadas às tarefas identificadas.

## Decisões e resultado

| Problema | Causa verificada | Correção |
| --- | --- | --- |
| Áudio cortado no celular | Tamanho mínimo dos itens de grid e dos controles | Colunas e filhos podem encolher; seleção ocupa a largura disponível; controles podem quebrar linha |
| Configuração antes do player | Segunda coluna forçada à primeira linha em telas estreitas | Ordem original do conteúdo recuperada. Até 540 px, a capa decorativa é omitida para aproximar o play |
| Busca sem acento falha | Normalização diferente entre trilha e busca geral | Função comum em `src/search.ts`; busca geral também considera explicações e perguntas |
| Foco sai da janela | `aria-modal` sem contenção de foco | Fundo inerte, Tab/Shift+Tab contidos, fechamento visível e retorno ao acionador |
| Página/atividade desaparece ao atualizar | Navegação apenas em memória | Endereços por fragmento com validação, recarregamento e histórico |
| “Continuar” escolhe o primeiro pendente | Ausência de registro da última atividade | Retomada separada da recomendação; atividade salva por navegador; trilha concluída conduz à revisão |

Fragmentos foram escolhidos para manter o mesmo comportamento no servidor local e no arquivo portátil, sem nova dependência de roteamento. Módulos e trechos usam numeração a partir de 1 no endereço. Exemplos:

- `#/aula/9`: Pandas, leitura de tabela.
- `#/audio/9/3`: trecho 3 dessa aula.
- `#/kdd/3`: transformação.
- `#/laboratorios/2`: produção e energia.
- `#/revisao/9`: cartão de Pandas.

O estado de retomada fica em uma chave separada de armazenamento, sem alterar o formato das anotações/exportações ou incluir credenciais. A retomada de áudio começa no início do trecho salvo. Atualização ou navegação não gera áudio automaticamente. A configuração de API continua privada no servidor.

As etapas do KDD aparecem em linhas de 58 px ou mais no celular, com nomes em 14 px. A navegação, filtros e etapas indicam seleção com atributos acessíveis. O cabeçalho identifica a área ou aula atual. O atalho de produção/energia no início abre o laboratório correspondente.

## Validação

- Reprodução inicial: documento de áudio com 440 px para uma área útil de 380 px; play em aproximadamente 2317 px de altura. Busca `correlacao` vazia; Shift+Tab saindo da busca.
- Depois: em 390 × 844, documento de 380 px e play em aproximadamente 578 px; em 360 × 800, documento de 350 px e play em aproximadamente 578 px. Em 768 × 1024, documento de 758 px e player antes das configurações. Os 10 px restantes são a barra de rolagem.
- `correlacao` e `correlação` retornam os mesmos dois módulos na trilha. Busca geral encontra o conceito e abre a aula pelo teclado.
- Shift+Tab permanece na busca; Escape fecha e devolve foco a `open-command-palette`.
- Atualização preserva aula/trecho, etapa de KDD, laboratório e cartão. Voltar no navegador retorna à área anterior. Retomada após voltar ao início e recarregar abre o trecho salvo.
- Conferência visual nos temas claro/escuro. Sem erros capturados no console durante a inspeção. Nenhuma anotação ou conclusão de módulo foi inserida como dado de teste.
- `npm test`: 20/20 passaram, incluindo limites de endereço, retomada, conclusão da trilha e os 16 testes anteriores de áudio/credenciais. `npm run build`: passou e gerou `dist/ABRIR.html`.
- Os testes importam os helpers TypeScript com a flag de remoção de tipos, disponível na [documentação do Node 22.12](https://nodejs.org/download/release/v22.12.0/docs/api/typescript.html#type-stripping). Não foram adicionadas dependências.
- A interface confirmou Gemini configurado e servidor disponível. Não foi realizada nova geração faturável durante esta etapa.

Evidências: [áudio móvel](etapa-1/01-audio-mobile.png), [KDD móvel](etapa-1/02-kdd-mobile.png), [início com retomada](etapa-1/03-home-resume.png) e [tema escuro](etapa-1/04-home-dark.png).

## Continuidade

A próxima etapa da auditoria é tornar uma turma viável: identidade, papéis, matrícula, sincronização e administração da narração. O perfil fixo e o armazenamento por navegador permanecem até essa etapa. Tentativas/dicas, revisão persistente, ampliação do catálogo, links de páginas do PDF e validação completa com leitor de tela continuam no roteiro. Esta entrega não é uma certificação de acessibilidade.
