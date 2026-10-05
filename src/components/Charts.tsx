import { useState } from "react";
import datasets from "../data/datasets.json";
export const productColor: Record<string, string> = {
  "Motor A": "#8b6cff",
  "Motor B": "#fbbf24",
  "Motor C": "#34d399",
};
export const number = (n: number, d = 2) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: d });
export function correlation(xs: number[], ys: number[]) {
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length,
    my = ys.reduce((a, b) => a + b, 0) / ys.length;
  return (
    xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) /
    Math.sqrt(
      xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
        ys.reduce((s, y) => s + (y - my) ** 2, 0),
    )
  );
}
export function Scatter({
  metric = "defeitos",
  product = "Todos",
}: {
  metric?: "defeitos" | "taxa_defeitos";
  product?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const rows = datasets.df;
  const max = metric === "defeitos" ? 16 : 12;
  const x = (t: number) => 70 + ((t - 67) / 19) * 460,
    y = (n: number) => 224 - (n / max) * 170;
  return (
    <div>
      <svg
        viewBox="0 0 590 288"
        className="scatter"
        role="img"
        aria-label="Temperatura e defeitos nos cinco registros da aula. Selecionar um ponto exibe os seus dados."
      >
        {[0, max / 4, max / 2, (max * 3) / 4, max].map((n) => (
          <g key={n}>
            <path d={`M70 ${y(n)}H545`} className="grid-line" />
            <text x="55" y={y(n) + 4} textAnchor="end">
              {n}
            </text>
          </g>
        ))}
        {[68, 73, 78, 85].map((n) => (
          <text key={n} x={x(n)} y="249" textAnchor="middle">
            {n}
          </text>
        ))}
        <text x="300" y="278" textAnchor="middle">
          Temperatura · unidade não indicada no slide
        </text>
        <text x="70" y="25">
          {metric === "defeitos"
            ? "Contagem de defeitos"
            : "Ocorrências por 100 peças"}
        </text>
        {rows.map((r, i) => (
          <g
            key={i}
            opacity={product === "Todos" || r.produto === product ? 1 : 0.16}
          >
            <circle
              tabIndex={0}
              role="button"
              aria-label={`${r.produto}, temperatura ${r.temperatura}, ${metric} ${number(r[metric])}`}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(i);
                }
              }}
              cx={x(r.temperatura)}
              cy={y(r[metric])}
              r={selected === i ? 11 : 8}
              fill={productColor[r.produto]}
              color={productColor[r.produto]}
              stroke={selected === i ? "#fff" : "none"}
              strokeWidth={2}
            >
              <title>
                {r.produto}: {r.temperatura}, {number(r[metric])}
              </title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="legend">
        <span>
          <i style={{ background: productColor["Motor A"], color: productColor["Motor A"] }} />
          Motor A
        </span>
        <span>
          <i style={{ background: productColor["Motor B"], color: productColor["Motor B"] }} />
          Motor B
        </span>
        <span>
          <i style={{ background: productColor["Motor C"], color: productColor["Motor C"] }} />
          Motor C
        </span>
      </div>
      <p className="chart-tip" aria-live="polite">
        {selected === null
          ? "Clique em um ponto para inspecionar o registro."
          : `${rows[selected].produto} · produção ${rows[selected].producao} · temperatura ${rows[selected].temperatura} · defeitos ${rows[selected].defeitos} · taxa ${number(rows[selected].taxa_defeitos)} por 100 peças`}
      </p>
    </div>
  );
}
export function MachineBars({
  metric,
}: {
  metric: "producao" | "energia" | "eficiencia";
}) {
  const rows = [...datasets.m].sort((a, b) => b[metric] - a[metric]);
  const max = Math.max(...rows.map((r) => r[metric]));
  return (
    <div className="machine-bars" aria-label="Ranking de máquinas">
      {rows.map((r, i) => (
        <div className="machine-bar" key={r.maquina}>
          <span>Máquina {r.maquina}</span>
          <div className="bar-track">
            <div
              style={{
                width: `${(r[metric] / max) * 100}%`,
                background: i === 0 ? "var(--grad)" : "var(--bar-muted)",
                animationDelay: `${i * 0.08}s`,
              }}
            />
          </div>
          <strong>
            {number(r[metric], metric === "eficiencia" ? 4 : 0)}
            <small>
              {metric === "producao"
                ? " peças"
                : metric === "energia"
                  ? " kWh"
                  : " peças/kWh"}
            </small>
          </strong>
        </div>
      ))}
    </div>
  );
}
