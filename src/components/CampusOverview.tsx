import { Aula02Cover } from "./Aula02Artwork";
import { ArrowRight, FolderOpen, NotebookPen } from "lucide-react";
import { FactoryArt, TopicArt } from "./Illustrations";
import type { Page } from "../navigation";
import { course as firstCourse, secondCourse } from "../data/course";

type Props = {
  catalog: boolean;
  course: typeof firstCourse | typeof secondCourse;
  completedByCourse: Record<string, number>;
  onSelectCourse: (id: string) => void;
  name: string;
  completed: number;
  total: number;
  resumeLabel: string;
  onResume: () => void;
  onNavigate: (page: Page) => void;
};

export default function CampusOverview({
  catalog,
  course: activeCourse,
  completedByCourse,
  onSelectCourse,
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
            <span className="eyebrow">
              CONTINUE SUA JORNADA · AULA {activeCourse.number}
            </span>
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
            <span>da Aula {activeCourse.number}</span>
          </div>
        </section>
      )}
      <section aria-labelledby="catalog-title">
        <header className="section-title">
          <h2 id="catalog-title">Aulas da disciplina</h2>
          <span>2 aulas disponíveis</span>
        </header>
        <div className="campus-catalog">
          {[firstCourse, secondCourse].map((course) => {
            const completed = completedByCourse[course.number] ?? 0;
            return (
              <article
                className={`campus-course-card ${course.number === "02" ? "a2-catalog-card" : ""}`}
                key={course.id}
              >
                <div className="course-cover">
                  <span>AULA {course.number}</span>
                  {course.number === "01" ? <FactoryArt /> : <Aula02Cover />}
                  <div className="cover-caption">
                    <strong>
                      {course.number === "02"
                        ? "Transforme tabelas em respostas."
                        : "Onde a indústria encontra os dados."}
                    </strong>
                    <small>
                      Explore conceitos. Investigue processos. Transforme
                      decisões.
                    </small>
                  </div>
                  <small>
                    {course.number === "02"
                      ? "PANDAS + PROJETO"
                      : "FUNDAMENTOS + PRÁTICA"}
                  </small>
                </div>
                <div className="course-card-body">
                  <span className="eyebrow">DISPONÍVEL PARA ESTUDAR</span>
                  <h2>{course.title}</h2>
                  <p>{course.description}</p>
                  <ul className="course-card-meta">
                    <li>{total} tópicos</li>
                    <li>{course.number === "02" ? "4" : "2"} laboratórios</li>
                    <li>PDF e áudio</li>
                  </ul>
                  <progress
                    aria-label={`Progresso na Aula ${course.number}`}
                    value={completed}
                    max={total}
                  />
                  <footer>
                    <small>
                      {completed} de {total} compreendidos
                    </small>
                    <button
                      className="button primary"
                      onClick={() =>
                        onSelectCourse(
                          course.number === "02" ? "aula02" : "aula01",
                        )
                      }
                    >
                      Explorar aula
                      <ArrowRight size={16} />
                    </button>
                  </footer>
                </div>
              </article>
            );
          })}
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
              <small>Consulte PDFs, bases e notebooks</small>
            </span>
            <ArrowRight />
          </button>
        </section>
      )}
    </div>
  );
}
