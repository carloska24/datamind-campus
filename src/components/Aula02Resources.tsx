import artwork from "../data/aula02-artwork.json";
import { Download, FileText, Code2, Database } from "lucide-react";

const files = [
  [
    "Aula original",
    "81 páginas · Prof. Me Daniel Vieira",
    "Aula02_Original.pdf",
    FileText,
  ],
  [
    "Caderno de estudo",
    "14 tópicos, práticas e respostas · PDF",
    "Aula02_Caderno_Estudo.pdf",
    FileText,
  ],
  [
    "Laboratório e projeto em Python",
    "Notebook para Jupyter e Google Colab",
    "Aula02_Laboratorio.ipynb",
    Code2,
  ],
  [
    "Produção",
    "100 registros · produção e qualidade por turno",
    "producao.csv",
    Database,
  ],
  ["Viagens", "100 registros · viagens e distância", "base_p52.csv", Database],
  [
    "Vendas",
    "100 registros mensais · preço e faturamento",
    "base_p54.csv",
    Database,
  ],
  [
    "Manutenção",
    "5.050 registros brutos · sensores e falha",
    "manutencao.csv",
    Database,
  ],
] as const;
export default function Aula02Resources() {
  return (
    <section>
      <header className="page-heading">
        <span className="eyebrow">BIBLIOTECA · AULA 02</span>
        <h1>Seu material de estudo</h1>
        <p>
          Baixe o notebook e os quatro CSVs para a mesma pasta. No Colab, envie
          os CSVs antes de executar as células de leitura.
        </p>
      </header>
      <div className="resource-grid">
        {files.map(([title, description, file, Icon]) => (
          <a
            className="panel resource-card"
            key={file}
            href={`./materiais/aula02/${file}`}
            download
          >
            <span className="icon-box lavender">
              <Icon />
            </span>
            <h2>{title}</h2>
            <p>{description}</p>
            <span className="text-link">
              <Download size={16} />
              Baixar material
            </span>
          </a>
        ))}
      </div>
      <article className="panel a2-lab-panel">
        <h2>Fontes e reprodução</h2>
        <p>
          PDF original fornecido pelo usuário. As quatro bases foram copiadas da
          pasta local Aula02/dados. O caderno, os roteiros de áudio e o notebook
          são complementos didáticos preparados para este ambiente; não são
          novos materiais assinados pelo professor.
        </p>
        <p>
          Resultados dos laboratórios calculados das cópias locais. Os links do
          Drive no PDF podem apontar para versões diferentes. O arquivo de
          proveniência registra os hashes das bases.
        </p>
        <a
          className="text-link"
          href="./materiais/aula02/proveniencia.json"
          download
        >
          Baixar proveniência dos dados
        </a>
        <details className="a2-image-credits">
          <summary>Fontes das imagens e diagramas</summary>
          <p>
            Figuras selecionadas do PDF da Aula 02 e diagramas originais da
            documentação oficial do Pandas. Os exemplos da documentação ilustram
            operações e não representam as bases industriais.
          </p>
          <ul>
            {artwork.map((art) => (
              <li key={art.moduleId}>
                Tópico {art.moduleId + 1}: {art.caption} ·{" "}
                <a
                  href={
                    art.source.startsWith("https:")
                      ? art.source
                      : `./materiais/aula02/Aula02_Original.pdf#page=${art.page}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {art.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            className="text-link"
            href="./course-art/aula02/curated/PANDAS-LICENSE.txt"
            download
          >
            Licença dos diagramas do Pandas
          </a>
        </details>
        <h3>Documentação oficial</h3>
        <ul>
          <li>
            <a
              href="https://pandas.pydata.org/docs/getting_started/intro_tutorials/"
              target="_blank"
              rel="noreferrer"
            >
              Pandas: tutoriais introdutórios
            </a>
          </li>
          <li>
            <a
              href="https://scikit-learn.org/stable/common_pitfalls.html"
              target="_blank"
              rel="noreferrer"
            >
              Scikit-learn: preparação e prevenção de vazamento
            </a>
          </li>
          <li>
            <a
              href="https://spark.apache.org/docs/latest/api/python/getting_started/index.html"
              target="_blank"
              rel="noreferrer"
            >
              PySpark: primeiros passos
            </a>
          </li>
        </ul>
      </article>
    </section>
  );
}
