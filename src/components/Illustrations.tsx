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
export function TopicArt({
  kind = 0,
  tone,
}: {
  kind?: number;
  tone?: number;
}) {
  const strong = tones[(tone ?? kind) % tones.length];
  const colors = [`${strong}40`, strong];
  const paper = "var(--art-paper)";
  return (
    <svg
      viewBox="0 0 240 130"
      className="topic-art"
      role="img"
      aria-label={
        [
          "Dados industriais conectados",
          "Processo de descoberta de conhecimento",
          "Tabela e análise com Pandas",
          "Análise de indicadores",
        ][kind % 4]
      }
    >
      <ellipse
        cx="120"
        cy="110"
        rx="80"
        ry="11"
        fill={colors[1]}
        opacity=".25"
      />
      {kind % 4 === 0 ? (
        <>
          <path d="M70 58 117 32l53 29-49 29Z" fill={colors[1]} />
          <path d="M70 58v32l51 29V90Z" fill={paper} />
          <path d="m121 90 49-29v32l-49 26Z" fill={colors[0]} />
          <path d="M91 72v24m16-15v24" stroke={colors[1]} strokeWidth="7" />
          <circle cx="53" cy="37" r="15" fill={colors[0]} />
          <circle cx="190" cy="41" r="20" fill={colors[0]} />
          <path
            d="M53 52v30h17m100-10h20V61"
            fill="none"
            stroke={colors[1]}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </>
      ) : kind % 4 === 1 ? (
        <>
          <path d="M47 77h147" stroke={colors[1]} strokeWidth="3" />
          {[0, 1, 2, 3, 4].map((n) => (
            <g key={n}>
              <rect
                x={35 + n * 37}
                y={50 - (n % 2) * 14}
                width="28"
                height="46"
                rx="8"
                fill={n === 4 ? colors[1] : colors[0]}
              />
              <circle
                cx={49 + n * 37}
                cy={68 - (n % 2) * 14}
                r="6"
                fill={n === 4 ? "#b2f0df" : colors[1]}
              />
            </g>
          ))}
          <path d="m101 24 18-13 20 13-19 12Z" fill="#ffcd85" />
        </>
      ) : kind % 4 === 2 ? (
        <>
          <rect
            x="49"
            y="23"
            width="147"
            height="87"
            rx="10"
            fill={paper}
            stroke={colors[1]}
            strokeWidth="2"
          />
          <path d="M49 45h147" stroke={colors[1]} strokeWidth="2" />
          <circle cx="61" cy="34" r="3" fill="#ec9c80" />
          <circle cx="73" cy="34" r="3" fill="#eac473" />
          <circle cx="85" cy="34" r="3" fill="#77caae" />
          {[0, 1, 2].map((n) => (
            <g key={n}>
              <rect
                x="62"
                y={55 + n * 16}
                width="26"
                height="8"
                rx="3"
                fill={colors[0]}
              />
              <path
                d={`M101 ${59 + n * 16}h28m10 0h42`}
                stroke={colors[1]}
                strokeWidth="5"
                opacity={0.35 + n * 0.2}
              />
            </g>
          ))}
          <rect x="28" y="78" width="43" height="33" rx="8" fill={colors[1]} />
          <path
            d="m40 89-5 5 5 5m19-10 5 5-5 5"
            stroke="#fff"
            fill="none"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <rect x="45" y="24" width="150" height="89" rx="12" fill={paper} />
          <path d="M65 91V43m0 48h104" stroke="#c8d4e7" strokeWidth="2" />
          <path
            d="m76 81 20-10 23 6 23-23 24-11"
            stroke={colors[1]}
            strokeWidth="4"
            fill="none"
          />
          {[
            [76, 81],
            [96, 71],
            [119, 77],
            [142, 54],
            [166, 43],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="5" fill={colors[1]} />
          ))}
          <circle cx="184" cy="95" r="20" fill="#a9e6d4" />
          <path
            d="m174 95 7 7 13-15"
            stroke="#277966"
            strokeWidth="3"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}
