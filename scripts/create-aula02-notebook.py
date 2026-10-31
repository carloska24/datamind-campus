from pathlib import Path
import json,textwrap,ast
root=Path('public/materiais/aula02');modules=json.loads(Path('src/data/aula02-modules.json').read_text(encoding='utf-8'))
cells=[]
def md(s):cells.append(dict(cell_type='markdown',metadata={},source=s.splitlines(True)))
def code(s):
 s=textwrap.dedent(s).strip();ast.parse(s);cells.append(dict(cell_type='code',metadata={},source=s.splitlines(True),outputs=[],execution_count=None))
md('# Aula 02 — Pandas e análise de dados industriais\nIndústria & Dados · UNISENAI\n\nComplemento didático ao PDF do Prof. Me Daniel Vieira. As resoluções usam as cópias locais fornecidas pelo usuário. Baixe os quatro CSVs para a mesma pasta deste notebook. No Colab, faça o upload dos CSVs. Execute em ordem.\n\nDependências: pandas, numpy, matplotlib e scikit-learn. A seção opcional de Spark requer pyspark e Java compatível. Nenhum dado é enviado automaticamente a serviços externos.')
code(r'''
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
BASE = Path('.')
arquivos = ['producao.csv', 'base_p52.csv', 'base_p54.csv', 'manutencao.csv']
for nome in arquivos:
    if not (BASE/nome).exists():
        raise FileNotFoundError(f'Envie {nome} para a pasta do notebook antes de continuar.')
print('Pandas:', pd.__version__)
''')
md('## 1. Pandas: estrutura, seleção e indicadores\nPDF 8–34. Os cinco registros do exemplo são transcritos abaixo; a unidade da temperatura não foi especificada no exemplo original.')
code(r'''
df = pd.DataFrame({'produto': ['Motor A','Motor B','Motor A','Motor C','Motor B'],
 'producao': [100,120,110,90,130], 'defeitos': [5,12,6,3,15], 'temperatura': [70,82,73,68,85]})
print(df)
print(df.loc[df['temperatura'] > 75, ['produto','temperatura']])
print(df.groupby('produto')['producao'].mean())
df['taxa_defeitos_pct'] = 100 * df['defeitos'] / df['producao'].where(df['producao'] > 0)
print(df.describe())
print(df[['temperatura','defeitos','taxa_defeitos_pct']].corr())
assert df['temperatura'].mean() == 75.6
''')
code(r'''
fig, ax = plt.subplots(figsize=(8, 4))
ax.scatter(df['temperatura'], df['defeitos'])
ax.set(xlabel='Temperatura (unidade não especificada)', ylabel='Defeitos (peças)', title='Cinco registros: associação não demonstra causa')
fig.tight_layout()
plt.show()
''')
md('## 2. Produção e qualidade por turno\nPDF 35–48 e 51. Responda ao total, maior turno, médias, taxas e associação produção/defeitos. A taxa usa totais agregados, não a média simples das porcentagens.')
code(r'''
producao = pd.read_csv(BASE/'producao.csv', parse_dates=['data'])
assert producao.shape == (100, 6)
assert (producao['pecas_aprovadas'] + producao['pecas_defeituosas']).equals(producao['pecas_produzidas'])
resumo = producao.groupby('turno').agg(registros=('pecas_produzidas','size'),
 produzidas=('pecas_produzidas','sum'), defeituosas=('pecas_defeituosas','sum'), media=('pecas_produzidas','mean'))
resumo['taxa_pct'] = 100 * resumo['defeituosas'] / resumo['produzidas']
print('Total:', producao['pecas_produzidas'].sum())
print(resumo.round(4))
print('Maior produção:', resumo['produzidas'].idxmax())
print('Maior taxa:', resumo['taxa_pct'].idxmax())
print('Correlação:', producao['pecas_produzidas'].corr(producao['pecas_defeituosas']))
assert producao['pecas_produzidas'].sum() == 29479
''')
code(r'''
fig, axes = plt.subplots(1,2,figsize=(10,4))
resumo['produzidas'].plot.bar(ax=axes[0], title='Volume por turno', ylabel='Peças')
resumo['taxa_pct'].plot.bar(ax=axes[1], title='Qualidade por turno', ylabel='Peças defeituosas (%)')
fig.tight_layout()
plt.show()
''')
md('## 3. Exercício 1 — máquinas e energia\nPDF 49–50. A tabela foi conferida visualmente com o slide 49.')
code(r'''
maquinas = pd.DataFrame({'maquina': list('ABCDE'), 'producao': [1250,1380,1190,1450,1320],
 'energia_kwh': [420,465,390,510,405]})
maquinas['eficiencia'] = maquinas['producao'] / maquinas['energia_kwh']
print('a) Maior produção:', maquinas.loc[maquinas['producao'].idxmax(), 'maquina'])
print('b) Menor consumo:', maquinas.loc[maquinas['energia_kwh'].idxmin(), 'maquina'])
print('c) Produção média:', maquinas['producao'].mean())
print('d) Energia média:', maquinas['energia_kwh'].mean())
print('e) Ranking de produção:', maquinas.sort_values('producao', ascending=False)['maquina'].tolist())
print('f) Eficiência (peças/kWh):\n', maquinas)
print('g) Melhor eficiência:', maquinas.loc[maquinas['eficiencia'].idxmax(), 'maquina'])
assert maquinas.loc[maquinas['eficiencia'].idxmax(), 'maquina'] == 'E'
''')
md('## 4. Exercício 2 — viagens\nPDF 52–53. Confira uma linha por data e a cobertura dos meses antes de interpretar totais mensais. As imagens das tabelas dos slides 52 e 54 aparecem invertidas em relação aos enunciados; identifique os exercícios pelas colunas das bases.')
code(r'''
viagens = pd.read_csv(BASE/'base_p52.csv', parse_dates=['data'])
assert not viagens['data'].duplicated().any()
print('a) Total:', viagens['quantidade_viagens'].sum())
print('b) Maior dia:', viagens.loc[viagens['quantidade_viagens'].idxmax(), ['data','quantidade_viagens']])
print('c) Média diária observada:', viagens['quantidade_viagens'].mean())
mensal = viagens.groupby(viagens['data'].dt.to_period('M')).agg(dias=('data','size'), viagens=('quantidade_viagens','sum'))
print('d) Totais e cobertura mensal:\n', mensal)
print('Maior mês:', mensal['viagens'].idxmax())
print('e) Correlação viagens/distância:', viagens['quantidade_viagens'].corr(viagens['distancia_total_km']))
assert viagens['quantidade_viagens'].sum() == 2893
''')
md('## 5. Exercício 3 — vendas\nPDF 54–55. Faturamento depende de preço e quantidade; associação temporal não isola causalidade.')
code(r'''
vendas = pd.read_csv(BASE/'base_p54.csv')
vendas['mes'] = pd.to_datetime(vendas['mes'], format='%Y-%m')
assert not vendas['mes'].duplicated().any()
assert np.allclose(vendas['unidades_vendidas']*vendas['preco_unitario_rs'], vendas['faturamento_rs'], atol=0.01)
print('a) Total de unidades:', vendas['unidades_vendidas'].sum())
print('b) Maior mês:', vendas.loc[vendas['faturamento_rs'].idxmax(), ['mes','faturamento_rs']])
print('c) Faturamento total:', vendas['faturamento_rs'].sum())
anual = vendas.groupby(vendas['mes'].dt.year).agg(meses=('mes','size'), unidades=('unidades_vendidas','sum'))
print('d) Unidades e cobertura anual:\n', anual)
print('Maior ano:', anual['unidades'].idxmax())
print('e) Correlação preço/quantidade:', vendas['preco_unitario_rs'].corr(vendas['unidades_vendidas']))
''')
md('## Projeto S&M — etapa 1: compreensão e exploração\nPDF 57–70. A unidade é o registro de sensor por máquina/instante. O rótulo falha descreve o registro; não representa automaticamente um evento independente ou previsão futura.')
code(r'''
bruta = pd.read_csv(BASE/'manutencao.csv')
print('Dimensões brutas:', bruta.shape)
print('Ausentes por coluna:\n', bruta.isna().sum())
print('Duplicatas exatas:', bruta.duplicated().sum())
base = bruta.drop_duplicates().copy()
base['timestamp'] = pd.to_datetime(base['timestamp'], errors='raise')
base = base.sort_values(['timestamp','maquina_id']).reset_index(drop=True)
sensores = ['temperatura_c','vibracao_mm_s','pressao_bar','corrente_a','horas_operacao']
assert set(base['falha'].dropna().unique()).issubset({0,1})
assert base['falha'].notna().all()
print(base[sensores].describe())
perfil = base.groupby('maquina_id')['falha'].agg(['size','sum','mean'])
print('Taxa por máquina:\n', perfil)
print('Percentual global de registros com falha:', 100*base['falha'].mean())
assert bruta.shape == (5050, 8)
assert len(base) == 5000
''')
md('## Etapa 2: preparação e mineração\nPDF 71–72. Preserve o bruto e registre tratamentos. Não elimine extremos sem justificativa. A imputação destinada ao modelo será ajustada no treino dentro de um pipeline.')
code(r'''
print(base.groupby('falha')[sensores].median())
print(base[sensores + ['falha']].corr()['falha'].sort_values())
fig, ax = plt.subplots(figsize=(8,4))
for classe, grupo in base.groupby('falha'):
    ax.scatter(grupo['temperatura_c'], grupo['vibracao_mm_s'], alpha=.25, s=12, label=f'Falha={classe}')
ax.set(xlabel='Temperatura (°C)', ylabel='Vibração (mm/s)', title='Condições observadas por classe')
ax.legend()
fig.tight_layout()
plt.show()
''')
md('## Etapa 3: classificação supervisionada\nPDF 73–74. O exemplo abaixo usa corte temporal, mantendo o mesmo instante no mesmo conjunto. Compara dois modelos em validação; avalia apenas o escolhido no teste final e uma referência majoritária. Isso não comprova previsão antecipada de paradas. Antes de usar em produção, defina horizonte e disponibilidade de cada sensor.')
code(r'''
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.metrics import f1_score, classification_report, ConfusionMatrixDisplay
instantes = np.sort(base['timestamp'].unique())
corte_validacao = instantes[int(len(instantes)*.6)]
corte_teste = instantes[int(len(instantes)*.8)]
treino = base['timestamp'] < corte_validacao
validacao = (base['timestamp'] >= corte_validacao) & (base['timestamp'] < corte_teste)
teste = base['timestamp'] >= corte_teste
X, y = base[sensores], base['falha']
modelos = {
 'Arvore': DecisionTreeClassifier(max_depth=5, class_weight='balanced', random_state=42),
 'Logistica': LogisticRegression(max_iter=2000, class_weight='balanced', random_state=42)
}
pipelines = {nome: Pipeline([('imputacao', SimpleImputer(strategy='median')),
 ('escala', StandardScaler()), ('modelo', estimador)]) for nome, estimador in modelos.items()}
validacoes = {}
for nome, pipeline in pipelines.items():
    pipeline.fit(X.loc[treino], y.loc[treino])
    validacoes[nome] = f1_score(y.loc[validacao], pipeline.predict(X.loc[validacao]), zero_division=0)
print('F1 na validação:', validacoes)
escolhido = max(validacoes, key=validacoes.get)
final = pipelines[escolhido].fit(X.loc[treino | validacao], y.loc[treino | validacao])
previsao = final.predict(X.loc[teste])
referencia = DummyClassifier(strategy='most_frequent').fit(X.loc[treino | validacao], y.loc[treino | validacao])
print('Modelo escolhido pela validação:', escolhido)
print('Teste final:\n', classification_report(y.loc[teste], previsao, zero_division=0))
print('Referência majoritária:\n', classification_report(y.loc[teste], referencia.predict(X.loc[teste]), zero_division=0))
ConfusionMatrixDisplay.from_predictions(y.loc[teste], previsao, labels=[0,1], display_labels=['Sem falha','Falha'])
plt.show()
''')
md('## Etapa 4: perfis com K-Means\nPDF 75–76. O rótulo falha não entra no agrupamento. Compare K com inércia, silhueta e interpretação; a escolha por silhueta é uma heurística, não uma verdade operacional.')
code(r'''
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.pipeline import make_pipeline
preparacao = make_pipeline(SimpleImputer(strategy='median'), StandardScaler())
Z = preparacao.fit_transform(base[sensores])
candidatos, ajustes = [], {}
for k in range(2, 6):
    km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(Z)
    ajustes[k] = km
    candidatos.append({'k': k, 'inercia': km.inertia_,
      'silhueta': silhouette_score(Z, km.labels_, sample_size=min(1000,len(Z)), random_state=42)})
comparacao = pd.DataFrame(candidatos)
print(comparacao)
k = int(comparacao.loc[comparacao['silhueta'].idxmax(), 'k'])
perfis = base.assign(cluster=ajustes[k].labels_)
print('K escolhido nesta heurística:', k)
print(perfis.groupby('cluster')[sensores].median())
print(perfis.groupby('cluster')['falha'].agg(['size','mean']))
''')
md('## Etapa 5: PySpark e recomendações\nPDF 77–79. A célula é opcional: instale pyspark e Java compatível, depois altere EXECUTAR_SPARK para True. Ela não instala software automaticamente. A base pequena serve para aprender a API; não demonstra vantagem de desempenho distribuído. Para uma versão ampliada, documente como os dados foram gerados; repetições artificiais não são evidência nova.')
code(r'''
EXECUTAR_SPARK = False
if EXECUTAR_SPARK:
    from pyspark.sql import SparkSession, functions as F
    spark = SparkSession.builder.master('local[*]').appName('Aula02').getOrCreate()
    try:
        sdf = spark.read.csv(str(BASE/'manutencao.csv'), header=True, inferSchema=True).dropDuplicates()
        sdf.select('maquina_id','temperatura_c','falha').filter(F.col('falha') == 1).show(5)
        sdf.groupBy('maquina_id').agg(F.count('*').alias('registros'), F.avg('falha').alias('taxa_falha')).show()
    finally:
        spark.stop()
else:
    print('Spark não executado. Instale as dependências e ative a opção para desenvolver esta etapa.')
''')
md('## Sua interpretação e entrega\nComplete com suas próprias conclusões:\n\n1. Quais achados são mais relevantes e que dados os sustentam?\n2. Qual modelo foi escolhido, por qual métrica e quais são suas limitações?\n3. Como interpretar os perfis de operação?\n4. O que o Spark permitiu reproduzir e que escala real justificaria usá-lo?\n5. Quais recomendações de monitoramento/manutenção podem ser testadas?\n\nRubrica do slide 80: exploração 15; tratamento 15; análise/mineração 15; classificação 25; agrupamento 10; Spark 10; interpretação e recomendações 10. Total 100. O campus não envia a atividade.\n\nFontes técnicas: [Pandas](https://pandas.pydata.org/docs/getting_started/intro_tutorials/), [Scikit-learn](https://scikit-learn.org/stable/common_pitfalls.html), [PySpark](https://spark.apache.org/docs/latest/api/python/getting_started/quickstart_df.html).')
notebook=dict(cells=cells,metadata=dict(kernelspec=dict(display_name='Python 3',language='python',name='python3'),language_info=dict(name='python',version='3.12')),nbformat=4,nbformat_minor=5)
for i,c in enumerate(cells):c['id']=f'aula02-{i:02}'
(root/'Aula02_Laboratorio.ipynb').write_text(json.dumps(notebook,ensure_ascii=False,indent=2),encoding='utf-8')
print(len(cells),'células criadas e sintaxe verificada')
