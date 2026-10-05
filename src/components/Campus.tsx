import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, Copy, CornerDownLeft, Search, X } from "lucide-react";
import data from "../data/datasets.json";
import { correlation, number, productColor } from "./Charts";

/* Anel de progresso em SVG com gradiente da marca. */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2,
    c = 2 * Math.PI * r,
    id = useMemo(() => `ring-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div
      className="progress-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progresso: ${Math.round(value * 100)}%`}
    >
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--blue)" />
            <stop offset="1" stopColor="var(--blue)" />
          </linearGradient>
        </defs>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
        />
      </svg>
      <span>{label ?? `${Math.round(value * 100)}%`}</span>
    </div>
  );
}

/* Bloco de código com cabeçalho estilo editor e botão copiar. */
export function CodeBlock({
  code,
  label = "Python · Pandas",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="code-block">
      <div className="code-head">
        <span className="dots">
          <i />
          <i />
          <i />
          <span>{label}</span>
        </span>
        <button
          className={`copy-button ${copied ? "copied" : ""}`}
          onClick={copy}
          aria-label="Copiar código"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* Barra fina no topo que acompanha a rolagem da página. */
export function ScrollProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      setW(h > 0 ? (scrollY / h) * 100 : 0);
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
    };
  }, []);
  return <div className="scroll-progress" style={{ width: `${w}%` }} />;
}

/* Microcelebração ao concluir um módulo (respeita prefers-reduced-motion via CSS). */
export function Confetti({ fire }: { fire: number }) {
  const [pieces, setPieces] = useState<number[]>([]);
  useEffect(() => {
    if (!fire) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPieces(Array.from({ length: 36 }, (_, i) => i + fire * 100));
    const t = setTimeout(() => setPieces([]), 1800);
    return () => clearTimeout(t);
  }, [fire]);
  if (!pieces.length) return null;
  const colors = ["#8b6cff", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={p}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 9) * 0.04}s`,
            transform: `rotate(${i * 23}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* Mini dispersão com os 5 registros reais do slide (página 45). */
export function MiniScatter() {
  const rows = data.df;
  const x = (t: number) => 14 + ((t - 66) / 21) * 272,
    y = (n: number) => 96 - (n / 16) * 86;
  return (
    <svg
      className="mini-scatter"
      viewBox="0 0 300 110"
      role="img"
      aria-label="Temperatura e contagem de defeitos nos cinco registros da aula"
    >
      {[0, 1, 2, 3].map((n) => (
        <path
          key={n}
          d={`M10 ${14 + n * 27}H290`}
          stroke="var(--grid-line)"
          strokeDasharray="3 5"
        />
      ))}
      {rows.map((r, i) => (
        <circle
          key={i}
          cx={x(r.temperatura)}
          cy={y(r.defeitos)}
          r="7"
          fill={productColor[r.produto]}
          style={{
            animationDelay: `${i * 0.12}s`,
            filter: `drop-shadow(0 0 6px ${productColor[r.produto]})`,
          }}
        />
      ))}
    </svg>
  );
}
export const pearson = number(
  correlation(
    data.df.map((r) => r.temperatura),
    data.df.map((r) => r.defeitos),
  ),
  3,
);

/* Paleta de comandos (Ctrl+K) para navegar por telas e módulos. */
export type Command = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: LucideIcon;
  run: () => void;
};
export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const [q, setQ] = useState(""),
    [active, setActive] = useState(0),
    input = useRef<HTMLInputElement>(null),
    dialog = useRef<HTMLDivElement>(null);
  const list = commands.filter((c) =>
    `${c.label} ${c.group} ${c.hint ?? ""} ${c.keywords ?? ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(
        q
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      ),
  );
  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const background = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".sidebar, .main-shell, .menu-overlay, .campus-mobile-nav",
      ),
    );
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    document.body.style.overflow = "hidden";
    setQ("");
    setActive(0);
    const timer = setTimeout(() => input.current?.focus(), 10);
    return () => {
      clearTimeout(timer);
      background.forEach((element, i) => {
        element.inert = previousInert[i];
      });
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  useEffect(() => setActive(0), [q]);
  if (!open) return null;
  function onKey(e: ReactKeyboardEvent) {
    if (e.key === "Tab") {
      const controls = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), [tabindex='0']",
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(list.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && list[active]) {
      list[active].run();
      onClose();
    } else if (e.key === "Escape") onClose();
  }
  let lastGroup = "";
  return (
    <div className="cmdk-overlay" onMouseDown={onClose}>
      <div
        className="cmdk"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar no campus"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div className="cmdk-input">
          <Search size={18} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tela, módulo ou conceito…"
            aria-label="Buscar no campus"
          />
          <button
            className="cmdk-close"
            aria-label="Fechar busca"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="cmdk-list" role="listbox">
          {list.length === 0 && (
            <p className="empty">Nada encontrado para “{q}”.</p>
          )}
          {list.map((c, i) => {
            const header = c.group !== lastGroup;
            lastGroup = c.group;
            const I = c.icon;
            return (
              <div key={c.id}>
                {header && <div className="cmdk-group">{c.group}</div>}
                <button
                  role="option"
                  aria-selected={i === active}
                  className={`cmdk-item ${i === active ? "active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    c.run();
                    onClose();
                  }}
                >
                  <I size={17} />
                  {c.label}
                  {c.hint && <small>{c.hint}</small>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="cmdk-foot">
          <span>
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> navegar
          </span>
          <span>
            <span className="kbd">
              <CornerDownLeft size={11} />
            </span>{" "}
            abrir
          </span>
        </div>
      </div>
    </div>
  );
}
