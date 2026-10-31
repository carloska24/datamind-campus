import extraArtwork from "../data/aula02-extra-artwork.json";
import artwork from "../data/aula02-artwork.json";
import {
  ArrowRight,
  FileSpreadsheet,
  FlaskConical,
  Wrench,
} from "lucide-react";
import type { Page } from "../navigation";

export function courseAsset(file: string) {
  return file.startsWith("data:") ? file : `.${file}`;
}

/** Curated source art, displayed whole so chart axes and diagrams stay meaningful. */
export function Aula02TopicArt({
  moduleId,
  lesson = false,
}: {
  moduleId: number;
  lesson?: boolean;
}) {
  const art = artwork[moduleId] ?? artwork[0];
  return (
    <div
      className={`topic-art course-topic-art a2-topic-art a2-art-${art.kind} ${lesson ? "lesson-topic-art" : ""}`}
    >
      <img
        src={courseAsset(art.file)}
        alt={art.alt}
        loading="lazy"
        decoding="async"
      />
      <span className="course-cover-origin">{art.label}</span>
    </div>
  );
}

export function Aula02Cover() {
  return (
    <div className="a2-catalog-art">
      <img
        className="a2-pandas-wordmark"
        src={courseAsset("/course-art/aula02/curated/pandas-logo.jpg")}
        alt="pandas"
      />
      <img
        className="a2-catalog-diagram"
        src={courseAsset("/course-art/aula02/curated/02_io_readwrite.svg")}
        alt="Leitura e escrita de dados tabulares — diagrama oficial do Pandas"
      />
    </div>
  );
}

export function Aula02Intro({
  onResume,
  onNavigate,
}: {
  onResume: () => void;
  onNavigate: (page: Page) => void;
}) {
  return (
    <section className="a2-course-intro" aria-labelledby="a2-intro-title">
      <div className="a2-intro-copy">
        <span className="eyebrow">AULA 02 · PYTHON, PANDAS E ANÁLISE</span>
        <h2 id="a2-intro-title">
          Da tabela
          <br />à decisão.
        </h2>
        <p>
          Abra os dados. Encontre padrões. Explique o que muda na indústria.
        </p>
        <div className="a2-intro-facts">
          <span>14 tópicos</span>
          <span>4 casos práticos</span>
          <span>1 projeto industrial</span>
        </div>
        <button className="button primary" onClick={onResume}>
          Continuar meu percurso <ArrowRight size={17} />
        </button>
      </div>
      <figure className="a2-intro-image">
        <img
          src={courseAsset("/course-art/aula02/curated/classificacao.jpg")}
          alt="Exemplo do PDF: investigar corrente e vibração para classificar condições de uma máquina"
        />
        <figcaption>
          Uma pergunta real orienta a análise · figura do PDF, p. 5
        </figcaption>
      </figure>
      <nav className="a2-pathways" aria-label="Percursos da Aula 02">
        {[
          [
            "course",
            "01",
            "Domine as ferramentas",
            "Series, filtros, estatísticas e gráficos",
            FileSpreadsheet,
          ],
          [
            "labs",
            "02",
            "Investigue quatro casos",
            "Produção, energia, viagens e vendas",
            FlaskConical,
          ],
          [
            "project",
            "03",
            "Conecte tudo no projeto",
            "Sensores, falhas, modelos e decisões",
            Wrench,
          ],
        ].map(([page, n, title, description, Icon]) => {
          const I = Icon as typeof Wrench;
          return (
            <button key={String(page)} onClick={() => onNavigate(page as Page)}>
              <span className="a2-path-number">{String(n)}</span>
              <I size={22} />
              <span>
                <strong>{String(title)}</strong>
                <small>{String(description)}</small>
              </span>
              <ArrowRight size={16} />
            </button>
          );
        })}
      </nav>
    </section>
  );
}

export function Aula02SourcePanel({
  moduleId,
  caption,
  variant,
}: {
  moduleId: number;
  caption?: string;
  variant?: keyof typeof extraArtwork;
}) {
  const art = variant ? extraArtwork[variant] : artwork[moduleId];
  return (
    <figure className="a2-source-panel">
      <img src={courseAsset(art.file)} alt={art.alt} loading="lazy" />
      <figcaption>
        <strong>{caption ?? art.caption}</strong>
        <span>
          {art.label}
          {art.kind === "pandas"
            ? " · exemplo da documentação"
            : " · figura do material"}
        </span>
      </figcaption>
    </figure>
  );
}
