import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock,
  Headphones,
  Layers3,
  FlaskConical,
  BrainCircuit,
} from "lucide-react";
import type { Module, StudyState } from "../types";
import { MiniScatter, ProgressRing } from "./Campus";

type Props = {
  modules: Module[];
  next: Module;
  study: StudyState;
  greeting: string;
  go: (page: string, id?: number) => void;
};

export default function HomeCampus({
  modules,
  next,
  study,
  greeting,
  go,
}: Props) {
  const progress = study.done.length / modules.length;
  return (
    <div className="campus-home">
      <div className="campus-welcome">
        <div>
          <span className="eyebrow">SEU ESPAÇO DE APRENDIZAGEM</span>
          <h1>
            {greeting}, Carlos<span>.</span>
          </h1>
        </div>
        <span className="welcome-note">
          <span className="status-dot" /> Uma nova perspectiva começa aqui
        </span>
      </div>

      <section className="campus-hero" aria-labelledby="campus-hero-title">
        <div className="campus-hero-copy">
          <div className="hero-edition">
            <span className="edition-mark">01</span>
            <span>
              DATA SCIENCE & BIG DATA
              <br />
              <strong>NA INDÚSTRIA</strong>
            </span>
          </div>
          <h2 id="campus-hero-title">
            Da curiosidade.
            <br />
            <em>À descoberta.</em>
          </h2>
          <p>
            Um novo olhar sobre os dados. Uma forma mais inteligente de entender
            a sua indústria.
          </p>
          <div className="campus-hero-actions">
            <button
              className="button primary"
              onClick={() => go("lesson", next.id)}
            >
              {study.done.length ? "Continuar aprendendo" : "Começar a jornada"}
              <ArrowUpRight size={18} />
            </button>
            <button className="hero-outline-link" onClick={() => go("course")}>
              Explorar a trilha
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="hero-source">
            <span /> ESTUDO GUIADO · PROF. ME DANIEL VIEIRA
          </div>
        </div>
        <div className="campus-hero-art">
          <img
            src="./assets/campus-sculpture.png"
            width="1536"
            height="1024"
            alt="Escultura de órbitas metálicas ao redor de um núcleo azul, simbolizando dados conectados e descoberta"
            fetchPriority="high"
          />
          <span className="art-caption">
            <span>FIG. 01</span> CONEXÕES GERAM CONHECIMENTO{" "}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </section>

      <div className="campus-facts" aria-label="Resumo da aula">
        <div>
          <strong>14</strong>
          <span>Módulos para explorar</span>
        </div>
        <div>
          <strong>02</strong>
          <span>Laboratórios interativos</span>
        </div>
        <div>
          <strong>63</strong>
          <span>Páginas de referência</span>
        </div>
        <div className="fact-progress">
          <ProgressRing value={progress} size={42} stroke={3} />
          <span>
            <strong>{study.done.length} de 14</strong>Módulos compreendidos
          </span>
        </div>
      </div>

      <div className="home-workspace">
        <section className="resume-card">
          <div className="resume-icon">
            <BookOpen size={23} />
          </div>
          <div className="resume-content">
            <span className="eyebrow">
              SEU PRÓXIMO PASSO · {String(next.id + 1).padStart(2, "0")}
            </span>
            <h2>{next.title}</h2>
            <p>{next.idea}</p>
            <span className="resume-time">
              <Clock size={13} /> {next.minutes} min sugeridos <span>·</span>{" "}
              {next.category}
            </span>
          </div>
          <button
            className="circle-action"
            aria-label={`Abrir módulo: ${next.title}`}
            onClick={() => go("lesson", next.id)}
          >
            <ArrowUpRight size={22} />
          </button>
        </section>
        <button className="listening-card" onClick={() => go("audio", next.id)}>
          <span className="listening-icon">
            <Headphones size={25} />
          </span>
          <div>
            <span className="eyebrow">APRENDA EM OUTRO RITMO</span>
            <h3>Dê voz às suas ideias.</h3>
            <p>Ouça a aula e acompanhe a explicação.</p>
          </div>
          <ArrowUpRight size={19} />
        </button>
      </div>

      <section className="home-discover">
        <div className="section-title">
          <div>
            <span className="eyebrow">APRENDER É EXPERIMENTAR</span>
            <h2>Explore. Questione. Conecte.</h2>
          </div>
          <button className="text-link" onClick={() => go("course")}>
            Ver todos os módulos
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="discovery-grid">
          <button
            className="discovery-card discovery-kdd"
            onClick={() => go("kdd")}
          >
            <header>
              <span className="discovery-index">01 / PROCESSO</span>
              <Layers3 size={19} />
            </header>
            <div className="discovery-visual kdd-line" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n}>{String(n).padStart(2, "0")}</span>
              ))}
            </div>
            <h3>
              Encontre o sentido
              <br />
              por trás dos dados.
            </h3>
            <p>Percorra as cinco etapas do KDD.</p>
            <footer>
              Explorar o processo
              <ArrowUpRight size={18} />
            </footer>
          </button>
          <button
            className="discovery-card discovery-lab"
            onClick={() => go("labs")}
          >
            <header>
              <span className="discovery-index">02 / LABORATÓRIO</span>
              <FlaskConical size={19} />
            </header>
            <div className="discovery-visual">
              <MiniScatter />
            </div>
            <h3>
              Uma relação.
              <br />
              Muitas perguntas.
            </h3>
            <p>Investigue temperatura, defeitos e energia.</p>
            <footer>
              Abrir os laboratórios
              <ArrowUpRight size={18} />
            </footer>
          </button>
          <button
            className="discovery-card discovery-review"
            onClick={() => go("review")}
          >
            <header>
              <span className="discovery-index">03 / REVISÃO</span>
              <BrainCircuit size={19} />
            </header>
            <div className="discovery-visual recall-visual" aria-hidden="true">
              <span>?</span>
              <i>!</i>
            </div>
            <h3>
              O que ficou
              <br />
              na sua memória?
            </h3>
            <p>Reconstrua as ideias com suas palavras.</p>
            <footer>
              Revisar os conceitos
              <ArrowUpRight size={18} />
            </footer>
          </button>
        </div>
      </section>
      <section className="home-curriculum">
        <div className="section-title">
          <div>
            <span className="eyebrow">A BASE DE TODA DESCOBERTA</span>
            <h2>Comece pelos fundamentos.</h2>
          </div>
          <span className="curriculum-label">AULA 01 / 14 MÓDULOS</span>
        </div>
        <div className="curriculum-list">
          {modules.slice(0, 4).map((m) => (
            <button key={m.id} onClick={() => go("lesson", m.id)}>
              <span className="curriculum-number">
                {String(m.id + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{m.title}</h3>
                <p>{m.idea}</p>
              </div>
              <span className="curriculum-duration">{m.minutes} min</span>
              <span
                className={`curriculum-state ${study.done.includes(m.id) ? "done" : ""}`}
              >
                {study.done.includes(m.id) ? "Compreendido" : "Explorar"}
              </span>
              <ArrowUpRight size={19} />
            </button>
          ))}
        </div>
      </section>
      <section className="campus-closing">
        <span className="eyebrow">DA TEORIA AO CHÃO DE FÁBRICA</span>
        <h2>
          Sua experiência é o ponto de partida.
          <br />
          <em>Os dados abrem o próximo caminho.</em>
        </h2>
        <button className="text-link" onClick={() => go("lesson", 12)}>
          Conectar com a minha rotina
          <ArrowUpRight size={17} />
        </button>
      </section>
    </div>
  );
}
