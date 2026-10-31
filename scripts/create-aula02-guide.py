from pathlib import Path
import json,html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
root=Path('public/materiais/aula02')
for n,f in [('Body','segoeui.ttf'),('Bold','segoeuib.ttf'),('Mono','consola.ttf')]:pdfmetrics.registerFont(TTFont(n,'C:/Windows/Fonts/'+f))
styles=getSampleStyleSheet()
for name in ['Normal','BodyText']:styles[name].fontName='Body';styles[name].fontSize=10.5;styles[name].leading=16;styles[name].textColor=colors.HexColor('#243e52')
for name in ['Title','Heading1','Heading2','Heading3']:styles[name].fontName='Bold';styles[name].textColor=colors.HexColor('#163549')
styles['Title'].fontSize=32;styles['Title'].leading=39
styles['Heading1'].fontSize=24;styles['Heading1'].leading=30;styles['Heading1'].spaceAfter=20
styles['Heading2'].fontSize=15;styles['Heading2'].leading=20;styles['Heading2'].spaceBefore=17;styles['Heading2'].spaceAfter=10
styles.add(ParagraphStyle(name='CodeCustom',fontName='Mono',fontSize=8,leading=11,backColor=colors.HexColor('#edf4f7'),borderPadding=12,spaceAfter=14))
styles.add(ParagraphStyle(name='EyebrowCustom',fontName='Bold',fontSize=9,leading=14,textColor=colors.HexColor('#147d8b'),spaceAfter=10))
flow=[]
def p(text,style='BodyText'):flow.append(Paragraph(html.escape(text),styles[style]))
def title(text):p(text,'Heading2')
mods=json.loads(Path('src/data/aula02-modules.json').read_text(encoding='utf-8'))
project=json.loads(Path('src/data/aula02-project.json').read_text(encoding='utf-8'))
p('INDÚSTRIA & DADOS · UNISENAI','EyebrowCustom');flow.append(Spacer(1,55));p('Aula 02','Title');p('Pandas e análise de dados industriais','Heading1');p('Caderno de estudo','Heading2');p('14 tópicos · quatro laboratórios · projeto S&M Industry em cinco etapas');flow.append(Spacer(1,24));p('Complemento didático ao PDF da disciplina Data Science e Big Data, do Prof. Me Daniel Vieira. Explicações e práticas deste guia foram preparadas para o ambiente de estudos; não substituem os slides originais.');p('Como estudar','Heading2');p('Leia o conceito, execute o código no notebook e responda à pergunta antes de consultar a revisão. O áudio no campus tem quatro trechos por tópico: ideia central, prática industrial, pergunta e revisão.');p('Bases utilizadas','Heading2');p('producao.csv, base_p52.csv, base_p54.csv e manutencao.csv são cópias locais fornecidas pelo usuário. Os resultados se referem a essas versões. Consulte proveniencia.json para os hashes.');flow.append(PageBreak())
p('Seu percurso','Heading1')
for m in mods:p(f'{m["id"]+1:02} · {m["title"]} — PDF {m["pages"]}')
title('Materiais e execução');p('Baixe o notebook e os quatro CSVs para a mesma pasta. Execute as células em ordem no Jupyter ou Google Colab. O navegador do campus apresenta código, mas não executa Python. Spark depende de instalação e Java compatível.');flow.append(PageBreak())
for m in mods:
 p(f'TÓPICO {m["id"]+1:02} · {m["category"].upper()} · PDF {m["pages"]}','EyebrowCustom');p(m['title'],'Heading1');title('O que você vai aprender');p(m['guide']['objective']);title(m['idea']);p(m['explain']);
 for sec in m['guide']['sections']:title(sec['title']);p(sec['text'])
 title('Conexão com a indústria');p(m['example']);flow.append(PageBreak())
 p(f'TÓPICO {m["id"]+1:02} · PRÁTICA E REVISÃO','EyebrowCustom');p('Experimente e explique','Heading1');title('Código de referência')
 # Wrap long lines for print without changing downloadable notebook code.
 import textwrap
 lines=[]
 for line in m['code'].splitlines():lines+=textwrap.wrap(line,width=90,replace_whitespace=False,drop_whitespace=False) or ['']
 flow.append(Preformatted('\n'.join(lines),styles['CodeCustom']))
 p('Trecho de referência: variáveis compartilhadas são preparadas no notebook. Use o notebook para copiar e executar o código completo.');title('Prática guiada')
 for i,step in enumerate(m['guide']['steps'],1):p(f'{i}. {step}')
 title('Resultado esperado');p(m['guide']['expected']);title('Pare e pense');p(m['question']);title('Resposta comentada');p(m['answer']);flow.append(Spacer(1,15));p(m['guide']['sourceNote']);flow.append(PageBreak())
p('Projeto industrial: roteiro de entrega','Heading1')
for i,step in enumerate(project['steps'],1):title(f'{i}. {step["title"]}');p(step['deliverable'])
flow.append(PageBreak());p('Critérios e fontes','Heading1');title('Avaliação do professor · slide 80')
for r in project['rubric']:p(f'{r["name"]}: {r["points"]} pontos')
p('Total: 100 pontos. O notebook deve conter as cinco etapas, gráficos, interpretações e recomendações. O campus não submete atividades.');title('Documentação técnica');p('Pandas: pandas.pydata.org/docs/getting_started/intro_tutorials/');p('Scikit-learn: scikit-learn.org/stable/common_pitfalls.html');p('PySpark: spark.apache.org/docs/latest/api/python/getting_started/quickstart_df.html');title('Limites da análise');p('Associação não demonstra causa. Classificar o rótulo atual não comprova previsão antecipada de parada. Duplicar dados cria volume sintético, não evidência nova. O notebook registra suas transformações e a estratégia de avaliação.')
def page_footer(canvas,doc):
 canvas.saveState();canvas.setFillColor(colors.HexColor('#d71932'));canvas.rect(0,doc.pagesize[1]-7,doc.pagesize[0],7,fill=1,stroke=0);canvas.setFont('Body',8);canvas.setFillColor(colors.HexColor('#51677a'));canvas.drawString(43,27,'Indústria & Dados · Aula 02 · Caderno de estudo');canvas.drawRightString(doc.pagesize[0]-43,27,str(doc.page));canvas.restoreState()
doc=SimpleDocTemplate(str(root/'Aula02_Caderno_Estudo.pdf'),pagesize=(595.28,841.89),rightMargin=43,leftMargin=43,topMargin=43,bottomMargin=49,title='Aula 02 — Pandas e análise de dados industriais',author='Indústria & Dados — complemento didático')
doc.build(flow,onFirstPage=page_footer,onLaterPages=page_footer)
print('Caderno PDF criado')
