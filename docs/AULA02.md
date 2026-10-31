# Aula 02 — Pandas e análise de dados industriais

Aula 02 integrada ao mesmo ambiente da Aula 01. O PDF original tem 81 páginas; a trilha reúne 14 tópicos com objetivos, explicações, figuras do PDF, exemplos, código, prática guiada, pergunta e resposta. Há quatro laboratórios interativos e uma área para as cinco etapas do projeto S&M Industry. Nenhuma outra aula foi importada.

## Navegação e compatibilidade

- Aula 01 mantém os links existentes, como `#/aula/1` e `#/audio/1/1`.
- Aula 02 utiliza `#/aula02/trilha`, `#/aula02/aula/1`, `#/aula02/audio/1/1`, `#/aula02/laboratorios/1` e `#/aula02/projeto/1`.
- O seletor da barra lateral permite mudar a aula também na biblioteca, no caderno e na página de progresso.
- `done` e `notes` no nível superior continuam pertencendo à Aula 01. A Aula 02 usa `courses.aula02`. As duas são salvas juntas, com a revisão existente, sem desmontar a sessão ao trocar de aula.
- Clientes antigos que enviam apenas o formato da Aula 01 preservam os dados existentes da Aula 02 no servidor. A exportação nova inclui ambas as aulas, e a importação mantém suporte às cópias antigas.

## Áudio

Cada tópico contém quatro trechos: ideia central, prática industrial, pergunta e revisão. São 56 trechos na Aula 02. O modo navegador e os adaptadores OpenAI/Gemini usam o conteúdo da aula selecionada. A requisição de voz inclui `courseId`; o servidor só aceita `aula01` e `aula02`, e o cache inclui o texto do roteiro na sua identificação. As credenciais existentes são compartilhadas sem serem exportadas no caderno. Nenhum áudio faturável foi gerado para validar esta integração.

## Fontes e materiais

O PDF e os quatro CSVs foram fornecidos pelo usuário. Os CSVs vieram de `Aula02/dados`; o arquivo `proveniencia.json` registra os hashes dessas cópias. Não há afirmação de equivalência integral com versões atuais dos links do Drive. A tabela de cinco máquinas foi conferida com o slide 49. As figuras do campus são reproduções identificadas de páginas do PDF; as capas reutilizam as ilustrações do projeto.

Os materiais para download ficam em `public/materiais/aula02`:

- `Aula02_Original.pdf`: material do professor, 81 páginas.
- `Aula02_Caderno_Estudo.pdf`: complemento didático de 32 páginas.
- `Aula02_Laboratorio.ipynb`: resoluções dos exercícios e exemplo de desenvolvimento das cinco etapas do projeto, com resultados executados para Pandas, gráficos, classificação e K-Means.
- `producao.csv`, `base_p52.csv`, `base_p54.csv` e `manutencao.csv`.

O notebook não instala dependências automaticamente. PySpark é opcional e depende de Java e PySpark compatíveis; sua célula fica desativada por padrão e não foi executada na validação. A execução pode variar com versões das bibliotecas. A etapa Spark demonstra operações e agregações; ampliar sinteticamente a base exige documentar a geração e não cria evidência nova para os modelos.

## Indicadores e limites

Os laboratórios foram calculados das bases locais: produção, viagens e vendas têm 100 registros cada. Manutenção tem 5.050 linhas brutas e 5.000 após remover 50 duplicatas exatas. Há 903 registros com falha após essa deduplicação; isso não corresponde automaticamente a 903 episódios de parada. O projeto apresenta faltantes na base bruta e taxas após deduplicação, explicitando o recorte.

Os exemplos distinguem contagem de defeitos e taxa ponderada por produção, associação e causalidade, classificação contemporânea e previsão antecipada, e cobertura parcial de meses/anos. O modelo supervisionado usa cortes por instante no tempo e seleciona entre dois candidatos por F1 na validação, mantendo o teste final separado.

## Reprodução

`python scripts/prepare-aula02-data.py` recalcula os indicadores a partir dos CSVs. `python scripts/create-aula02-notebook.py` recria o notebook sem resultados executados. `python scripts/create-aula02-guide.py` gera o PDF com ReportLab e as fontes Segoe UI/Consolas do Windows. Os scripts assumem execução a partir da raiz do repositório.

Compile com `npm run build`, teste com `npm test` e reinicie `npm start`. A compilação atualiza `dist` e incorpora as figuras no HTML portátil. No modo portátil, o PDF e o notebook continuam disponíveis na pasta de materiais ao lado do HTML.


## Revisão visual e de fontes

A Aula 02 tem 14 capas diferentes, selecionadas por tópico. Oito são figuras do PDF, incluindo o ciclo de análise, matrizes, gráficos, eficiência de máquinas, fotografias do caso S&M e agrupamentos. As demais vêm da documentação oficial do Pandas: DataFrame, entrada/saída, seleção, estatísticas, groupby e séries temporais. Os caminhos e créditos estão em `src/data/aula02-artwork.json` e `public/course-art/aula02/curated/SOURCES.txt`; a licença dos materiais do Pandas acompanha os arquivos. Não foi aplicada imagem gerada nesta revisão. As fontes são locais também no HTML portátil, que agora incorpora SVG.

A trilha tem capítulos para preparação, análise, casos práticos e projeto. Os cards são maiores para manter as figuras legíveis e mostram a origem de cada imagem. A entrada da aula, os laboratórios, o projeto e a capa de áudio usam figuras da própria Aula 02.

Foi identificada uma inconsistência do PDF: o slide 52 descreve viagens, mas exibe uma tabela de vendas; o slide 54 descreve vendas, mas exibe viagens. A nota do tópico 12 e do notebook sinaliza a inversão. Os laboratórios continuam associados aos arquivos e colunas corretos. O PDF original não foi alterado.
