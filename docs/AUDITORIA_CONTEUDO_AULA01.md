# Auditoria de conteúdo da Aula 01

Revisão em 06/10/2026. Base comparada: PDF original de 63 páginas, os 14 módulos, os dois laboratórios interativos, o notebook e o caderno de estudo. Houve revisão independente por agente de conteúdo. As páginas abaixo são a ordem física do PDF.

## Parecer

O núcleo conceitual e os resultados numéricos estavam corretos. O campus, porém, apresentava resumos curtos como módulos de 8–20 minutos, com pouca orientação para um iniciante executar, interpretar e verificar o que aprendeu. Era adequado como revisão da primeira aula, mas insuficiente como experiência autônoma de estudo.

Esta revisão mantém os 14 módulos e acrescenta objetivos, duas explicações por módulo, prática guiada e resultados esperados. O campus continua sendo material de apoio à **Aula 01**. Não constitui uma formação completa em Big Data ou Machine Learning: não há processamento distribuído, treino de modelos ou avaliação preditiva prática nos exercícios originais. Esses conteúdos exigiriam novas aulas e bases mais representativas.

## Problemas encontrados e correções

| Prioridade | Evidência no estado anterior | Correção aplicada |
| --- | --- | --- |
| Alta | Notebook com vários comandos na mesma célula; Jupyter mostra apenas a última expressão. Correlação original e ranking podiam ficar ocultos. | Uma operação por célula, saídas explícitas, perguntas e espaço para tentativa antes das soluções. |
| Alta | Código de correlação dependia de `taxa_defeitos` criada em outra etapa; `df` e `m` não tinham preparação explicada nos módulos. | Orientação de abertura/execução, preparação identificada e criação explícita da taxa antes da correlação. |
| Alta | Um parágrafo de resumo, um exemplo e uma pergunta por módulo não sustentavam sozinhos o tempo sugerido. | Objetivos, aprofundamento, atividade e conferência; tempos apresentados como leitura + prática, sem afirmar duração cronometrada. |
| Média | Pergunta sobre “cinco motores”, mas p.45 tem cinco registros e três categorias de produto, sem identidade individual. | “Cinco registros de produção”; unidade de análise e dados ausentes explicados. |
| Média | Caderno personalizado para Carlos; notebook/caderno ainda descreviam A–E de modo ambíguo como dados por turno. | Caderno geral para estudantes; A–E identificadas como máquinas, com medidas por turno. |
| Média | Exemplos em eletrônica e campos adicionais podiam parecer transcrições do PDF. | Origem por módulo, glossário inicial e siglas definidas; lote, máquina e horário identificados como coleta proposta. |
| Média | Páginas 43–44: limpeza, mediana/desvio, conversão, concatenação, junção e exportação sem prática no notebook. | Consulta complementar em cópias; CSV em memória com leitura/exportação; Excel apresentado como opção com dependência declarada. |
| Média | Referências amplas e “PDF · Complemento aplicado” sugerindo página inexistente. | Referências mais precisas e rótulos próprios para módulos complementares. |
| Média | Sessões de revisão somavam tempos diferentes dos cartões. | Sessões de aproximadamente 38, 40, 71 e 23 minutos: total de 172 minutos, incluindo o módulo de revisão. |
| Média | Materiais de estudo, referências de interface e APIs de voz misturados. | Bibliografia do professor e documentação para estudo aparecem antes das referências do campus. |
| Média | Imagens de 1672×941 reduzidas a 188×118, com `cover`, além de zoom em algumas capas. | Imagens inteiras com `contain`, sem zoom; faixa da aula em 16:9 e dimensão maior. Origem continua indicada. |

## Conferência por módulo

| Módulo | Base principal | Adequação e ajuste pedagógico |
| --- | --- | --- |
| 01 · Da pergunta à decisão | 18–19; 23–24 | Conceitos adequados. Separação entre observação, hipótese e ação; apontamento de AOI não equivale a defeito confirmado. |
| 02 · Onde os dados nascem | 13–16 | Fontes industriais adequadas. Identificadores, granularidade e risco de multiplicar linhas em junções. Exemplos SPI/AOI/SMT/ERP são complementares. |
| 03 · Big Data, mineração e aprendizado | 17; 21–24; 26; 30 | Distinções adequadas. Cinco Vs são complementares; cinco registros não permitem validar um sistema industrial de previsão. |
| 04 · Profissionais e ferramentas | 20; 32–33 | Papéis e bibliotecas adequados. Linguagem, biblioteca e ambiente diferenciados; responsabilidades compartilhadas. |
| 05 · KDD: seleção | 25–27; aplicação 45 | Sequência adequada. Campos realmente disponíveis separados dos campos sugeridos. SQL/NoSQL não são medida de validade dos dados. |
| 06 · KDD: pré-processamento | 28; 43 | Cuidados corretos. Estrutura e validade separadas: imagem/texto não é inválido por natureza. Simulação de ausência identificada e original preservado. |
| 07 · KDD: transformação | 29; 43; 59 | Normalização não tratada como requisito universal. Taxa por 100 peças e percentual de peças defeituosas diferenciados; denominador zero discutido. |
| 08 · KDD: mineração e avaliação | 30–31 | Avaliação contextual adequada. Treino/teste e cuidado temporal identificados como aprofundamentos, sem afirmar treinamento no exercício. |
| 09 · Pandas: ler a tabela | 35–41; dados 45 | Series definida como estrutura unidimensional com rótulos, podendo existir fora de DataFrame. Criação, inspeção e saídas praticadas. |
| 10 · Pandas: filtrar e agrupar | 42–44; 49–58 | Filtros e médias corretos. Contagem por grupo e desvio amostral ajudam a interpretar grupos pequenos e NaN estatístico. |
| 11 · Temperatura e defeitos | 45–60 | Dados e cálculos conferem. Contagem/taxa distinguidas; cinco registros não sustentam inferência causal ou limite seguro de operação. |
| 12 · Produção e energia | 61–62 | Sete respostas conferem. Unidade peças/kWh explícita; maior produção não é maior eficiência. Comparabilidade real discutida. |
| 13 · Transferir para sua rotina | Complemento aplicado | Proposta adequada se tratada como projeto sugerido. Dicionário de dados, evidências, hipótese e coleta necessária. |
| 14 · Como revisar | Roteiro sugerido | Roteiro adaptável e autoavaliação sem certificação. Tempos alinhados às atividades; retorno à preparação após reiniciar Python. |

## Resultados recalculados

Dados do exercício 1 preservados: A/100/5/70, B/120/12/82, A/110/6/73, C/90/3/68, B/130/15/85, na ordem produto/produção/defeitos/temperatura. A unidade de temperatura não aparece na tabela original; não foi inventada.

- Médias: produção 110, defeitos 8,2, temperatura 75,6; extremos de temperatura 68 e 85.
- Temperatura > 75: dois registros de Motor B; produção média por produto A 105, B 125, C 90.
- Taxas por 100 peças: 5; 10; 5,454545; 3,333333; 11,538462.
- Pearson temperatura/contagem: 0,995050505674452. Temperatura/taxa: 0,9948998223415372.
- Não há ausências nem linhas inteiramente duplicadas nos cinco registros originais. A simulação de ausência é feita em cópia.

Exercício 2: médias 1.318 peças/turno e 438 kWh/turno. Maior produção D; menor consumo C. Produção decrescente D, B, E, A, C. Eficiência decrescente E, C, A, B, D. E: 3,259259 peças/kWh. Estes rankings descrevem os números do exercício; não estabelecem superioridade operacional geral.

## Origem e cuidado com o próprio material

O slide 28 coloca “dados não estruturados” junto de NaN e inválidos; o campus esclarece que estrutura não determina validade. A taxa do slide 59 não esclarece se defeitos são ocorrências ou peças únicas; o campus explicita os dois sentidos. A cronologia e nomes citados no slide 21 não foram convertidos em atribuição de autoria da mineração de dados. O artigo de KDD abaixo é usado para conferir a distinção entre processo e etapa, sem alterar o PDF original.

A figura gerada do cabeçalho é uma ilustração, não uma representação rigorosa de algoritmo, arquitetura ou dados. Figuras originais e ampliáveis continuam identificadas por página. Detalhes complexos não devem ser interpretados a partir da miniatura de capa.

## Validação e limites

`scripts/verify-study-materials.py` executa todas as 56 células de código em ambiente novo, confere os registros originais após as simulações, médias, filtros, correlações, rankings e o round-trip CSV. Validado com Pandas 3.0.1. O notebook contém 81 células no total, incluindo orientações e tentativas.

`scripts/build-study-materials.py` gera notebook e caderno a partir da mesma fonte dos módulos. O caderno revisado tem 15 páginas e foi renderizado para conferir todas as páginas, com inspeção ampliada de páginas representativas. O PDF original não foi modificado. O servidor lê a fonte de narração por solicitação para futuras atualizações de conteúdo; o áudio corresponde ao resumo em quatro trechos, enquanto prática e códigos são atividades de leitura/execução.

TypeScript, produção e pacote portátil: aprovados. Suíte de 25 testes: aprovada. Navegador: aulas 02/03, figura original ampliada, prática e resposta, e layout em 390 px conferidos. O pacote portátil teve incorporação de imagens e sintaxe verificadas; execução `file:` não foi testada nesta revisão, pois a ferramenta de navegador bloqueia esse protocolo.

O conteúdo revisado é adequado como introdução acompanhada de prática da Aula 01. Uma próxima etapa curricular, fora desta revisão, poderia acrescentar critérios de avaliação docente, exercícios com dados inéditos, mais amostras e aulas próprias de ML/Big Data. A adequação ao calendário e à avaliação formal deve ser alinhada às orientações do professor.

## Fontes de conferência

- PDF local: `public/materiais/Aula01_Original.pdf`, Prof. Me Daniel Vieira, 63 páginas.
- [Pandas: Series](https://pandas.pydata.org/docs/reference/api/pandas.Series.html): estrutura unidimensional com rótulos.
- [Pandas: correlação](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.corr.html): Pearson padrão e seleção das colunas numéricas.
- [Pandas: desvio padrão](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.std.html): desvio amostral por padrão.
- [Fayyad, Piatetsky-Shapiro e Smyth, 1996](https://cdn.aaai.org/KDD/1996/KDD96-014.pdf): processo KDD e mineração como uma de suas etapas.
