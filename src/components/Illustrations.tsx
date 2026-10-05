import { useId } from "react";
export function FactoryArt({ compact = false }: { compact?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 620 420"
      className={`factory-art ${compact ? "compact" : ""}`}
      role="img"
      aria-label="Fábrica conectada: máquina, placa eletrônica e painel de dados"
    >
      <defs>
        <linearGradient id={id} x2="1" y2="1">
          <stop stopColor="#8c82ff" />
          <stop offset="1" stopColor="#5440cb" />
        </linearGradient>
      </defs>
      <ellipse
        cx="319"
        cy="350"
        rx="245"
        ry="41"
        fill="#3b2d92"
        opacity=".18"
      />
      <path d="m80 268 202-116 243 139-201 116Z" fill="#dbd7ff" />
      <path d="m80 268 244 139v-25L80 243Z" fill="#bbb3f6" />
      <path d="m324 382 201-116v25L324 407Z" fill="#a297e8" />
      <g className="art-float">
        <path d="m365 82 150 86v124l-150-85Z" fill="#fff" />
        <path d="m365 82-18 11v124l18-10Z" fill="#c1b9ef" />
        <path d="m380 112 120 69v82l-120-69Z" fill="#251f58" />
        <path
          d="m391 177 18-20 20 41 19-7 22 28 18-16"
          fill="none"
          stroke="#75e7c7"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="m393 133 35 20m-35-10 20 12"
          stroke="#a79bfa"
          strokeWidth="4"
        />
        <circle cx="489" cy="251" r="3" fill="#75e7c7" />
      </g>
      <path d="m143 233 102-58 99 58-101 59Z" fill="#eeeaff" />
      <path d="m143 233 100 59v61l-100-59Z" fill="#f8f7ff" />
      <path d="m243 292 101-59v61l-101 59Z" fill="#c1b6f1" />
      <path d="m160 250 65 37v26l-65-38Z" fill="#382d77" />
      <path d="m168 266 48 28" stroke="#75e7c7" strokeWidth="4" />
      <path d="m255 298 73-42v23l-73 42Z" fill="#8f80dc" />
      <path d="m195 195 18-10 50 29-18 10Z" fill="#8a78d5" />
      <path d="m213 185 50 29v-57l-50-29Z" fill="#e5dffa" />
      <path d="m195 195 18-10v-57l-18 10Z" fill="#b7a8e9" />
      <path d="m195 138 18-10 50 29-18 10Z" fill="#fff" />
      <path d="m234 143 22-12 44 25v18l-44-24-22 12Z" fill="#ffba72" />
      <path d="m279 156 21-12 26 15-21 12Z" fill="#ffe0b6" />
      <path d="m279 156 26 15v41l-26-15Z" fill="#ffad59" />
      <path d="m305 171 21-12v41l-21 12Z" fill="#ec8950" />
      <path d="m298 218 17-10 16 10-17 10Z" fill="#443879" />
      <path d="M314 219v21" stroke="#443879" strokeWidth="5" />
      <g>
        <path d="m332 301 98-56 67 39-98 56Z" fill="#4abea4" />
        <path
          d="m347 300 78-43 48 28-78 44Z"
          fill="none"
          stroke="#a0f4d4"
          strokeWidth="2"
        />
        <path d="m384 292 24-14 22 13-24 14Z" fill="#203b59" />
        <path
          d="m351 301 23-13m39 27 24-14m-61-18 18-10"
          stroke="#c5ffdf"
          strokeWidth="3"
        />
        <circle cx="452" cy="285" r="3" fill="#ffda91" />
      </g>
      <g className="art-float delay">
        <rect x="76" y="71" width="136" height="93" rx="17" fill="#fff" />
        <rect x="91" y="88" width="42" height="8" rx="4" fill="#ded9fa" />
        <rect x="91" y="114" width="14" height="32" rx="4" fill="#b2a4f4" />
        <rect x="113" y="107" width="14" height="39" rx="4" fill="#9c8aea" />
        <rect x="135" y="120" width="14" height="26" rx="4" fill="#c0b5f7" />
        <rect x="157" y="99" width="14" height="47" rx="4" fill="#7560d4" />
        <circle cx="185" cy="88" r="8" fill="#75e7c7" />
      </g>
      <circle cx="345" cy="60" r="15" fill="#ffd17e" />
      <path d="m340 60 4 4 7-8" fill="none" stroke="#694b25" strokeWidth="3" />
      <circle cx="534" cy="326" r="19" fill="#92e9d0" />
      <path d="M527 326h14m-7-7v14" stroke="#226854" strokeWidth="3" />
    </svg>
  );
}
const tones = ["#8b6cff", "#22d3ee", "#60a5fa", "#34d399", "#fbbf24"];
export function TopicArt({ kind = 0, tone }: { kind?: number; tone?: number }) {
  const accent = [
    "var(--blue)",
    "var(--blue)",
    "var(--blue)",
    "var(--mint)",
    "var(--amber)",
  ][(tone ?? kind) % 5];
  const labels = [
    "Fontes de dados industriais conectadas",
    "Cinco etapas da descoberta de conhecimento",
    "Tabela com linhas e colunas para análise com Pandas",
    "Indicadores e análise de dados industriais",
  ];
  return (
    <svg
      viewBox="0 0 240 130"
      className="topic-art"
      role="img"
      aria-label={labels[kind % 4]}
    >
      <g fill="none" stroke="var(--border-strong)" strokeWidth="1">
        <path d="M20 15v8m-4-4h8M220 15v8m-4-4h8M20 107v8m-4-4h8M220 107v8m-4-4h8" />
      </g>
      {kind % 4 === 0 ? (
        <g>
          <path
            d="M56 36 120 65 183 33M56 96 120 65 183 97"
            stroke="var(--border-strong)"
            fill="none"
            strokeDasharray="3 4"
          />
          {[
            [56, 36],
            [56, 96],
            [183, 33],
            [183, 97],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect
                x={x - 14}
                y={y - 13}
                width="28"
                height="26"
                rx="5"
                fill="var(--surface)"
                stroke="var(--border-strong)"
              />
              <path
                d={`M${x - 6} ${y - 3}h12M${x - 6} ${y + 3}h8`}
                stroke="var(--text-3)"
                strokeWidth="1.5"
              />
            </g>
          ))}
          <circle
            cx="120"
            cy="65"
            r="25"
            fill="var(--surface)"
            stroke={accent}
            strokeWidth="1.5"
          />
          <circle cx="120" cy="65" r="14" fill={accent} opacity=".12" />
          <path d="M111 65h18M120 56v18" stroke={accent} strokeWidth="2" />
        </g>
      ) : kind % 4 === 1 ? (
        <g>
          <path
            d="M35 65h170"
            stroke="var(--border-strong)"
            strokeDasharray="3 4"
          />
          {[35, 77, 120, 163, 205].map((x, i) => (
            <g key={x}>
              <circle
                cx={x}
                cy="65"
                r="14"
                fill={i === 2 ? accent : "var(--surface)"}
                stroke={i === 2 ? accent : "var(--border-strong)"}
              />
              <text
                x={x}
                y="69"
                fontSize="9"
                textAnchor="middle"
                fill={i === 2 ? "var(--surface)" : "var(--text-3)"}
                fontFamily="monospace"
              >
                {i + 1}
              </text>
            </g>
          ))}
          <path d="M77 84v14h86V84" stroke="var(--border-strong)" fill="none" />
          <path d="m81 90-4-6-4 6" stroke="var(--border-strong)" fill="none" />
          <rect
            x="101"
            y="25"
            width="38"
            height="13"
            rx="3"
            fill={accent}
            opacity=".12"
          />
          <path d="M111 32h18" stroke={accent} />
        </g>
      ) : kind % 4 === 2 ? (
        <g>
          <rect
            x="45"
            y="22"
            width="150"
            height="87"
            rx="6"
            fill="var(--surface)"
            stroke="var(--border-strong)"
          />
          <path
            d="M45 46h150M45 67h150M45 88h150M75 46v63M119 22v87M159 22v87"
            stroke="var(--border-strong)"
          />
          <rect
            x="120"
            y="23"
            width="38"
            height="85"
            fill={accent}
            opacity=".09"
          />
          <text
            x="60"
            y="37"
            fontSize="8"
            fill="var(--text-3)"
            fontFamily="monospace"
          >
            #
          </text>
          {["A", "B", "C"].map((n, i) => (
            <text
              x={91 + i * 40}
              y="37"
              key={n}
              fontSize="8"
              fill={accent}
              fontFamily="monospace"
            >
              {n}
            </text>
          ))}
          {[0, 1, 2].map((n) => (
            <g key={n}>
              <text
                x="57"
                y={60 + n * 21}
                fontSize="8"
                fill="var(--text-3)"
                fontFamily="monospace"
              >
                {n}
              </text>
              <path
                d={`M86 ${57 + n * 21}h18M128 ${57 + n * 21}h17M168 ${57 + n * 21}h13`}
                stroke="var(--text-3)"
                opacity=".7"
              />
            </g>
          ))}
        </g>
      ) : (
        <g>
          <path
            d="M45 27v77h153M45 44h150M45 65h150M45 85h150"
            stroke="var(--border-strong)"
            fill="none"
          />
          <path
            d="M62 88 93 69 120 78 150 45 184 32"
            stroke={accent}
            strokeWidth="2"
            fill="none"
          />
          {[
            [62, 88],
            [93, 69],
            [120, 78],
            [150, 45],
            [184, 32],
          ].map(([x, y]) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r="4"
              fill="var(--surface)"
              stroke={accent}
              strokeWidth="1.5"
            />
          ))}
          <path
            d="M62 91v12M93 72v31M120 81v22M150 48v55M184 35v68"
            stroke={accent}
            opacity=".12"
            strokeWidth="12"
          />
          <text
            x="45"
            y="119"
            fontSize="7"
            fill="var(--text-3)"
            fontFamily="monospace"
          >
            OBSERVAR → INVESTIGAR
          </text>
        </g>
      )}
    </svg>
  );
}
