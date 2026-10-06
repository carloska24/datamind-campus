"""Synchronize the downloadable study guide and notebook with audited lessons.
Run with Python containing reportlab; no original course PDF is modified.
"""
import ast
import json
from pathlib import Path
from html import escape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted

ROOT = Path(__file__).resolve().parent.parent
modules = json.loads((ROOT/'src/data/modules.json').read_text(encoding='utf-8'))
materials = ROOT/'public/materiais'
cells = []
def cell(kind, text):
    value = dict(cell_type=kind, id=f'campus-{len(cells):03}', metadata={}, source=text.splitlines(keepends=True))
    if kind == 'code': value.update(execution_count=None, outputs=[])
    cells.append(value)
def markdown(text): cell('markdown',text)
def code(text): cell('code',text)
markdown('# Aula 01 - laboratório guiado\n\nAbra este arquivo em Jupyter ou importe no Colab. Selecione um ambiente Python e execute as células em ordem (Shift+Enter). Se reiniciar o ambiente, execute novamente **Preparar os dados**. Instale Pandas se necessário: `python -m pip install pandas`.\n\nAs tabelas são transcrições das páginas 45 e 61; há cinco registros de produto e cinco máquinas, respectivamente. A temperatura não tem unidade explícita no slide. Os guias, perguntas adicionais e simulações são complementos didáticos. Cada operação está em sua própria célula para seu resultado ficar visível. Tente as atividades antes das soluções.\n\n`df` é a tabela de produto; `m` é a tabela de máquinas. A coluna `taxa_defeitos` será criada pela transformação, antes da correlação. Estes exercícios exploram tabelas; não treinam um modelo de Machine Learning nem executam Big Data distribuído.')
markdown('## Preparar os dados\nDados originais. Não altere esta preparação para realizar as simulações; use uma cópia.')
code("import pandas as pd\ndf = pd.DataFrame({'produto': ['Motor A', 'Motor B', 'Motor A', 'Motor C', 'Motor B'], 'producao': [100, 120, 110, 90, 130], 'defeitos': [5, 12, 6, 3, 15], 'temperatura': [70, 82, 73, 68, 85]})\nm = pd.DataFrame({'maquina': ['A', 'B', 'C', 'D', 'E'], 'producao': [1250, 1380, 1190, 1450, 1320], 'energia': [420, 465, 390, 510, 405]})")
code('df')
code('m')
for module in modules:
    if not module['code']: continue
    g=module['guide']
    markdown(f"## {module['title']}\n\n{g['sourceNote']}\n\n**Objetivo:** {g['objective']}\n\n{module['explain']}\n\n### Tente antes da solução\n"+'\n'.join(f'{i+1}. {s}' for i,s in enumerate(g['steps']))+'\n\n'+module['question'])
    code('# Escreva sua tentativa e interpretação aqui.\n')
    if module['id']==11:
        markdown('### Questões originais a-g (página 62)\n\na) Qual máquina produziu mais?\n\nb) Qual consome menos energia?\n\nc) Qual a produção média?\n\nd) Qual o consumo médio?\n\ne) Ordene da maior para a menor produção.\n\nf) Crie eficiência = produção/energia.\n\ng) Qual a melhor relação entre produção e energia?\n\nA-E são máquinas, medidas por turno.')
    markdown('### Soluções para conferir\nExecute uma célula por vez e interprete a saída.')
    source=module['code']
    # One statement per cell: Jupyter displays every expression instead of hiding all but the last.
    for statement in ast.parse(source).body:
        code(ast.get_source_segment(source,statement))
    if module['id']==6: code("df[['produto', 'producao', 'defeitos', 'taxa_defeitos']]")
    if module['id']==11:
        for command in ["m.loc[m['producao'].idxmax()]", "m.loc[m['energia'].idxmin()]", "m.sort_values('producao', ascending=False)"]:
            code(command)
    markdown('### Resultado esperado e interpretação\n\n'+g['expected']+'\n\n'+module['answer'])
markdown('## Consulta complementar: funções das páginas 43-44\n\nExperimente em cópias. Os dados simulados nesta seção não são registros adicionais do PDF. A tabela do exercício não tem valores ausentes; vamos introduzir uma ausência somente para observar os comandos.')
for command in [
    "simulada = df.copy()\nsimulada.loc[0, 'temperatura'] = float('nan')",
    'simulada.isnull().sum()',
    'simulada.dropna(subset=[\'temperatura\'])',
    "simulada.fillna({'temperatura': simulada['temperatura'].median()})",
    "df[['producao', 'defeitos', 'temperatura']].median()",
    "df[['producao', 'defeitos', 'temperatura']].std()",
    "df.drop(columns=['temperatura'])",
    "df.rename(columns={'producao': 'pecas_produzidas'})",
    "df.astype({'producao': 'float64'}).dtypes",
    "pd.concat([df.iloc[:2], df.iloc[2:]], ignore_index=True)",
    "totais = df.groupby('produto', as_index=False)['producao'].sum()\ntotais = totais.rename(columns={'producao': 'producao_total_produto'})",
    "pd.merge(df, totais, on='produto', how='left', validate='many_to_one')",
]: code(command)
markdown('std() usa desvio amostral (ddof=1) por padrão. O preenchimento pela mediana acima é apenas uma demonstração, não uma recomendação universal. concat empilha blocos de linhas; merge vincula por uma chave. A validação many_to_one impede multiplicar registros por chaves duplicadas na tabela de totais.')
markdown('## Ler e exportar CSV\n\nRound-trip em memória, sem sobrescrever arquivos no seu computador. Em um arquivo real, use `pd.read_csv("dados.csv")` no caminho em que o arquivo está salvo. `to_csv(index=False)` evita exportar o índice como uma coluna adicional.')
for command in ['from io import StringIO', 'csv_texto = df.to_csv(index=False)', 'print(csv_texto)', 'df_lido = pd.read_csv(StringIO(csv_texto))', 'df_lido', 'pd.testing.assert_frame_equal(df_lido, df)']:
    code(command)
markdown('Excel: `pd.read_excel("dados.xlsx")` e `df.to_excel("resultado.xlsx", index=False)` são opções do material original. Dependem de um arquivo e de um mecanismo compatível, como openpyxl para .xlsx. Parquet também exige um mecanismo compatível. Não são executados neste notebook para evitar dependências e arquivos externos.\n\n### Para concluir\nEscreva observação, limitação e próximo teste. Confira os resultados antes de marcar a autoavaliação no campus.\n\nFontes: PDF original, páginas 35-62; documentação oficial de Pandas: https://pandas.pydata.org/docs/getting_started/intro_tutorials/02_read_write.html e https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.corr.html. Revisão: 06/10/2026.')
notebook=dict(cells=cells,metadata={'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},'language_info':{'name':'python'}},nbformat=4,nbformat_minor=5)
(materials/'Aula01_Laboratorio.ipynb').write_text(json.dumps(notebook,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

styles=getSampleStyleSheet()
for name in ['Normal','BodyText']:
    styles[name].fontName='Helvetica'; styles[name].fontSize=9.5; styles[name].leading=13; styles[name].textColor=colors.HexColor('#253d50'); styles[name].spaceAfter=6
styles.add(ParagraphStyle(name='CourseTitle',fontName='Helvetica-Bold',fontSize=20,leading=24,textColor=colors.HexColor('#144766'),spaceAfter=12))
styles.add(ParagraphStyle(name='CourseHeading',fontName='Helvetica-Bold',fontSize=12,leading=15,textColor=colors.HexColor('#144766'),spaceBefore=9,spaceAfter=5,keepWithNext=True))
styles.add(ParagraphStyle(name='CourseMeta',fontSize=8.5,leading=11,textColor=colors.HexColor('#5a6e7e'),spaceAfter=6))
styles.add(ParagraphStyle(name='CourseCode',fontName='Courier',fontSize=7.6,leading=11,textColor=colors.HexColor('#183d58'),spaceAfter=12))
story=[]
def para(text,style='BodyText'):
    # PDF standard fonts support Portuguese; normalize typographic dashes.
    text=text.replace('–','-').replace('—','-').replace('→',' / ').replace('“','"').replace('”','"')
    story.append(Paragraph(escape(text),styles[style]))
para('DataMind | Caderno de estudo','CourseMeta')
para('Data Science e Big Data na Indústria','CourseTitle')
para('Aula 01 - conceitos, prática e revisão','CourseHeading')
para('Guia para estudantes do campus. Base: Aula 01, Prof. Me Daniel Vieira, PDF de 63 páginas. Revisado em 06/10/2026.')
para('Como estudar','CourseHeading')
para('Leia o resumo, identifique o objetivo, observe as figuras originais no campus e tente a prática antes de conferir. Abra o notebook em Jupyter ou Colab, selecione Python e execute primeiro Preparar os dados. Os tempos do campus incluem leitura e atividades; não são duração de áudio.')
para('Origem e limites','CourseHeading')
para('Este guia adapta os conceitos e exercícios da primeira aula. As páginas referem-se à sequência física do PDF. Objetivos, práticas guiadas, aplicações industriais, cautelas estatísticas e roteiro de revisão são complementos identificados. Não substitui os slides ou a avaliação do professor e não representa uma formação completa em Big Data ou Machine Learning.')
para('Vocabulário dos exemplos','CourseHeading')
para('AOI: inspeção óptica automatizada. SPI: inspeção da pasta de solda. SMT: tecnologia de montagem em superfície. ERP: sistema integrado de gestão. PCBA: placa de circuito impresso montada. Pickup: retirada de componente; feeder: alimentador; nozzle: bico de coleta. São exemplos do setor eletrônico, não dados de uma empresa.')
para('Mapa de estudo','CourseHeading')
for m in modules: para(f"{m['id']+1:02}. {m['title']} | {m['pages']}",'CourseMeta')
for m in modules:
    story.append(PageBreak()); g=m['guide']
    para(f"Módulo {m['id']+1:02} | {m['category']}",'CourseMeta')
    para(m['title'],'CourseTitle'); para(g['sourceNote'],'CourseMeta')
    para('Objetivo','CourseHeading'); para(g['objective'])
    para(m['idea'],'CourseHeading'); para(m['explain'])
    for section in g['sections']: para(section['title'],'CourseHeading'); para(section['text'])
    para('Conexão com a indústria','CourseHeading'); para(m['example'])
    para('Prática guiada - tente antes de conferir','CourseHeading')
    for i,step in enumerate(g['steps']): para(f'{i+1}. {step}')
    if m['code']:
        para('Execute os comandos e confira as saídas no notebook Aula01_Laboratorio.ipynb. Prepare df e m primeiro. O notebook traz as soluções e uma operação por célula.','CourseMeta')
    para('Pergunta de revisão','CourseHeading'); para(m['question'])
    para('Resultado esperado','CourseHeading'); para(g['expected']); para(m['answer'])
    para('Sua explicação: ____________________________________________________')
para('Fontes de conferência','CourseHeading')
para('PDF original: Aula 01, Data Science e Big Data na Indústria, Prof. Me Daniel Vieira. Pandas: pandas.pydata.org/docs/reference/api/pandas.Series.html e pandas.pydata.org/docs/reference/api/pandas.DataFrame.corr.html. KDD: Fayyad, Piatetsky-Shapiro e Smyth, Knowledge Discovery and Data Mining: Towards a Unifying Framework, 1996 (AAAI).')
def footer(canvas,doc):
    canvas.setStrokeColor(colors.HexColor('#c51230')); canvas.setLineWidth(3); canvas.line(42,A4[1]-30,A4[0]-42,A4[1]-30)
    canvas.setFont('Helvetica',8); canvas.setFillColor(colors.HexColor('#5a6e7e')); canvas.drawString(42,27,'DATAMIND | AULA 01 | ESTUDO GUIADO'); canvas.drawRightString(A4[0]-42,27,str(doc.page))
doc=SimpleDocTemplate(str(materials/'Aula01_Caderno_Estudo.pdf'),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=48,bottomMargin=48,title='DataMind - Caderno de estudo da Aula 01',author='DataMind Campus')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(f'Notebook: {len(cells)} cells; PDF synchronized.')
