export type Module = {
  id: number;
  title: string;
  pages: string;
  idea: string;
  explain: string;
  example: string;
  question: string;
  answer: string;
  code: string;
  category: string;
  minutes: number;
  guide: {
    objective: string;
    sections: { title: string; text: string }[];
    steps: string[];
    expected: string;
    sourceNote: string;
  };
};
export type StudyState = {
  done: number[];
  notes: Record<string, string>;
  /** Legacy top-level fields belong to Aula 01; additional lessons are isolated. */
  courses?: { aula02?: { done: number[]; notes: Record<string, string> } };
};
