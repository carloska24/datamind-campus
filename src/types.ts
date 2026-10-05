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
};
export type StudyState = { done: number[]; notes: Record<string, string> };
