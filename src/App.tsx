import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Download,
  ExternalLink,
  Factory,
  FileText,
  FlaskConical,
  FolderOpen,
  Headphones,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Moon,
  NotebookPen,
  Play,
  Search,
  Shuffle,
  Sparkles,
  Sun,
  Target,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import rawModules from "./data/modules.json";
import data from "./data/datasets.json";
import type { Module, StudyState } from "./types";
import { searchText } from "./search";
import {
  parseRoute,
  routeHash,
  isStudyRoute,
  studyDestination,
  type Page,
  type CampusRoute,
} from "./navigation";
import { FactoryArt, TopicArt } from "./components/Illustrations";
import { Scatter, MachineBars, correlation, number } from "./components/Charts";
import AudioStudio from "./components/AudioStudio";
import AccountPanel from "./components/AccountPanel";
import { useStudySync, type CampusUser, type StudyRecord } from "./accounts";
import {
  CodeBlock,
  CommandPalette,
  Confetti,
  MiniScatter,
  ProgressRing,
  ScrollProgress,
  pearson,
  type Command,
} from "./components/Campus";
import "./styles.css";
const modules: Module[] = rawModules;
const categories = [
  "Todos",
  "Fundamentos",
  "KDD",
  "Pandas",
  "Laboratórios",
  "Aplicação",
];
const navItems = [
  ["home", "Visão geral", LayoutDashboard],
  ["course", "Trilha de aprendizagem", BookOpen],
  ["kdd", "Explore o KDD", Layers3],
  ["labs", "Laboratórios", FlaskConical],
  ["audio", "Ouvir as aulas", Headphones],
  ["review", "Cartões de revisão", BrainCircuit],
  ["notes", "Meu caderno", NotebookPen],
  ["resources", "Materiais e referências", FolderOpen],
] as const;
/* Tom de cor por categoria: violeta, ciano, azul, menta, âmbar. */
const toneOf = (category: string) =>
  Math.max(0, categories.indexOf(category) - 1);
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
/* Destaque que segue o cursor nos cards bento. */
function spotlight(e: ReactMouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}
function initialTheme(): "dark" | "light" {
  try {
    const t = localStorage.getItem("datamind-theme");
    if (t === "dark" || t === "light") return t;
    return matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}
function validState(s: unknown): s is StudyState {
  if (!s || typeof s !== "object") return false;
  const v = s as StudyState;
  return (
    Array.isArray(v.done) &&
    v.done.every((n) => Number.isInteger(n) && n >= 0 && n < 14) &&
    !!v.notes &&
    typeof v.notes === "object" &&
    !Array.isArray(v.notes) &&
    Object.entries(v.notes).every(
      ([k, t]) => /^\d+$/.test(k) && +k < 14 && typeof t === "string",
    )
  );
}
function initialState(): StudyState {
  try {
    for (const key of ["aula01-studio-v2", "aula01-carlos-v1"]) {
      const s = JSON.parse(localStorage.getItem(key) || "null");
      if (validState(s)) return { done: [...new Set(s.done)], notes: s.notes };
    }
  } catch {}
  return { done: [], notes: {} };
}
const activityKey = "datamind-aula01-last-activity";
function initialActivity(): CampusRoute | null {
  try {
    const hash = localStorage.getItem(activityKey);
    const route = hash ? parseRoute(hash, modules.length) : null;
    return route && isStudyRoute(route) ? route : null;
  } catch {
    return null;
  }
}
export default function App({
  account,
  initialRecord,
  onLogout,
}: {
  account?: CampusUser;
  initialRecord?: StudyRecord;
  onLogout?: () => Promise<void>;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const displayName = account?.name || "Carlos Pereira";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const [route, setRoute] = useState<CampusRoute>(
      () =>
        parseRoute(window.location.hash, modules.length) ?? { page: "home" },
    ),
    [lastActivity, setLastActivity] = useState<CampusRoute | null>(() =>
      initialRecord
        ? initialRecord.lastActivity
          ? parseRoute(initialRecord.lastActivity, modules.length)
          : null
        : initialActivity(),
    ),
    [study, setStudy] = useState<StudyState>(() =>
      initialRecord
        ? { done: initialRecord.done, notes: initialRecord.notes }
        : initialState(),
    ),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [menu, setMenu] = useState(false),
    [saved, setSaved] = useState(true),
    [toast, setToast] = useState(""),
    [theme, setTheme] = useState<"dark" | "light">(initialTheme),
    [palette, setPalette] = useState(false),
    [celebrate, setCelebrate] = useState(0);
  const sync = useStudySync(study, lastActivity, initialRecord, account?.id);
  const next = modules.find((m) => !study.done.includes(m.id)) || modules[0];
  const page = route.page,
    current = route.moduleId ?? 0;
  const allDone = modules.every((m) => study.done.includes(m.id));
  const resume = studyDestination(study.done, lastActivity, modules.length);
  const activityLabel = (r: CampusRoute) =>
    r.page === "audio"
      ? `${modules[r.moduleId ?? 0].title} · trecho ${(r.position ?? 0) + 1} de 4`
      : r.page === "lesson"
        ? modules[r.moduleId ?? 0].title
        : r.page === "kdd"
          ? `Explore o KDD · etapa ${(r.position ?? 0) + 1}`
          : r.page === "labs"
            ? (r.position ?? 0) === 0
              ? "Temperatura e defeitos"
              : "Produção e energia"
            : `Cartões de revisão · ${modules[r.moduleId ?? 0].title}`;
  const progress = study.done.length / 14;
  useEffect(() => {
    const hash = routeHash(
      parseRoute(window.location.hash, modules.length) ?? { page: "home" },
    );
    if (window.location.hash !== hash)
      window.history.replaceState(null, "", hash);
    const onHistory = () => {
      setRoute(
        parseRoute(window.location.hash, modules.length) ?? { page: "home" },
      );
      setMenu(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    addEventListener("popstate", onHistory);
    addEventListener("hashchange", onHistory);
    return () => {
      removeEventListener("popstate", onHistory);
      removeEventListener("hashchange", onHistory);
    };
  }, []);
  useEffect(() => {
    if (!isStudyRoute(route)) return;
    setLastActivity(route);
    try {
      if (!account) localStorage.setItem(activityKey, routeHash(route));
    } catch {}
  }, [route]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("datamind-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (account) return;
    try {
      localStorage.setItem("aula01-studio-v2", JSON.stringify(study));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [study, account]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  function navigate(destination: CampusRoute, replace = false, scroll = true) {
    const hash = routeHash(destination);
    if (hash !== window.location.hash)
      window.history[replace ? "replaceState" : "pushState"](null, "", hash);
    setRoute(destination);
    setMenu(false);
    if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
  }
  function go(p: Page, id?: number) {
    if (p === "audio" && id === undefined && lastActivity?.page === "audio") {
      navigate(lastActivity);
      return;
    }
    navigate({
      page: p,
      ...(["lesson", "audio", "review"].includes(p)
        ? { moduleId: id ?? route.moduleId ?? lastActivity?.moduleId ?? 0 }
        : {}),
      ...(["audio", "kdd", "labs"].includes(p)
        ? { position: p === "labs" ? (id ?? 0) : 0 }
        : {}),
    });
  }
  function mark(id: number) {
    if (!study.done.includes(id)) {
      setCelebrate((c) => c + 1);
      setToast("Módulo marcado como compreendido. Continue assim!");
    }
    setStudy((s) => ({
      ...s,
      done: s.done.includes(id)
        ? s.done.filter((n) => n !== id)
        : [...s.done, id],
    }));
  }
  const commands: Command[] = [
    ...navItems.map(([id, label, Icon]) => ({
      id: `nav-${id}`,
      group: "Telas",
      label,
      icon: Icon,
      run: () => go(id),
    })),
    ...modules.map((m) => ({
      id: `mod-${m.id}`,
      group: "Módulos",
      label: `${String(m.id + 1).padStart(2, "0")} · ${m.title}`,
      hint: m.category,
      keywords: `${m.idea} ${m.explain} ${m.question}`,
      icon: study.done.includes(m.id) ? CheckCircle2 : BookOpen,
      run: () => go("lesson", m.id),
    })),
    {
      id: "theme",
      group: "Preferências",
      label: theme === "dark" ? "Usar tema claro" : "Usar tema escuro",
      icon: theme === "dark" ? Sun : Moon,
      run: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
  ];
  function exportNotes() {
    const blob = new Blob(
      [JSON.stringify({ format: "aula01-studio-v2", ...study }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Aula01_Meu_Caderno.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importNotes(file: File) {
    try {
      const s = JSON.parse(await file.text());
      if (
        !["aula01-studio-v2", "aula01-carlos-v1"].includes(s.format) ||
        !validState(s)
      )
        throw Error();
      if (!confirm("Substituir o caderno atual pelos dados desta cópia?"))
        return;
      setStudy({ done: [...new Set(s.done)], notes: s.notes });
      setToast("Caderno importado com sucesso.");
    } catch {
      setToast("Arquivo inválido. Use uma cópia exportada pelo caderno.");
    }
  }
  const listed = modules.filter(
    (m) =>
      (filter === "Todos" || m.category === filter) &&
      searchText(`${m.title} ${m.idea} ${m.explain} ${m.question}`).includes(
        searchText(query),
      ),
  );
  const heading = (eyebrow: string, title: string, subtitle: string) => (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
  const cards = (items: Module[]) => (
    <div className="module-grid">
      {items.map((m) => (
        <button
          className={`module-card tone-${toneOf(m.category)}`}
          key={m.id}
          onClick={() => go("lesson", m.id)}
        >
          <div className="module-art">
            <TopicArt kind={m.id % 4} tone={toneOf(m.category)} />
            <span className="module-index">
              {String(m.id + 1).padStart(2, "0")}
            </span>
            {study.done.includes(m.id) && (
              <span
                className="completed-badge"
                aria-label="Módulo marcado como compreendido"
              >
                <Check size={15} />
              </span>
            )}
          </div>
          <div className="module-content">
            <span className="module-category">{m.category}</span>
            <h3>{m.title}</h3>
            <p>{m.idea}</p>
            <div className="module-foot">
              <span>
                <Clock size={13} />
                {m.minutes} min sugeridos
              </span>
              <ArrowRight size={18} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
  return (
    <div className="app-shell">
      <div className="aurora" aria-hidden="true">
        <span />
        <i />
      </div>
      <ScrollProgress />
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="brand-icon">
            <BrainCircuit size={25} />
          </span>
          <span>
            Data<span className="brand-accent">Mind</span>
            <small>INDUSTRY LEARNING STUDIO</small>
          </span>
        </a>
        <button
          className="close-nav icon-button"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <div className="sidebar-label">SEU ESPAÇO DE ESTUDO</div>
        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={
                page === id || (id === "course" && page === "lesson")
                  ? "active"
                  : ""
              }
              onClick={() => go(id)}
              aria-current={
                page === id || (id === "course" && page === "lesson")
                  ? "page"
                  : undefined
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "audio" && <span className="nav-new">ÁUDIO</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-progress">
          <ProgressRing value={progress} size={58} />
          <div className="sidebar-progress-head">
            <span>Sua jornada</span>
            <strong>{study.done.length}/14</strong>
          </div>
          <div className="progress-track">
            <div style={{ width: `${progress * 100}%` }} />
          </div>
          <small>módulos compreendidos</small>
          <button onClick={() => navigate(resume)}>
            {allDone
              ? "Revisar a aula"
              : lastActivity
                ? "Retomar atividade"
                : "Começar a estudar"}
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="avatar">{initials}</span>
          <div>
            <strong>{displayName}</strong>
            <small>
              {account
                ? account.role === "admin"
                  ? "Administrador do campus"
                  : "Aluno · Aula 01"
                : "Modo portátil · estudo local"}
            </small>
          </div>
          {account && (
            <button
              className="icon-button"
              aria-label="Abrir minha conta"
              onClick={() => {
                setMenu(false);
                setAccountOpen(true);
              }}
            >
              <UserRound size={19} />
            </button>
          )}
        </div>
      </aside>
      {menu && (
        <button
          className="menu-overlay"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Abrir menu"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <span>Meu aprendizado</span>
            <ChevronRight size={14} />
            <strong>
              {page === "lesson"
                ? modules[current].title
                : navItems.find(([id]) => id === page)?.[1]}
            </strong>
          </div>
          <div className="topbar-right">
            <button
              className="cmdk-trigger"
              id="open-command-palette"
              onClick={() => setPalette(true)}
              aria-label="Buscar no campus (Ctrl+K)"
            >
              <Search size={16} />
              <span className="label">Buscar módulo ou tela…</span>
              <span className="kbd">Ctrl K</span>
            </button>
            <span className="course-pill">
              <span />
              Data Science &amp; Big Data
            </span>
            <button
              className="theme-toggle"
              id="theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={
                theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
              }
              title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {account ? (
              <button
                className="avatar small account-trigger"
                aria-label={
                  account.role === "admin"
                    ? "Gerenciar alunos e minha conta"
                    : "Minha conta"
                }
                onClick={() => setAccountOpen(true)}
              >
                {initials}
              </button>
            ) : (
              <span className="avatar small">{initials}</span>
            )}
          </div>
        </header>
        <main>
          {account && (
            <div
              className={`account-sync ${sync.status}`}
              role={sync.error ? "alert" : "status"}
            >
              <span>
                {sync.status === "saved"
                  ? "Estudo salvo na sua conta"
                  : sync.status === "saving"
                    ? "Salvando seu estudo…"
                    : sync.error}
              </span>
              {sync.status === "error" && (
                <div>
                  <button className="text-link" onClick={exportNotes}>
                    Exportar cópia
                  </button>
                  {!sync.conflict && (
                    <button className="text-link" onClick={sync.retry}>
                      Tentar salvar novamente
                    </button>
                  )}
                  <button
                    className="text-link"
                    onClick={() => {
                      if (
                        confirm(
                          "Exporte uma cópia antes de recarregar. As alterações ainda não salvas serão descartadas. Continuar?",
                        )
                      )
                        window.location.reload();
                    }}
                  >
                    Recarregar
                  </button>
                </div>
              )}
            </div>
          )}
          <div
            className="page-enter"
            key={`${page}-${page === "lesson" ? current : ""}`}
          >
            {page === "home" && (
              <>
                {heading(
                  "DATAMIND CAMPUS · AULA 01",
                  `${greeting()}, ${displayName.split(" ")[0]}`,
                  "Vamos transformar a experiência da fábrica em raciocínio com dados.",
                )}
                {lastActivity && !allDone && (
                  <div className="resume-study panel">
                    <span className="icon-box lavender">
                      <Play size={20} />
                    </span>
                    <div>
                      <span className="eyebrow">DE ONDE VOCÊ PAROU</span>
                      <strong>{activityLabel(lastActivity)}</strong>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => navigate(resume)}
                    >
                      Retomar atividade <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                <section className="hero">
                  <div className="hero-copy">
                    <span className="hero-tag">
                      <Sparkles size={14} />
                      AULA 01 · FUNDAMENTOS E PRÁTICA
                    </span>
                    <h2>
                      Abra a mente.
                      <br />
                      Encontre sentido
                      <br />
                      <em>nos dados.</em>
                    </h2>
                    <p>
                      Entenda os conceitos, explore os processos e experimente
                      com os dados da sua primeira aula.
                    </p>
                    <div className="hero-actions">
                      <button
                        className="button white"
                        onClick={() => navigate(resume)}
                      >
                        {allDone
                          ? "Revisar a aula"
                          : lastActivity
                            ? "Retomar atividade"
                            : "Começar a estudar"}
                        <ArrowRight size={17} />
                      </button>
                      <button
                        className="button ghost-white"
                        onClick={() => go("audio", next.id)}
                      >
                        <Headphones size={18} />
                        Ouvir a aula
                      </button>
                    </div>
                    <div className="hero-meta">
                      <span>
                        <BookOpen size={15} />
                        14 módulos
                      </span>
                      <span>
                        <FlaskConical size={15} />2 laboratórios
                      </span>
                      <span>
                        <FileText size={15} />
                        63 páginas de origem
                      </span>
                    </div>
                  </div>
                  <div className="hero-visual">
                    <FactoryArt />
                  </div>
                  <span className="hero-dot dot-one" />
                  <span className="hero-dot dot-two" />
                  <div className="hero-progress">
                    <ProgressRing value={progress} size={52} stroke={5} />
                    <div>
                      <strong>{study.done.length} de 14 módulos</strong>
                      <small>
                        {allDone
                          ? "Trilha concluída · hora de revisar"
                          : `Próximo módulo: ${next.title}`}
                      </small>
                    </div>
                  </div>
                </section>
                <div className="bento">
                  <button
                    className="bento-card wide"
                    onMouseMove={spotlight}
                    onClick={() => go("kdd")}
                  >
                    <header>
                      <span className="eyebrow">Processo KDD · PDF 25–31</span>
                      <Layers3 size={18} />
                    </header>
                    <h3>Dos dados ao conhecimento, em 5 etapas</h3>
                    <div className="mini-kdd">
                      {[
                        "Seleção",
                        "Pré-proc.",
                        "Transformação",
                        "Mineração",
                        "Avaliação",
                      ].map((s, i) => (
                        <div key={s}>
                          <i>{i + 1}</i>
                          {s}
                        </div>
                      ))}
                    </div>
                    <div className="bento-foot">
                      Explorar cada etapa
                      <ArrowRight size={16} />
                    </div>
                  </button>
                  <button
                    className="bento-card"
                    onMouseMove={spotlight}
                    onClick={() => go("labs")}
                  >
                    <header>
                      <span className="eyebrow">Laboratório 1</span>
                      <FlaskConical size={18} />
                    </header>
                    <h3>Temperatura × defeitos</h3>
                    <MiniScatter />
                    <div className="bento-foot">
                      <span>
                        r ={" "}
                        <strong className="metric-big" style={{ fontSize: 20 }}>
                          {pearson}
                        </strong>
                      </span>
                      <ArrowRight size={16} />
                    </div>
                  </button>
                  <button
                    className="bento-card"
                    onMouseMove={spotlight}
                    onClick={() => go("review")}
                  >
                    <header>
                      <span className="eyebrow">Cartão do dia</span>
                      <BrainCircuit size={18} />
                    </header>
                    <p
                      style={{
                        color: "var(--text)",
                        fontFamily: "var(--font-display)",
                        fontSize: 17,
                      }}
                    >
                      {modules[new Date().getDate() % 14].question}
                    </p>
                    <div className="bento-foot">
                      Tentar responder
                      <ArrowRight size={16} />
                    </div>
                  </button>
                  <button
                    className="bento-card"
                    onMouseMove={spotlight}
                    onClick={() => go("course")}
                  >
                    <header>
                      <span className="eyebrow">Trilha</span>
                      <BookOpen size={18} />
                    </header>
                    <span className="metric-big">
                      {Math.round(progress * 100)}%
                    </span>
                    <p>
                      Conceito → exemplo na fábrica → pergunta. 14 módulos, um
                      de cada vez.
                    </p>
                    <div className="bento-foot">
                      Ver trilha completa
                      <ArrowRight size={16} />
                    </div>
                  </button>
                  <button
                    className="bento-card"
                    onMouseMove={spotlight}
                    onClick={() => go("labs", 1)}
                  >
                    <header>
                      <span className="eyebrow">Laboratório 2</span>
                      <Factory size={18} />
                    </header>
                    <h3>Produção × energia</h3>
                    <p>
                      Quem produz mais nem sempre é quem usa melhor a energia.
                    </p>
                    <div className="bento-foot">
                      <span>
                        Máquina E ·{" "}
                        <strong style={{ color: "var(--mint)" }}>
                          3,26 peças/kWh
                        </strong>
                      </span>
                      <ArrowRight size={16} />
                    </div>
                  </button>
                  <button
                    className="bento-card wide"
                    onMouseMove={spotlight}
                    onClick={() => go("audio", next.id)}
                  >
                    <header>
                      <span className="eyebrow">Estúdio de áudio</span>
                      <Headphones size={18} />
                    </header>
                    <h3>Dê uma pausa à leitura: ouça “{next.title}”</h3>
                    <div className="mini-wave" aria-hidden="true">
                      {Array.from({ length: 56 }, (_, i) => (
                        <i
                          key={i}
                          style={{
                            height: 8 + ((i * 37) % 36),
                            animationDelay: `${(i % 14) * 0.07}s`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="bento-foot">
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Play size={15} /> Narração em português
                      </span>
                      <ArrowRight size={16} />
                    </div>
                  </button>
                </div>
                <div className="dashboard-grid">
                  <section>
                    <div className="section-title">
                      <div>
                        <h2>Uma ideia de cada vez</h2>
                        <p>Comece pelos fundamentos da aula.</p>
                      </div>
                      <button
                        className="text-link"
                        onClick={() => go("course")}
                      >
                        Ver trilha completa
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    {cards(modules.slice(0, 3))}
                    <div className="factory-banner">
                      <span className="icon-box mint">
                        <Factory />
                      </span>
                      <div>
                        <h3>
                          Você já conhece o processo. Agora, investigue os
                          dados.
                        </h3>
                        <p>Conecte a aula a SMT, AOI, SPI e solda seletiva.</p>
                      </div>
                      <button
                        className="icon-button"
                        aria-label="Abrir aplicação industrial"
                        onClick={() => go("lesson", 12)}
                      >
                        <ArrowRight />
                      </button>
                    </div>
                  </section>
                  <aside className="right-column">
                    <div className="panel focus-card">
                      <span className="tag">
                        <Target size={14} />
                        {allDone
                          ? "Sua trilha concluída"
                          : "Próximo módulo recomendado"}
                      </span>
                      <h3>
                        {allDone ? "Reconstrua o que aprendeu" : next.title}
                      </h3>
                      <p>
                        {allDone
                          ? "Revise os conceitos e retorne às ideias que precisam de prática."
                          : next.idea}
                      </p>
                      <div className="focus-line">
                        <Clock size={15} />
                        {allDone
                          ? "14 módulos compreendidos"
                          : `${next.minutes} minutos sugeridos`}
                      </div>
                      <button
                        className="button primary full"
                        onClick={() =>
                          allDone ? go("review", 0) : go("lesson", next.id)
                        }
                      >
                        {allDone ? "Abrir revisão" : "Abrir módulo"}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="insight-card">
                      <Lightbulb size={25} />
                      <span className="eyebrow">MUDE A PERGUNTA</span>
                      <h3>
                        “Tenho dados”
                        <br />é só o começo.
                      </h3>
                      <p>
                        O que você quer descobrir? Qual decisão pode melhorar
                        com essa resposta?
                      </p>
                      <button className="text-link" onClick={() => go("kdd")}>
                        Explorar o caminho
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </aside>
                </div>
              </>
            )}
            {page === "course" && (
              <>
                {heading(
                  "DO CONCEITO À APLICAÇÃO",
                  "Sua trilha de aprendizagem",
                  "14 módulos organizados para conectar teoria, raciocínio e prática.",
                )}
                <div className="path-overview">
                  {[
                    ["01", "Entender", "Fundamentos"],
                    ["02", "Investigar", "KDD"],
                    ["03", "Experimentar", "Pandas"],
                    ["04", "Aplicar", "Laboratórios"],
                  ].map(([n, title, cat]) => (
                    <button
                      key={n}
                      onClick={() => setFilter(cat)}
                      className={filter === cat ? "selected" : ""}
                      aria-pressed={filter === cat}
                    >
                      <span>{n}</span>
                      <div>
                        <strong>{title}</strong>
                        <small>{cat}</small>
                      </div>
                      <ArrowRight size={18} />
                    </button>
                  ))}
                </div>
                <div className="filters">
                  <div className="filter-tabs">
                    {categories.map((c) => (
                      <button
                        key={c}
                        className={filter === c ? "active" : ""}
                        aria-pressed={filter === c}
                        onClick={() => setFilter(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Buscar módulos"
                      placeholder="Buscar conceito…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                </div>
                {listed.length ? (
                  cards(listed)
                ) : (
                  <div className="panel empty">
                    Nenhum módulo encontrado. Tente outra busca.
                  </div>
                )}
              </>
            )}
            {page === "lesson" && (
              <Lesson
                module={modules[current]}
                done={study.done.includes(current)}
                note={study.notes[current] || ""}
                onMark={() => mark(current)}
                onNote={(text) =>
                  setStudy((s) => ({
                    ...s,
                    notes: { ...s.notes, [current]: text },
                  }))
                }
                onBack={() => go("course")}
                onNext={() => go("lesson", Math.min(13, current + 1))}
                onPrev={() => go("lesson", Math.max(0, current - 1))}
                onAudio={() => go("audio", current)}
                saved={account ? sync.status === "saved" : saved}
                onlineAccount={!!account}
              />
            )}
            {page === "kdd" && (
              <Kdd
                step={route.position ?? 0}
                onStep={(position) =>
                  navigate({ page: "kdd", position }, false, false)
                }
              />
            )}
            {page === "labs" && (
              <Labs
                lab={route.position ?? 0}
                onLab={(position) =>
                  navigate({ page: "labs", position }, false, false)
                }
              />
            )}
            {page === "audio" && (
              <AudioStudio
                canManageCredentials={account?.role === "admin"}
                modules={modules}
                initial={current}
                initialSegment={route.position ?? 0}
                onPositionChange={(moduleId, position) =>
                  navigate({ page: "audio", moduleId, position }, true, false)
                }
              />
            )}
            {page === "review" && (
              <Review
                modules={modules}
                id={current}
                onCard={(moduleId) =>
                  navigate({ page: "review", moduleId }, false, false)
                }
              />
            )}
            {page === "notes" && (
              <>
                {heading(
                  "IDEIAS QUE VALEM GUARDAR",
                  "Seu caderno de descobertas",
                  "Registre hipóteses, dúvidas e conexões com o seu trabalho.",
                )}
                <div className="note-toolbar">
                  <span>
                    <ShieldSaved
                      saved={account ? sync.status === "saved" : saved}
                    />
                    {account
                      ? sync.status === "saved"
                        ? "Caderno salvo na sua conta"
                        : sync.status === "saving"
                          ? "Salvando caderno…"
                          : "Caderno com alterações não salvas"
                      : saved
                        ? "Caderno salvo neste navegador"
                        : "Armazenamento bloqueado; exporte uma cópia"}
                  </span>
                  <div className="button-row">
                    <button className="button primary" onClick={exportNotes}>
                      <Download size={16} />
                      Exportar caderno
                    </button>
                    <label className="button secondary import-button">
                      <Upload size={16} />
                      Importar
                      <input
                        aria-label="Importar caderno"
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          if (e.target.files?.[0])
                            void importNotes(e.target.files[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
                <p className="small-text">
                  A cópia exportada contém apenas progresso e anotações. Chaves
                  de API ficam fora do caderno. Cópias do primeiro HTML também
                  podem ser importadas.
                </p>
                <div className="notes-grid">
                  {modules.map((m) => (
                    <section className="panel note-card" key={m.id}>
                      <div>
                        <span className="module-category">
                          {m.category} · {String(m.id + 1).padStart(2, "0")}
                        </span>
                        {study.done.includes(m.id) && (
                          <CheckCircle2 size={18} className="green" />
                        )}
                      </div>
                      <h3>{m.title}</h3>
                      <label className="sr-only" htmlFor={`note-${m.id}`}>
                        Anotação para {m.title}
                      </label>
                      <textarea
                        id={`note-${m.id}`}
                        value={study.notes[m.id] || ""}
                        placeholder="O que entendi? Onde isso aparece na fábrica? Qual dúvida ficou?"
                        onChange={(e) =>
                          setStudy((s) => ({
                            ...s,
                            notes: { ...s.notes, [m.id]: e.target.value },
                          }))
                        }
                      />
                      <button
                        className="text-link"
                        onClick={() => go("lesson", m.id)}
                      >
                        Revisitar o módulo
                        <ArrowRight size={14} />
                      </button>
                    </section>
                  ))}
                </div>
              </>
            )}
            {page === "resources" && (
              <>
                {heading(
                  "TUDO NO MESMO LUGAR",
                  "Sua biblioteca da aula",
                  "Material original, caderno de estudo e laboratório em Python.",
                )}
                <div className="resource-grid">
                  {[
                    [
                      "Aula original",
                      "63 páginas · Prof. Me Daniel Vieira",
                      "Aula01_Original.pdf",
                      FileText,
                    ],
                    [
                      "Caderno de estudo",
                      "15 páginas · explicações e respostas",
                      "Aula01_Caderno_Estudo.pdf",
                      BookOpen,
                    ],
                    [
                      "Laboratório Python",
                      "Notebook para Jupyter ou Colab",
                      "Aula01_Laboratorio.ipynb",
                      Code2,
                    ],
                  ].map(([title, desc, file, Icon]) => {
                    const I = Icon as typeof FileText;
                    return (
                      <a
                        className="panel resource-card"
                        key={String(file)}
                        href={`./materiais/${file}`}
                        target="_blank"
                        rel="noreferrer"
                        download
                      >
                        <span className="icon-box lavender">
                          <I />
                        </span>
                        <h3>{String(title)}</h3>
                        <p>{String(desc)}</p>
                        <span className="text-link">
                          <Download size={15} />
                          Abrir ou baixar material
                        </span>
                      </a>
                    );
                  })}
                </div>
                <div className="panel">
                  <h2>Referências que orientaram esta versão</h2>
                  <div className="reference-list">
                    {[
                      [
                        "Brilliant",
                        "Aprendizagem visual, perguntas e interação",
                        "https://brilliant.org/data/",
                      ],
                      [
                        "DataCamp",
                        "Organização de trilhas e prática com dados",
                        "https://www.datacamp.com/",
                      ],
                      [
                        "Pandas",
                        "Conceitos, tabelas, seleção e estatística",
                        "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html",
                      ],
                      [
                        "OpenAI · áudio",
                        "Integração de narração via API",
                        "https://developers.openai.com/api/docs/guides/text-to-speech",
                      ],
                      [
                        "Google Gemini · áudio",
                        "Integração de narração via API",
                        "https://ai.google.dev/gemini-api/docs/speech-generation",
                      ],
                    ].map(([name, desc, url]) => (
                      <a key={name} href={url} target="_blank" rel="noreferrer">
                        <div>
                          <strong>{name}</strong>
                          <p>{desc}</p>
                        </div>
                        <ExternalLink size={18} />
                      </a>
                    ))}
                  </div>
                </div>
                <div className="notice">
                  <Lightbulb size={20} />
                  <p>
                    O conteúdo vem da Aula 01. Os exemplos de PCBA, cinco Vs,
                    cuidados estatísticos e roteiro de revisão são complementos
                    didáticos. As ilustrações são próprias; este projeto não
                    representa uma plataforma oficial do SENAI.
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
        <footer className="app-footer">
          <span>DataMind · Aula 01</span>
          <span>
            Estudo guiado a partir do material do Prof. Me Daniel Vieira
          </span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        commands={commands}
      />
      <Confetti fire={celebrate} />
      {accountOpen && account && onLogout && (
        <AccountPanel
          user={account}
          onClose={() => setAccountOpen(false)}
          onLogout={async () => {
            if (
              sync.status !== "saved" &&
              !confirm(
                "Há alterações não salvas. Exporte uma cópia do caderno antes de sair. Sair mesmo assim?",
              )
            )
              return false;
            await onLogout();
          }}
          onRestore={() => {
            const previous = initialState();
            if (!previous.done.length && !Object.keys(previous.notes).length) {
              setToast(
                "Nenhum estudo anterior foi encontrado neste navegador.",
              );
              return;
            }
            if (
              confirm(
                "Importar seu estudo anterior? O progresso e o caderno desta conta serão substituídos.",
              )
            ) {
              setStudy(previous);
              setLastActivity(initialActivity());
              setAccountOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}
function ShieldSaved({ saved }: { saved: boolean }) {
  return saved ? <CheckCircle2 size={17} /> : <Download size={17} />;
}
function Lesson({
  module: m,
  done,
  note,
  onMark,
  onNote,
  onBack,
  onNext,
  onPrev,
  onAudio,
  saved,
  onlineAccount,
}: {
  module: Module;
  done: boolean;
  note: string;
  onMark: () => void;
  onNote: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  onAudio: () => void;
  saved: boolean;
  onlineAccount: boolean;
}) {
  const [reveal, setReveal] = useState(false);
  useEffect(() => setReveal(false), [m.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.ctrlKey || e.metaKey)
        return;
      if (e.key === "ArrowRight" && m.id < 13) onNext();
      if (e.key === "ArrowLeft" && m.id > 0) onPrev();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [m.id, onNext, onPrev]);
  return (
    <>
      <button className="text-link back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        Voltar à trilha
      </button>
      <div className="lesson-header">
        <div>
          <span className="eyebrow">
            MÓDULO {String(m.id + 1).padStart(2, "0")} / 14 ·{" "}
            {m.category.toUpperCase()}
          </span>
          <h1>
            {m.title}
            <span>.</span>
          </h1>
          <div className="lesson-meta">
            <span>
              <Clock size={15} />
              {m.minutes} minutos sugeridos
            </span>
            <span>
              <FileText size={15} />
              PDF · {m.pages}
            </span>
          </div>
        </div>
        <button className="button primary" onClick={onAudio}>
          <Headphones size={18} />
          Ouvir esta aula
        </button>
      </div>
      <div className="lesson-grid">
        <div>
          <div className="concept-hero">
            <TopicArt kind={m.id % 4} tone={toneOf(m.category)} />
            <div>
              <span className="eyebrow">A IDEIA QUE VOCÊ LEVA</span>
              <h2>{m.idea}</h2>
            </div>
          </div>
          <article className="panel lesson-article">
            <span className="icon-box lavender">
              <BookOpen />
            </span>
            <h2>Entenda, com calma.</h2>
            <p>{m.explain}</p>
            <div className="industrial-example">
              <div>
                <Factory size={20} />
                <strong>Conexão com a indústria</strong>
              </div>
              <p>{m.example}</p>
            </div>
            {m.code && (
              <>
                <div className="section-title">
                  <h3>Traduza o raciocínio em código</h3>
                  <span>Python + Pandas</span>
                </div>
                <CodeBlock code={m.code} />
                <p className="small-text">
                  Os comandos são exemplos da aula. Execute no notebook em
                  Materiais e referências; este painel não executa Python.
                </p>
              </>
            )}
          </article>
          <div className="panel thinking-card">
            <span className="tag peach">
              <Lightbulb size={15} />
              Antes de seguir
            </span>
            <h2>Pare. Pense. Explique.</h2>
            <p className="question">{m.question}</p>
            <button
              className="button secondary"
              onClick={() => setReveal(!reveal)}
            >
              {reveal ? "Ocultar comentário" : "Conferir o raciocínio"}
              <ChevronRight size={16} />
            </button>
            {reveal && (
              <div className="answer" role="status">
                <CheckCircle2 size={20} />
                <p>{m.answer}</p>
              </div>
            )}
          </div>
          <div className="lesson-nav">
            <button
              className="button secondary"
              disabled={m.id === 0}
              onClick={onPrev}
            >
              <ArrowLeft size={16} />
              Anterior
            </button>
            <span className="kbd-hint">
              <span className="kbd">←</span>
              <span className="kbd">→</span> para navegar
            </span>
            <button
              className="button primary"
              disabled={m.id === 13}
              onClick={onNext}
            >
              Próximo módulo
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <aside>
          <div className="panel sticky-note">
            <span className="icon-box peach">
              <NotebookPen />
            </span>
            <h3>A sua explicação</h3>
            <p>
              Escreva com suas palavras. O que mudou na sua forma de pensar?
            </p>
            <label htmlFor="lesson-note" className="sr-only">
              Anotação do módulo
            </label>
            <textarea
              id="lesson-note"
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder="Meu exemplo, minha dúvida, minha descoberta…"
            />
            <small>
              {saved
                ? onlineAccount
                  ? "Salvo na sua conta"
                  : "Salvo neste navegador"
                : "Exporte uma cópia pelo caderno"}
            </small>
            <div className="completion">
              <label>
                <input type="checkbox" checked={done} onChange={onMark} />
                <span>Consigo explicar e aplicar sem consultar.</span>
              </label>
              <p>Esta marcação é uma autoavaliação.</p>
            </div>
          </div>
          <div className="mini-insight">
            <BrainCircuit />
            <p>
              Um conceito fica mais claro quando você consegue criar um exemplo
              novo.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
const kddSteps = [
  {
    name: "Seleção",
    icon: Target,
    color: "purple",
    question: "Quais registros respondem à pergunta?",
    text: "Defina população, período, campos e unidade de análise. Selecione casos representativos; estudar só falhas pode distorcer a comparação.",
    industrial:
      "Escolher registros de SPI e AOI de um produto e período, ligados por identificação da placa e lote.",
    out: "Dados relevantes",
    trap: "Escolher somente lotes com defeito.",
    code: "colunas = ['produto', 'producao', 'defeitos', 'temperatura']\nbase = df[colunas]",
  },
  {
    name: "Pré-processamento",
    icon: Sparkles,
    color: "green",
    question: "O dado é confiável e faz sentido?",
    text: "Investigue ausências, duplicatas, tipos e unidades. NaN não é zero. Um valor extremo pode ser uma ocorrência real, e não um erro.",
    industrial:
      "Identificar registros sem horário, placa duplicada ou temperatura inválida. Investigar a causa antes de apagar.",
    out: "Dados verificados",
    trap: "Substituir todas as ausências por zero.",
    code: "df.info()\ndf.isna().sum()\ndf.duplicated().sum()",
  },
  {
    name: "Transformação",
    icon: Shuffle,
    color: "orange",
    question: "Como preparar a comparação?",
    text: "Crie taxas, converta unidades, organize categorias e agregue períodos quando adequado. A transformação depende do objetivo e do método.",
    industrial:
      "Converter contagens de apontamentos em ocorrências por 100 placas, preservando o denominador e a definição do defeito.",
    out: "Variáveis preparadas",
    trap: "Comparar só a contagem de defeitos quando o volume muda.",
    code: "df['taxa_defeitos'] = df['defeitos'] / df['producao'] * 100",
  },
  {
    name: "Mineração",
    icon: ChartNoAxesCombined,
    color: "blue",
    question: "Quais padrões aparecem?",
    text: "Use ferramentas adequadas: associação, correlação, classificação ou agrupamento. Explorar não significa necessariamente treinar um modelo complexo.",
    industrial:
      "Investigar se temperatura e taxa de defeitos variam juntas, separando produtos e condições de processo.",
    out: "Padrões candidatos",
    trap: "Usar IA antes de definir o problema.",
    code: "df[['temperatura', 'taxa_defeitos']].corr()",
  },
  {
    name: "Avaliação",
    icon: CheckCircle2,
    color: "purple",
    question: "O padrão é válido e útil?",
    text: "Interprete no domínio, verifique explicações alternativas e relevância. Se necessário, volte às etapas anteriores. Em previsão, avalie em dados adequadamente separados.",
    industrial:
      "Conferir se a associação permanece por produto e máquina; coletar mais dados e planejar um teste da hipótese.",
    out: "Conhecimento para decidir",
    trap: "Tratar correlação como prova de causa.",
    code: "# Separar observação, hipótese e próximo teste.\n# A conclusão precisa de contexto.",
  },
];
function Kdd({
  step,
  onStep,
}: {
  step: number;
  onStep: (step: number) => void;
}) {
  const s = kddSteps[step],
    Icon = s.icon;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">UM PROCESSO, NÃO UM COMANDO</span>
          <h1>
            Dos dados ao conhecimento<span>.</span>
          </h1>
          <p>Explore cada etapa do KDD e veja o que muda na investigação.</p>
        </div>
      </div>
      <div className="kdd-journey">
        {kddSteps.map((v, i) => {
          const I = v.icon;
          return (
            <button
              key={v.name}
              className={step === i ? "active" : ""}
              onClick={() => onStep(i)}
              aria-pressed={step === i}
            >
              <span className={`kdd-icon ${v.color}`}>
                <I size={26} />
              </span>
              <small>ETAPA {i + 1}</small>
              <strong>{v.name}</strong>
              {i < 4 && <ChevronRight className="journey-arrow" />}
            </button>
          );
        })}
      </div>
      <div className="kdd-detail">
        <div className="kdd-visual">
          <div className="data-orbit">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <div className={`kdd-core ${s.color}`}>
              <Icon size={60} />
            </div>
          </div>
          <span className="tag">SAÍDA DA ETAPA</span>
          <h3>{s.out}</h3>
          <p>Etapa {step + 1} de 5</p>
        </div>
        <div className="panel" key={step}>
          <span className="eyebrow">{s.name.toUpperCase()}</span>
          <h2>{s.question}</h2>
          <p>{s.text}</p>
          <div className="industrial-example">
            <div>
              <Factory size={20} />
              <strong>Na manufatura eletrônica</strong>
            </div>
            <p>{s.industrial}</p>
          </div>
          <CodeBlock code={s.code} />
          <div className="trap">
            <Lightbulb size={20} />
            <div>
              <strong>Armadilha para evitar</strong>
              <p>{s.trap}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="notice">
        <Layers3 size={20} />
        <p>
          O KDD é iterativo. Uma dúvida na avaliação pode exigir nova seleção ou
          tratamento dos dados. Data Mining é uma etapa desse processo, não todo
          o processo. Referência: PDF, páginas 25–31.
        </p>
      </div>
    </>
  );
}
function Labs({ lab, onLab }: { lab: number; onLab: (lab: number) => void }) {
  const [metric, setMetric] = useState<"defeitos" | "taxa_defeitos">(
      "defeitos",
    ),
    [product, setProduct] = useState("Todos"),
    [threshold, setThreshold] = useState(75),
    [rank, setRank] = useState<"producao" | "energia" | "eficiencia">(
      "producao",
    ),
    [showAnswers, setShowAnswers] = useState(false);
  useEffect(() => setShowAnswers(false), [lab]);
  const filtered = data.df.filter((r) => r.temperatura > threshold),
    r = correlation(
      data.df.map((r) => r.temperatura),
      data.df.map((r) => r[metric]),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PENSE COM OS DADOS</span>
          <h1>
            Seu laboratório de descobertas<span>.</span>
          </h1>
          <p>
            Mude a perspectiva. Inspecione os registros. Compare as conclusões.
          </p>
        </div>
      </div>
      <div className="lab-switch">
        <button
          className={lab === 0 ? "active" : ""}
          onClick={() => {
            onLab(0);
            setShowAnswers(false);
          }}
        >
          <FlaskConical size={18} />
          Temperatura & defeitos
        </button>
        <button
          className={lab === 1 ? "active" : ""}
          onClick={() => {
            onLab(1);
            setShowAnswers(false);
          }}
        >
          <Factory size={18} />
          Produção & energia
        </button>
      </div>
      {lab === 0 ? (
        <>
          <div className="lab-heading">
            <span className="tag peach">EXERCÍCIO 01 · PDF 45–60</span>
            <h2>Temperatura maior, mais defeitos?</h2>
            <p>
              Uma associação pode levantar uma hipótese. Observe o produto antes
              de concluir.
            </p>
          </div>
          <div className="lab-grid">
            <div className="panel">
              <div className="section-title">
                <h3>Explore a relação</h3>
                <span>5 registros da aula</span>
              </div>
              <div className="lab-selects">
                <label className="field">
                  Medida
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as typeof metric)}
                  >
                    <option value="defeitos">Contagem de defeitos</option>
                    <option value="taxa_defeitos">Taxa por 100 peças</option>
                  </select>
                </label>
                <label className="field">
                  Destacar produto
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  >
                    {["Todos", "Motor A", "Motor B", "Motor C"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              </div>
              <Scatter metric={metric} product={product} />
              <div className="stats-row">
                <div>
                  <small>Pearson · amostra completa</small>
                  <strong>{number(r, 4)}</strong>
                </div>
                <div>
                  <small>Temperatura média</small>
                  <strong>75,6</strong>
                </div>
                <div>
                  <small>Produção média</small>
                  <strong>110</strong>
                </div>
              </div>
              <p className="small-text">
                Destacar um produto apenas muda a ênfase visual. O coeficiente
                acima continua calculado nos cinco registros.
              </p>
            </div>
            <div className="panel lab-guide">
              <span className="icon-box peach">
                <Lightbulb />
              </span>
              <h3>O detalhe que muda a leitura</h3>
              <p>
                Os dois registros do Motor B têm as maiores temperaturas. Será
                que produto e volume também influenciam os defeitos?
              </p>
              <div className="lab-task">
                <strong>Seu desafio</strong>
                <p>
                  Compare contagem e taxa. Destaque cada motor. Escreva uma
                  conclusão sem afirmar causa.
                </p>
              </div>
              <button
                className="button secondary full"
                onClick={() => setShowAnswers(!showAnswers)}
              >
                {showAnswers
                  ? "Ocultar interpretação"
                  : "Conferir interpretação"}
                <ChevronRight size={16} />
              </button>
              {showAnswers && (
                <div className="answer">
                  <p>
                    A associação é forte nesta amostra, mas cinco registros não
                    sustentam uma conclusão causal. Compare dentro do mesmo
                    produto, amplie a amostra e controle outras condições do
                    processo.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="panel">
            <div className="section-title">
              <h3>Do filtro aos registros</h3>
              <span>{filtered.length} linhas selecionadas</span>
            </div>
            <label className="range-label" htmlFor="threshold">
              Temperatura acima de <strong>{threshold}</strong>
            </label>
            <input
              id="threshold"
              type="range"
              min="67"
              max="85"
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
            />
            <pre className="single-code">
              <code>{`df[df['temperatura'] > ${threshold}]`}</code>
            </pre>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Produção</th>
                    <th>Defeitos</th>
                    <th>Temperatura</th>
                    <th>Taxa / 100 peças</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => (
                    <tr key={i}>
                      <td>
                        <span className="table-product">{v.produto}</span>
                      </td>
                      <td>{v.producao}</td>
                      <td>{v.defeitos}</td>
                      <td>{v.temperatura}</td>
                      <td>{number(v.taxa_defeitos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="empty">Nenhum registro atende à condição.</p>
              )}
            </div>
          </div>
          <div className="notice">
            <FileText size={19} />
            <p>
              Dados transcritos da página 45. Unidade de temperatura não
              indicada. Se uma peça puder ter vários defeitos, a taxa representa
              ocorrências por 100 peças, não percentual de peças defeituosas.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="lab-heading">
            <span className="tag mint">EXERCÍCIO 02 · PDF 61–62</span>
            <h2>Quem produz mais? Quem faz melhor uso da energia?</h2>
            <p>Escolha a métrica e veja como o ranking muda.</p>
          </div>
          <div className="lab-grid">
            <div className="panel">
              <label className="field">
                Ranking · maior para menor
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value as typeof rank)}
                >
                  <option value="producao">Produção · peças/turno</option>
                  <option value="energia">Energia · kWh/turno</option>
                  <option value="eficiencia">Eficiência · peças/kWh</option>
                </select>
              </label>
              <MachineBars metric={rank} />
              <div className="stats-row">
                <div>
                  <small>Produção média</small>
                  <strong>
                    1.318<small>peças/turno</small>
                  </strong>
                </div>
                <div>
                  <small>Energia média</small>
                  <strong>
                    438<small>kWh/turno</small>
                  </strong>
                </div>
              </div>
            </div>
            <div className="panel lab-guide">
              <span className="icon-box mint">
                <Target />
              </span>
              <h3>O resultado depende da pergunta.</h3>
              <p>
                Produção é quantidade. Consumo é recurso. Eficiência relaciona
                as duas medidas.
              </p>
              <div className="formula">
                Eficiência = produção ÷ energia<span>peças / kWh</span>
              </div>
              <button
                className="button secondary full"
                onClick={() => setShowAnswers(!showAnswers)}
              >
                {showAnswers ? "Ocultar respostas" : "Conferir as 7 respostas"}
              </button>
              {showAnswers && (
                <ol className="lab-answers">
                  <li>D produz mais: 1.450 peças.</li>
                  <li>C consome menos: 390 kWh.</li>
                  <li>Produção média: 1.318 peças.</li>
                  <li>Energia média: 438 kWh.</li>
                  <li>Produção: D, B, E, A, C.</li>
                  <li>Eficiência = produção/energia.</li>
                  <li>E é a mais eficiente: 3,2593 peças/kWh.</li>
                </ol>
              )}
            </div>
          </div>
          <div className="panel">
            <h3>Dados originais e indicador calculado</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Máquina</th>
                    <th>Produção (peças/turno)</th>
                    <th>Energia (kWh/turno)</th>
                    <th>Eficiência (peças/kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.m.map((r) => (
                    <tr key={r.maquina}>
                      <td>Máquina {r.maquina}</td>
                      <td>{number(r.producao, 0)}</td>
                      <td>{r.energia}</td>
                      <td>{number(r.eficiencia, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CodeBlock
              code={
                "m['eficiencia'] = m['producao'] / m['energia']\nm.sort_values('eficiencia', ascending=False)"
              }
            />
          </div>
          <div className="notice">
            <Factory size={19} />
            <p>
              Dados da página 61. Na operação real, compare produto, período e
              condições equivalentes. O ranking de energia está em ordem
              decrescente: o menor consumo aparece no final.
            </p>
          </div>
        </>
      )}
    </>
  );
}
function Review({
  modules,
  id,
  onCard,
}: {
  modules: Module[];
  id: number;
  onCard: (id: number) => void;
}) {
  const [reveal, setReveal] = useState(false),
    [remembered, setRemembered] = useState<number[]>([]);
  const m = modules[id];
  useEffect(() => setReveal(false), [id]);
  function move(n: number) {
    onCard((id + n + modules.length) % modules.length);
    setReveal(false);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">O QUE FICOU NA SUA MEMÓRIA?</span>
          <h1>
            Revisar é reconstruir<span>.</span>
          </h1>
          <p>
            Tente responder antes de virar. Use suas palavras, não as do
            material.
          </p>
        </div>
        <span className="tag">
          <BrainCircuit size={15} />
          {remembered.length} cartões lembrados nesta sessão
        </span>
      </div>
      <div className="review-layout">
        <div
          className={`flashcard ${reveal ? "is-back" : ""}`}
          key={`${id}-${reveal}`}
        >
          <div className="flash-meta">
            <span>{m.category}</span>
            <span>{String(id + 1).padStart(2, "0")} / 14</span>
          </div>
          <span className="flash-symbol">
            {reveal ? <CheckCircle2 size={38} /> : <BrainCircuit size={38} />}
          </span>
          <small>
            {reveal ? "RESPOSTA COMENTADA" : "TENTE RESPONDER EM VOZ ALTA"}
          </small>
          <h2>{reveal ? m.answer : m.question}</h2>
          <button className="button primary" onClick={() => setReveal(!reveal)}>
            {reveal ? "Voltar à pergunta" : "Virar cartão"}
            <Shuffle size={16} />
          </button>
        </div>
        <div className="review-controls">
          <button className="button secondary" onClick={() => move(-1)}>
            <ArrowLeft size={16} />
            Anterior
          </button>
          <button
            className="button secondary"
            disabled={!reveal}
            onClick={() => {
              setRemembered((s) => [...new Set([...s, id])]);
              move(1);
            }}
          >
            <Check size={16} />
            Lembrei sem consultar
          </button>
          <button className="button secondary" onClick={() => move(1)}>
            Próximo
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="review-dots">
          {modules.map((m, i) => (
            <button
              key={i}
              className={
                i === id ? "active" : remembered.includes(i) ? "remembered" : ""
              }
              aria-label={`Cartão ${i + 1}: ${m.title}`}
              onClick={() => {
                onCard(i);
                setReveal(false);
              }}
            >
              {remembered.includes(i) ? <Check size={13} /> : i + 1}
            </button>
          ))}
        </div>
        <div className="notice">
          <Clock size={19} />
          <p>
            Sugestão: revise depois de 1, 3 e 7 dias. Marcar “lembrei” é uma
            autoavaliação da sessão, não uma prova de domínio.
          </p>
        </div>
      </div>
    </>
  );
}
