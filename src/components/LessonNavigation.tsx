import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  FlaskConical,
  Headphones,
  Layers3,
} from "lucide-react";
import type { Page } from "../navigation";
import type { Module } from "../types";
import { course } from "../data/course";

export const lessonPages: Page[] = [
  "course",
  "lesson",
  "kdd",
  "labs",
  "audio",
  "review",
];
const tabs = [
  ["course", "Conteúdo", BookOpen],
  ["kdd", "Explore o KDD", Layers3],
  ["labs", "Laboratórios", FlaskConical],
  ["audio", "Áudio", Headphones],
  ["review", "Revisão", BrainCircuit],
] as const;

export function LessonNavigation({
  page,
  onNavigate,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
}) {
  return (
    <header className="lesson-navigation">
      <button className="text-link" onClick={() => onNavigate("catalog")}>
        <ArrowLeft size={16} />
        Todas as aulas
      </button>
      <div className="lesson-context">
        <span>AULA {course.number}</span>
        <strong>{course.title}</strong>
      </div>
      <nav className="lesson-tools" aria-label="Áreas da Aula 01">
        {tabs.map(([id, label, Icon]) => {
          const active = page === id || (id === "course" && page === "lesson");
          return (
            <button
              key={id}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

export function TopicOutline({
  modules,
  current,
  completed,
  onSelect,
}: {
  modules: Module[];
  current: number;
  completed: number[];
  onSelect: (id: number) => void;
}) {
  return (
    <aside className="study-outline">
      <details open>
        <summary>Conteúdo da Aula 01</summary>
        <nav aria-label="Tópicos da Aula 01">
          {modules.map((m) => (
            <button
              key={m.id}
              aria-current={current === m.id ? "page" : undefined}
              className={current === m.id ? "active" : ""}
              onClick={() => onSelect(m.id)}
            >
              <span
                aria-label={
                  completed.includes(m.id) ? "Compreendido" : undefined
                }
              >
                {completed.includes(m.id)
                  ? "✓"
                  : String(m.id + 1).padStart(2, "0")}
              </span>
              {m.title}
            </button>
          ))}
        </nav>
      </details>
    </aside>
  );
}
