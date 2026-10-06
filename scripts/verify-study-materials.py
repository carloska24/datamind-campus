"""Execute every notebook cell and verify source data and exercise answers."""
import contextlib
import io
import json
from pathlib import Path
import pandas as pd

root=Path(__file__).resolve().parent.parent
notebook=json.loads((root/'public/materiais/Aula01_Laboratorio.ipynb').read_text(encoding='utf-8'))
namespace={}
count=0
with contextlib.redirect_stdout(io.StringIO()):
    for i,cell in enumerate(notebook['cells']):
        if cell['cell_type']=='code':
            exec(compile(''.join(cell['source']),f'cell-{i}','exec'),namespace)
            count+=1
df,m=namespace['df'],namespace['m']
expected_df=pd.DataFrame({'produto':['Motor A','Motor B','Motor A','Motor C','Motor B'],'producao':[100,120,110,90,130],'defeitos':[5,12,6,3,15],'temperatura':[70,82,73,68,85]})
pd.testing.assert_frame_equal(df[expected_df.columns],expected_df)
pd.testing.assert_frame_equal(m[['maquina','producao','energia']],pd.DataFrame({'maquina':list('ABCDE'),'producao':[1250,1380,1190,1450,1320],'energia':[420,465,390,510,405]}))
assert df['temperatura'].mean()==75.6
assert df['producao'].mean()==110
assert df['defeitos'].mean()==8.2
assert abs(df['temperatura'].corr(df['defeitos'])-0.995050505674452)<1e-12
assert abs(df['temperatura'].corr(df['taxa_defeitos'])-0.9948998223415372)<1e-12
assert df[df['temperatura']>75]['produto'].tolist()==['Motor B','Motor B']
assert df.groupby('produto')['producao'].mean().to_dict()=={'Motor A':105,'Motor B':125,'Motor C':90}
assert m['producao'].mean()==1318 and m['energia'].mean()==438
assert m.sort_values('producao',ascending=False)['maquina'].tolist()==list('DBEAC')
assert m.sort_values('eficiencia',ascending=False)['maquina'].tolist()==list('ECABD')
assert len(namespace['simulada'].dropna(subset=['temperatura']))==4
pd.testing.assert_frame_equal(namespace['df_lido'],df)
print(f'{count} code cells executed; original data, filters, correlations, rankings and CSV round-trip verified (Pandas {pd.__version__}).')
