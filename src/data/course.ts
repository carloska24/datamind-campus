/** The catalog describes published content; future lessons need no empty routes. */
export const course = {
  id: "aula-01",
  number: "01",
  title: "Data Science e Big Data na Indústria",
  description:
    "Da pergunta à decisão: fundamentos, KDD e análise de dados aplicada à indústria.",
  resources: ["PDF original", "Caderno de estudo", "Notebook Python"],
} as const;

export const secondCourse = {
  id: "aula02",
  number: "02",
  title: "Pandas e análise de dados industriais",
  description:
    "Explore produção, energia, logística e vendas. Desenvolva um projeto de manutenção industrial com dados.",
  resources: ["PDF original", "Caderno de estudo", "Notebook Python"],
} as const;
