import { ArrowRight, FolderOpen, NotebookPen } from "lucide-react";
import { FactoryArt, TopicArt } from "./Illustrations";
import type { Page } from "../navigation";
import { course } from "../data/course";

type Props = {
  catalog: boolean;
  name: string;
  completed: number;
  total: number;
  resumeLabel: string;
  onResume: () => void;
  onNavigate: (page: Page) => void;
};

export default function CampusOverview({
  catalog,
  name,
  completed,
  total,
  resumeLabel,
  onResume,
  onNavigate,
}: Props) {
  return (
    <div className="campus-overview">
      <header className="campus-heading">
        <span className="eyebrow">UNISENAI · INDÚSTRIA & DADOS</span>
        <h1>{catalog ? "Suas aulas" : `Seu próximo passo, ${name}.`}</h1>
        <p>
          Um espaço para aprender, experimentar e conectar dados à indústria.
        </p>
      </header>
      {!catalog && (
        <section className="campus-resume" aria-labelledby="resume-title">
          <div>
            <span className="eyebrow">CONTINUE SUA JORNADA · AULA 01</span>
            <h2 id="resume-title">{resumeLabel}</h2>
            <p>
              {completed} de {total} tópicos compreendidos. Aprenda no seu
              ritmo.
            </p>
            <button className="button primary" onClick={onResume}>
              {completed === total ? "Revisar aula" : "Continuar estudando"}
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="campus-progress-number">
            <strong>
              {Math.round((completed / total) * 100)}
              <small>%</small>
            </strong>
            <span>da Aula 01</span>
          </div>
        </section>
      )}
      <section aria-labelledby="catalog-title">
        <header className="section-title">
          <h2 id="catalog-title">Aulas da disciplina</h2>
          <span>1 aula disponível</span>
        </header>
        <div className="campus-catalog">
          <article className="campus-course-card">
            <div className="course-cover">
              <span>AULA {course.number}</span>
              <FactoryArt />
              <div className="cover-caption">
                <strong>Onde a indústria encontra os dados.</strong>
                <small>
                  Explore conceitos. Investigue processos. Transforme decisões.
                </small>
              </div>
              <small>FUNDAMENTOS + PRÁTICA</small>
            </div>
            <div className="course-card-body">
              <span className="eyebrow">DISPONÍVEL PARA ESTUDAR</span>
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              <ul className="course-card-meta">
                <li>{total} tópicos</li>
                <li>2 laboratórios</li>
                <li>PDF e áudio</li>
              </ul>
              <progress
                aria-label="Progresso na Aula 01"
                value={completed}
                max={total}
              />
              <footer>
                <small>
                  {completed} de {total} compreendidos
                </small>
                <button
                  className="button primary"
                  onClick={() => onNavigate("course")}
                >
                  Explorar aula
                  <ArrowRight size={16} />
                </button>
              </footer>
            </div>
          </article>
          <aside className="campus-upcoming">
            <div className="upcoming-art">
              <TopicArt moduleId={2} />
            </div>
            <span className="eyebrow">EM PREPARAÇÃO</span>
            <h2>
              Novas aulas.
              <br />
              Novas conexões.
            </h2>
            <p>
              O campus está crescendo. A Aula 02 aparecerá aqui quando o
              material estiver disponível.
            </p>
            <span className="tag">Próxima aula · em breve</span>
          </aside>
        </div>
      </section>
      {!catalog && (
        <section className="campus-shortcuts" aria-label="Seus recursos">
          <button onClick={() => onNavigate("notes")}>
            <NotebookPen />
            <span>
              <strong>Seu caderno</strong>
              <small>Retome suas ideias e anotações</small>
            </span>
            <ArrowRight />
          </button>
          <button onClick={() => onNavigate("resources")}>
            <FolderOpen />
            <span>
              <strong>Biblioteca</strong>
              <small>Consulte os materiais da Aula 01</small>
            </span>
            <ArrowRight />
          </button>
        </section>
      )}
    </div>
  );
}
