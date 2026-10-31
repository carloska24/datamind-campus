import { Aula02SourcePanel } from "./Aula02Artwork";
import { useState } from "react";
import results from "../data/aula02-results.json";

const fmt = (n: number, digits = 2) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
const labs = [
  "Produção e qualidade",
  "Eficiência energética",
  "Viagens e distância",
  "Vendas e faturamento",
];

export default function Aula02Labs({
  lab,
  onLab,
}: {
  lab: number;
  onLab: (n: number) => void;
}) {
  const [metric, setMetric] = useState("volume");
  const [descending, setDescending] = useState(true);
  const p = results.producao,
    v = results.viagens,
    s = results.vendas;
  const series =
    lab === 0
      ? p.rows.map((r) => ({
          label: r.grupo,
          value: metric === "taxa" ? r.taxa : r.pecas_produzidas,
        }))
      : lab === 1
        ? results.maquinas.map((r) => ({
            label: r.maquina,
            value: metric === "taxa" ? r.eficiencia : r.producao,
          }))
        : lab === 2
          ? v.rows.map((r) => ({ label: r.grupo, value: r.quantidade_viagens }))
          : s.rows.map((r) => ({ label: r.grupo, value: r.faturamento_rs }));
  const unit =
    lab === 0
      ? metric === "taxa"
        ? "% de peças defeituosas"
        : "peças produzidas"
      : lab === 1
        ? metric === "taxa"
          ? "peças/kWh"
          : "peças/turno"
        : lab === 2
          ? "viagens por mês"
          : "R$ por ano";
  const ordered = [...series].sort((a, b) =>
    descending ? b.value - a.value : a.value - b.value,
  );
  const peak = Math.max(...series.map((r) => r.value));
  return (
    <section className="aula02-workspace" aria-labelledby="labs-heading">
      <header className="page-heading">
        <span className="eyebrow">AULA 02 · EXPERIMENTE COM DADOS</span>
        <h1 id="labs-heading">Do cálculo à interpretação</h1>
        <p>
          Explore os resultados das bases locais e reproduza os cálculos no
          notebook.
        </p>
      </header>
      <nav className="lesson-tools" aria-label="Laboratórios da Aula 02">
        {labs.map((title, i) => (
          <button
            key={title}
            aria-current={lab === i ? "page" : undefined}
            className={lab === i ? "active" : ""}
            onClick={() => {
              setMetric("volume");
              onLab(i);
            }}
          >
            {title}
          </button>
        ))}
      </nav>
      <Aula02SourcePanel
        moduleId={[9, 10, 11, 7][lab]}
        variant={lab === 2 ? "viagens" : lab === 3 ? "vendas" : undefined}
        caption={
          [
            "Compare o gráfico do material com seus cálculos",
            "Qual critério define a máquina mais eficiente?",
            "Toda comparação tem uma janela de tempo",
            "Preço, quantidade e faturamento se conectam",
          ][lab]
        }
      />
      <article className="panel a2-lab-panel">
        <span className="eyebrow">
          {lab === 0
            ? "EXEMPLO · PDF 35–48 E 51"
            : lab === 1
              ? "EXERCÍCIO 1 · PDF 49–50"
              : lab === 2
                ? "EXERCÍCIO 2 · PDF 52–53"
                : "EXERCÍCIO 3 · PDF 54–55"}
        </span>
        <h2>{labs[lab]}</h2>
        <p>
          {lab === 0
            ? "Quem produz mais também apresenta a maior taxa de defeitos? Compare as duas métricas e observe o denominador."
            : lab === 1
              ? "Compare produção e peças por kWh: o maior volume não garante a melhor eficiência."
              : lab === 2
                ? "Compare meses lembrando que abril tem apenas dez dias na base fornecida. Os totais não representam períodos de igual duração."
                : "Compare faturamento anual considerando que o último ano tem cobertura parcial. Preço, volume e tempo podem variar juntos."}
        </p>
        <div className="a2-controls">
          {lab < 2 && (
            <label>
              Métrica
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              >
                <option value="volume">Produção</option>
                <option value="taxa">
                  {lab === 0 ? "Taxa de defeitos" : "Eficiência energética"}
                </option>
              </select>
            </label>
          )}
          <label>
            Ordenação
            <select
              value={descending ? "desc" : "asc"}
              onChange={(e) => setDescending(e.target.value === "desc")}
            >
              <option value="desc">Maior para menor</option>
              <option value="asc">Menor para maior</option>
            </select>
          </label>
        </div>
        <figure className="a2-bars">
          <figcaption>{unit} · valores também disponíveis na tabela</figcaption>
          <ul>
            {ordered.map((r) => (
              <li key={r.label}>
                <span>{r.label}</span>
                <div aria-hidden="true">
                  <i style={{ width: `${(r.value / peak) * 100}%` }} />
                </div>
                <strong>{fmt(r.value)}</strong>
              </li>
            ))}
          </ul>
        </figure>
        <div className="a2-table-wrap">
          <table>
            <caption>{labs[lab]} · base usada no cálculo</caption>
            <thead>
              <tr>
                {(lab === 0
                  ? [
                      "Turno",
                      "Registros",
                      "Produzidas",
                      "Defeituosas",
                      "Média/registro",
                      "Taxa (%)",
                    ]
                  : lab === 1
                    ? ["Máquina", "Peças/turno", "kWh/turno", "Peças/kWh"]
                    : lab === 2
                      ? ["Mês", "Dias", "Viagens", "Distância (km)"]
                      : ["Ano", "Meses", "Unidades", "Faturamento (R$)"]
                ).map((h) => (
                  <th scope="col" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lab === 0
                ? p.rows.map((r) => (
                    <tr key={r.grupo}>
                      <th scope="row">{r.grupo}</th>
                      <td>{r.registros}</td>
                      <td>{fmt(r.pecas_produzidas)}</td>
                      <td>{fmt(r.pecas_defeituosas)}</td>
                      <td>{fmt(r.media)}</td>
                      <td>{fmt(r.taxa, 3)}</td>
                    </tr>
                  ))
                : lab === 1
                  ? results.maquinas.map((r) => (
                      <tr key={r.maquina}>
                        <th scope="row">{r.maquina}</th>
                        <td>{fmt(r.producao)}</td>
                        <td>{r.energia_kwh}</td>
                        <td>{fmt(r.eficiencia, 3)}</td>
                      </tr>
                    ))
                  : lab === 2
                    ? v.rows.map((r) => (
                        <tr key={r.grupo}>
                          <th scope="row">{r.grupo}</th>
                          <td>{r.registros}</td>
                          <td>{r.quantidade_viagens}</td>
                          <td>{fmt(r.distancia_total_km)}</td>
                        </tr>
                      ))
                    : s.rows.map((r) => (
                        <tr key={r.grupo}>
                          <th scope="row">{r.grupo}</th>
                          <td>{r.registros}</td>
                          <td>{r.unidades_vendidas}</td>
                          <td>{fmt(r.faturamento_rs)}</td>
                        </tr>
                      ))}
            </tbody>
          </table>
        </div>
      </article>
      <section className="panel lesson-practice">
        <span className="eyebrow">TENTE ANTES DE CONFERIR</span>
        <h2>Perguntas e resolução</h2>
        <ol>
          {(lab === 0
            ? [
                "Qual foi o total produzido?",
                "Qual turno teve a maior produção total?",
                "Qual a média por registro em cada turno?",
                "Qual turno teve a maior taxa de defeitos?",
                "Como interpretar a correlação entre produção e defeitos?",
              ]
            : lab === 1
              ? [
                  "Qual máquina produziu mais e qual consumiu menos energia?",
                  "Quais foram as médias de produção e consumo?",
                  "Qual é o ranking de produção?",
                  "Como calcular eficiência e qual máquina foi mais eficiente?",
                ]
              : lab === 2
                ? [
                    "Quantas viagens foram realizadas?",
                    "Qual dia teve mais viagens?",
                    "Qual foi a média diária?",
                    "Qual mês teve mais viagens?",
                    "Qual a correlação entre viagens e distância?",
                  ]
                : [
                    "Quantas unidades foram vendidas?",
                    "Qual mês teve maior faturamento?",
                    "Qual foi o faturamento total?",
                    "Qual ano teve mais unidades vendidas?",
                    "Qual a correlação entre preço e quantidade?",
                  ]
          ).map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <details key={lab}>
          <summary>Conferir resultados e interpretação</summary>
          {lab === 0 ? (
            <p>
              Total: <strong>{fmt(p.total)} peças</strong>. Manhã lidera em
              produção e taxa de defeitos. As médias e taxas estão na tabela.
              Correlação produção/defeitos: {fmt(p.correlacao, 4)}; associação
              não demonstra pior qualidade nem causalidade.
            </p>
          ) : lab === 1 ? (
            <p>
              Maior produção: D (1.450). Menor consumo: C (390 kWh). Médias:
              1.318 peças/turno e 438 kWh/turno. Ranking: D, B, E, A, C.
              Eficiência = produção/energia; E lidera com{" "}
              {fmt(results.maquinas[4].eficiencia, 3)} peças/kWh.
            </p>
          ) : lab === 2 ? (
            <p>
              Total: {fmt(v.total)} viagens. Maior dia: {v.maior_dia.data}, com{" "}
              {v.maior_dia.quantidade_viagens} viagens. Média: {fmt(v.media)}{" "}
              viagens/dia observado. Maior mês:{" "}
              {
                v.rows.reduce((a, b) =>
                  a.quantidade_viagens > b.quantidade_viagens ? a : b,
                ).grupo
              }
              . Correlação: {fmt(v.correlacao, 4)}. O total mensal depende da
              cobertura do período.
            </p>
          ) : (
            <p>
              Total: {fmt(s.total_unidades)} unidades; faturamento de R${" "}
              {fmt(s.total_faturamento)}. Maior mês: {s.maior_mes.mes}, R${" "}
              {fmt(Number(s.maior_mes.faturamento_rs))}. Maior ano em unidades:{" "}
              {
                s.rows.reduce((a, b) =>
                  a.unidades_vendidas > b.unidades_vendidas ? a : b,
                ).grupo
              }
              . Correlação preço/quantidade: {fmt(s.correlacao, 4)}. Tendência
              temporal e outros fatores impedem concluir um efeito causal do
              preço.
            </p>
          )}
        </details>
      </section>
      <p className="small-text">
        Fonte: PDF da Aula 02 e arquivos locais da pasta Aula02/dados fornecida
        pelo usuário. Resultados calculados dessas cópias; versões externas
        podem diferir. No campus você explora os indicadores; execute Python no
        notebook disponível em Materiais.
      </p>
    </section>
  );
}
