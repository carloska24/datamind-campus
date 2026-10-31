import { Aula02TopicArt } from "./Aula02Artwork";
import { useCourse } from "../course-context";
import aula02Figures from "../data/aula02-figures.json";
import { useId, useRef } from "react";
import { Expand, X } from "lucide-react";
import type { CSSProperties } from "react";
import figures from "../../public/course-art/source/module-figures.json";

// The portable build embeds these public paths as data URLs.
function asset(file: string) {
  return file.startsWith("data:") ? file : `.${file}`;
}
export function FactoryArt({ compact = false }: { compact?: boolean }) {
  return (
    <img
      className={`factory-art course-factory-art ${compact ? "compact" : ""}`}
      src={asset("/course-art/generated/hero-industria.png")}
      alt="Ilustração de motor industrial azul, proteção de acoplamento laranja e máquina CNC em um ambiente de análise de dados."
      width={1672}
      height={941}
    />
  );
}
const covers = [
  {
    file: "/course-art/generated/dados-conhecimento.png",
    generated: true,
    position: "50% 50%",
    alt: "Ilustração de dados industriais, estação de análise e conhecimento representado por uma lâmpada.",
  },
  {
    file: "/course-art/generated/dados-maquina.png",
    generated: true,
    position: "50% 50%",
    alt: "Bancada industrial com motor, sensores e aquisição de dados.",
  },
  {
    file: "/course-art/generated/modelos-dados.png",
    generated: true,
    position: "50% 50%",
    alt: "Ilustração de agrupamentos, árvore de decisão e rede de nós em um laboratório industrial.",
  },
  {
    file: "/course-art/source/page-20-Image28.jpg",
    position: "50% 0%",
    alt: "Infraestrutura, modelos e análise: detalhe dos papéis na área de dados.",
  },
  {
    file: "/course-art/source/page-14-Image23.jpg",
    position: "50% 48%",
    alt: "Fábrica e fontes de dados industriais: detalhe da figura original da aula.",
  },
  {
    file: "/course-art/source/page-28-Image35.jpg",
    position: "50% 50%",
    alt: "Preparação e análise de dados em um notebook, fotografia da aula.",
  },
  {
    file: "/course-art/generated/tabelas-analise.png",
    generated: true,
    position: "50% 50%",
    alt: "Ilustração de organização de variáveis e tabelas em uma bancada industrial.",
  },
  {
    file: "/course-art/generated/modelos-dados.png",
    generated: true,
    position: "100% 50%",
    scale: 1.2,
    alt: "Ilustração de árvores e redes como representações de modelos de análise.",
  },
  {
    file: "/course-art/source/page-35-Image49.jpg",
    contain: true,
    alt: "Logo original da biblioteca Pandas apresentado no material.",
  },
  {
    file: "/course-art/generated/tabelas-analise.png",
    generated: true,
    position: "100% 50%",
    scale: 1.2,
    alt: "Ilustração de linhas agrupadas em tabelas para análise de dados.",
  },
  {
    file: "/course-art/source/page-16-Image24.jpg",
    position: "68% 50%",
    alt: "Motor industrial e sinais de corrente, temperatura e vibração.",
  },
  {
    file: "/course-art/generated/hero-industria.png",
    generated: true,
    position: "70% 50%",
    alt: "Ilustração de equipamentos industriais para estudo de produção e consumo de energia.",
  },
  {
    file: "/course-art/source/page-24-Image31.jpg",
    position: "0% 50%",
    alt: "Da máquina à decisão: cadeia de análise industrial da aula.",
  },
  {
    file: "/course-art/generated/dados-conhecimento.png",
    generated: true,
    position: "100% 50%",
    scale: 1.2,
    alt: "Ilustração do conhecimento gerado pela análise dos dados: monitor, lupa e lâmpada.",
  },
];
export function TopicArt({
  moduleId,
  lesson = false,
}: {
  moduleId: number;
  lesson?: boolean;
}) {
  const course = useCourse();
  if (course.number === "02")
    return <Aula02TopicArt moduleId={moduleId} lesson={lesson} />;
  const cover = covers[moduleId] ?? covers[0];
  return (
    <div
      className={`topic-art course-topic-art ${cover.contain ? "contain" : ""} ${lesson ? "lesson-topic-art" : ""}`}
    >
      <img
        src={asset(cover.file)}
        alt={cover.alt}
        loading="lazy"
        decoding="async"
        style={{
          objectPosition: "50% 50%",
          transform: "none",
        }}
      />
      <span className="course-cover-origin">
        {cover.generated ? "Ilustração" : "Material da aula"}
      </span>
    </div>
  );
}
export function CourseFigure({ moduleId }: { moduleId: number }) {
  const course = useCourse();
  const sourceFigures = course.number === "02" ? aula02Figures : figures;
  const figure = sourceFigures.find((entry) => entry.moduleId === moduleId);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  if (!figure) return null;
  return (
    <figure className="course-figure panel">
      <figcaption>
        <span className="eyebrow">
          FIGURA ORIGINAL DA AULA · PÁGINA {figure.page}
        </span>
        <h3>{figure.caption}</h3>
      </figcaption>
      <button
        className="course-figure-open"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Ampliar figura: ${figure.caption}`}
      >
        <img
          src={asset(figure.file)}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          loading="lazy"
        />
        <span>
          <Expand size={16} /> Ampliar figura
        </span>
      </button>
      <p className="small-text">{figure.note}</p>
      <small>
        Fonte: Aula {course.number} · Data Science e Big Data na Indústria ·
        Prof. Me Daniel Vieira.
      </small>
      <dialog
        className="course-figure-dialog"
        ref={dialog}
        aria-labelledby={id}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="course-figure-dialog-heading">
          <div>
            <span className="eyebrow">PDF · PÁGINA {figure.page}</span>
            <h2 id={id}>{figure.caption}</h2>
          </div>
          <button
            className="icon-button"
            autoFocus
            aria-label="Fechar figura ampliada"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <div
          className="course-figure-scroll"
          style={{ "--figure-width": `${figure.width}px` } as CSSProperties}
        >
          <img
            src={asset(figure.file)}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
          />
        </div>
        <p className="course-figure-scroll-hint">
          Deslize a figura para ver todos os detalhes.
        </p>
        <p>{figure.note}</p>
      </dialog>
    </figure>
  );
}
