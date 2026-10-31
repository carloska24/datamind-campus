import { Aula02SourcePanel } from "./Aula02Artwork";
import results from "../data/aula02-results.json";
import project from "../data/aula02-project.json";
import { CodeBlock } from "./Campus";

export default function Aula02Project({
  step,
  onStep,
}: {
  step: number;
  onStep: (n: number) => void;
}) {
  const current = project.steps[step] ?? project.steps[0];
  const d = results.manutencao;
  return (
    <section className="aula02-workspace">
      <header className="page-heading">
        <span className="eyebrow">AULA 02 · PROJETO INDUSTRIAL</span>
        <h1>S&M Industry</h1>
        <p>
          Investigue condições associadas às falhas de cinco máquinas. Um
          percurso em cinco etapas, baseado nas páginas 57–80.
        </p>
      </header>
      <Aula02SourcePanel
        moduleId={step < 2 ? 12 : 13}
        variant={
          step === 2 ? "classificacao" : step === 4 ? "spark" : undefined
        }
        caption={
          step < 2
            ? "Equipamentos do caso, perguntas que podem ser investigadas"
            : "Dos perfis de operação às decisões de manutenção"
        }
      />
      <div className="a2-project-stats">
        <article>
          <strong>{d.brutos.toLocaleString("pt-BR")}</strong>
          <span>registros brutos</span>
        </article>
        <article>
          <strong>{d.duplicatas}</strong>
          <span>duplicatas exatas</span>
        </article>
        <article>
          <strong>{d.tratados.toLocaleString("pt-BR")}</strong>
          <span>após deduplicação</span>
        </article>
        <article>
          <strong>{d.atributos}</strong>
          <span>atributos</span>
        </article>
      </div>
      <nav className="lesson-tools" aria-label="Etapas do projeto S&M">
        {project.steps.map((s, i) => (
          <button
            key={s.title}
            aria-current={i === step ? "step" : undefined}
            className={i === step ? "active" : ""}
            onClick={() => onStep(i)}
          >
            {i + 1}. {s.short}
          </button>
        ))}
      </nav>
      <article className="panel a2-lab-panel">
        <span className="eyebrow">
          ETAPA {step + 1} · PDF {current.pages}
        </span>
        <h2>{current.title}</h2>
        <p>{current.objective}</p>
        <h3>Perguntas que orientam o trabalho</h3>
        <ol className="a2-project-questions">
          {current.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <h3>Como começar no notebook</h3>
        <CodeBlock code={current.code} />
        <div className="industrial-example">
          <strong>O que entregar nesta etapa</strong>
          <p>{current.deliverable}</p>
        </div>
        <p className="small-text">{current.caution}</p>
      </article>
      {step < 2 && (
        <section className="panel a2-lab-panel">
          <h2>Diagnóstico da base local</h2>
          <p>
            {d.total_falhas} registros com falha entre {d.tratados} registros
            após remover somente duplicatas exatas. A taxa representa registros,
            não episódios independentes de parada.
          </p>
          <div className="a2-table-wrap">
            <table>
              <caption>Ausências na base bruta</caption>
              <thead>
                <tr>
                  <th scope="col">Atributo</th>
                  <th scope="col">Ausentes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(d.ausentes).map(([name, n]) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    <td>{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table>
              <caption>Falhas por máquina após deduplicação</caption>
              <thead>
                <tr>
                  <th scope="col">Máquina</th>
                  <th scope="col">Registros</th>
                  <th scope="col">Com falha</th>
                  <th scope="col">Taxa (%)</th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map((r) => (
                  <tr key={r.grupo}>
                    <th scope="row">{r.grupo}</th>
                    <td>{r.registros}</td>
                    <td>{r.falha}</td>
                    <td>{r.taxa.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="panel a2-lab-panel">
        <h2>Entrega e critérios do professor</h2>
        <p>
          Notebook Google Colab com as cinco etapas, códigos, gráficos,
          interpretações e recomendações. Inclua descobertas, modelo escolhido,
          limitações e possíveis ações de manutenção. O campus não submete
          atividades.
        </p>
        <div className="a2-table-wrap">
          <table>
            <caption>Avaliação · slide 80 · total de 100 pontos</caption>
            <thead>
              <tr>
                <th scope="col">Critério</th>
                <th scope="col">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {project.rubric.map((r) => (
                <tr key={r.name}>
                  <th scope="row">{r.name}</th>
                  <td>{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Use o caderno dos tópicos 13 e 14 para suas hipóteses e decisões. O
          notebook contém células para desenvolver cada etapa e executar a
          análise.
        </p>
      </section>
    </section>
  );
}
