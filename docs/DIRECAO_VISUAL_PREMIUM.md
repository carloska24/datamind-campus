# DataMind Campus — evolução visual premium

Data: 05/10/2026. Ponto de recuperação anterior: `5ff9c4d`; auditoria anterior: `9f8fa4b`.

## Direção autorizada

O usuário definiu o destino como uma plataforma para vários alunos e autorizou uma transformação visual ampla após o commit de recuperação. A recomendação anterior de conservar a paleta foi substituída por essa decisão. O conteúdo da Aula 01, os exemplos industriais, os laboratórios e a persistência das chaves continuam sendo a base funcional.

A proposta combina linguagem editorial, arte industrial exclusiva e ações claras para estudar. O fundo mineral, o grafite e o azul profundo substituem a predominância de violeta/ciano. Títulos em Georgia contrastam com a tipografia funcional do sistema. As fontes funcionam localmente, sem depender de um serviço externo.

## Referências e aplicação

- [Coolage — estudo de UX/UI para estudantes](https://uxplanet.org/coolage-ui-ux-case-study-b76feb633c5e): referência fornecida pelo usuário. A priorização das tarefas do aluno, a consistência dos componentes e a navegação móvel orientaram o próximo passo destacado, os atalhos de estudo e a barra inferior. A pesquisa descrita pertence ao Coolage; não representa pesquisa realizada com alunos do DataMind.
- [Rocket](https://www.rocket.new/) e [Linear](https://linear.app/): referências de composição, hierarquia e acabamento. O campus recebeu tokens comuns para os dois temas, superfícies discretas e estados de seleção coerentes.
- [Educação no Awwwards](https://www.awwwards.com/websites/education/): repertório visual para interfaces de aprendizagem.
- [Transcrição publicada sobre o processo de Jack Roberts](https://moderncreator.app/2026-05-26-jack-roberts-how-i-build-10-000-ai-websites-in-17-mins): referência indireta ao uso de repertório visual e refinamento de tipografia e espaçamento. O vídeo original não pôde ser carregado; não foi tratado como vídeo assistido. A direção final é própria do DataMind.

## Implementação

- Página inicial recomposta: introdução editorial, arte de órbitas metálicas, resumo real da aula, módulo recomendado, acesso ao áudio, descoberta do KDD, prática e revisão.
- Arte raster exclusiva em `public/assets/campus-sculpture.png`, gerada com a skill imagegen. Diagramas das categorias foram construídos em SVG no código, com representação de dados, KDD, tabela e indicadores.
- Navegação, trilha, aulas, laboratórios, revisão, caderno, materiais e áudio receberam o mesmo vocabulário visual nos temas claro e escuro.
- Atalhos inferiores no celular: início, trilha, prática, áudio e caderno. Menu lateral mantém acesso às demais áreas.
- Player precede a configuração em telas estreitas; banner decorativo é omitido no celular para trazer a reprodução à primeira tela. A grade não força largura maior que a página.
- Etapas do KDD aparecem em linhas legíveis no celular. A composição inicial empilha texto e arte no intervalo de tablet que ainda utiliza a barra lateral.
- Busca da trilha ignora acentos; busca geral também procura nos conceitos e explicações. Janela de busca contém o foco, torna o fundo inerte e devolve o foco ao fechar. Filtros e navegação indicam seleção com atributos acessíveis.

## Verificação

Navegação manual nas oito áreas, módulos de Pandas, filtro de categoria, busca `correlacao`, seleção de etapa KDD, troca de medida no laboratório e resposta de cartão. Nenhuma anotação ou marcação de conclusão do aluno foi inserida nos testes visuais.

Viewports de 1440 × 1000, 768 × 1024, 390 × 844 e 360 × 800; o navegador reserva 10 px para a barra de rolagem. As telas examinadas não apresentaram rolagem horizontal da página. Tabelas e código podem ter rolagem interna. Temas claro/escuro conferidos visualmente. Busca por `correlacao` retornou dois módulos; Shift+Tab permaneceu na busca e Escape devolveu o foco ao botão que a abriu.

`npm test`: 16/16 passaram, incluindo persistência de chaves, isolamento entre provedores e falhas de conexão. `npm run build`: passou e regenerou a versão portátil. A interface confirmou chave Gemini configurada e servidor local disponível. Não foi feita nova geração faturável de áudio durante o redesenho.

Capturas em `docs/premium/`: início em desktop e celular, áudio móvel, aula, laboratório e tema escuro. São evidências de inspeção, não uma certificação de acessibilidade ou desempenho.

## Próxima etapa da plataforma

O novo visual ainda utiliza o funcionamento local existente. Contas reais, matrículas, permissões, sincronização do progresso, gestão de API por administrador e acompanhamento por turma exigem a etapa de produto e servidor indicada na auditoria. O perfil continua fixo e o progresso permanece por navegador. Links por atividade e retomada da última posição também continuam pendentes.

A imagem principal tem aproximadamente 2 MB; não foi feito benchmark de carregamento em rede móvel. Avaliar uma versão otimizada antes de disponibilizar o campus publicamente.
