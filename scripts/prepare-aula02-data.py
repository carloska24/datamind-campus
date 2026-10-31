import json,csv,math,hashlib,statistics
from pathlib import Path
from collections import defaultdict
root=Path('public/materiais/aula02')
def read(n):
 with (root/n).open(encoding='utf-8-sig') as f:return list(csv.DictReader(f))
def corr(x,y):
 a=statistics.mean(x);b=statistics.mean(y);return sum((u-a)*(v-b) for u,v in zip(x,y))/math.sqrt(sum((u-a)**2 for u in x)*sum((v-b)**2 for v in y))
def groups(rows,key,fields):
 g=defaultdict(list)
 for r in rows:g[r[key]].append(r)
 return [dict(grupo=k,registros=len(v),**{f:sum(float(r[f]) for r in v) for f in fields}) for k,v in sorted(g.items())]
p=read('producao.csv');v=read('base_p52.csv');s=read('base_p54.csv');m=read('manutencao.csv')
pg=groups(p,'turno',['pecas_produzidas','pecas_defeituosas'])
for g in pg:g['media']=g['pecas_produzidas']/g['registros'];g['taxa']=100*g['pecas_defeituosas']/g['pecas_produzidas']
for r in v:r['mes']=r['data'][:7]
for r in s:r['ano']=r['mes'][:4]
vg=groups(v,'mes',['quantidade_viagens','distancia_total_km']);sg=groups(s,'ano',['unidades_vendidas','faturamento_rs'])
unique={tuple(r.items()):r for r in m};clean=list(unique.values());mg=groups(clean,'maquina_id',['falha'])
for g in mg:g['taxa']=g['falha']/g['registros']*100
machines=[dict(maquina='Máquina '+n,producao=a,energia_kwh=b,eficiencia=a/b) for n,a,b in zip('ABCDE',[1250,1380,1190,1450,1320],[420,465,390,510,405])]
result=dict(producao=dict(rows=pg,total=sum(int(r['pecas_produzidas']) for r in p),correlacao=corr([float(r['pecas_produzidas']) for r in p],[float(r['pecas_defeituosas']) for r in p])),maquinas=machines,viagens=dict(rows=vg,total=sum(int(r['quantidade_viagens']) for r in v),media=statistics.mean(int(r['quantidade_viagens']) for r in v),maior_dia=max(v,key=lambda r:int(r['quantidade_viagens'])),correlacao=corr([float(r['quantidade_viagens']) for r in v],[float(r['distancia_total_km']) for r in v])),vendas=dict(rows=sg,total_unidades=sum(int(r['unidades_vendidas']) for r in s),total_faturamento=sum(float(r['faturamento_rs']) for r in s),maior_mes=max(s,key=lambda r:float(r['faturamento_rs'])),correlacao=corr([float(r['preco_unitario_rs']) for r in s],[float(r['unidades_vendidas']) for r in s])),manutencao=dict(brutos=len(m),duplicatas=len(m)-len(clean),tratados=len(clean),atributos=len(m[0]),ausentes={k:sum(r[k]=='' for r in m) for k in m[0]},rows=mg,total_falhas=sum(int(r['falha']) for r in clean)))
Path('src/data/aula02-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest={f.name:dict(sha256=hashlib.sha256(f.read_bytes()).hexdigest(),bytes=f.stat().st_size,origem='Pasta local Aula02/dados fornecida pelo usuário; correspondência com links externos ainda não verificada') for f in root.glob('*.csv')}
(root/'proveniencia.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False)[:1800])
