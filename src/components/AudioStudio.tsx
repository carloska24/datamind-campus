import { useEffect, useRef, useState } from "react";
import {
  Headphones,
  Play,
  Pause,
  Square,
  Volume2,
  KeyRound,
  ShieldCheck,
  Download,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { Module } from "../types";
import { FactoryArt } from "./Illustrations";
type CredentialStatus = Record<string, "local" | "environment" | null>;
function preferredProvider() {
  try {
    const value = localStorage.getItem("datamind-audio-provider");
    return value && ["browser", "openai", "gemini"].includes(value)
      ? value
      : null;
  } catch {
    return null;
  }
}
export function narration(m: Module) {
  return [
    {
      title: "A ideia central",
      text: `Nesta aula, vamos estudar ${m.title}. ${m.idea} Primeiro, entenda o conceito. ${m.explain}`,
    },
    {
      title: "Na prática industrial",
      text: `Vamos conectar isso à prática. ${m.example}`,
    },
    {
      title: "Pare e pense",
      text: `Agora, uma pergunta para você. ${m.question} Pause a reprodução e tente responder com as suas palavras antes de seguir para o próximo trecho.`,
    },
    {
      title: "Resposta e revisão",
      text: `Vamos conferir o raciocínio. ${m.answer} Para revisar, explique a ideia central sem olhar e pense em outro exemplo da sua rotina.`,
    },
  ];
}
export default function AudioStudio({
  modules,
  initial = 0,
  initialSegment = 0,
  onPositionChange,
  canManageCredentials = false,
}: {
  modules: Module[];
  initial?: number;
  initialSegment?: number;
  onPositionChange?: (moduleId: number, position: number) => void;
  canManageCredentials?: boolean;
}) {
  const [moduleId, setModuleId] = useState(initial),
    [provider, setProvider] = useState(() => preferredProvider() || "browser"),
    [apiKey, setApiKey] = useState(""),
    [voice, setVoice] = useState("coral"),
    [gemVoice, setGemVoice] = useState("Kore"),
    [model, setModel] = useState("gemini-3.8-flash-tts"),
    [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [browserVoice, setBrowserVoice] = useState(""),
    [rate, setRate] = useState(1),
    [index, setIndex] = useState(initialSegment),
    [status, setStatus] = useState("idle"),
    [error, setError] = useState(""),
    [url, setUrl] = useState(""),
    [backend, setBackend] = useState(false),
    [credentials, setCredentials] = useState<CredentialStatus>({
      openai: null,
      gemini: null,
    }),
    [savingKey, setSavingKey] = useState(false),
    [auto, setAuto] = useState(false),
    [audioTime, setAudioTime] = useState({ current: 0, duration: 0 });
  const audio = useRef<HTMLAudioElement | null>(null),
    controller = useRef<AbortController | null>(null),
    generation = useRef(0),
    cache = useRef(new Map<string, string>()),
    indexRef = useRef(initialSegment),
    autoRef = useRef(false),
    playingRef = useRef(false),
    utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const module = modules[moduleId],
    segments = narration(module);
  useEffect(() => {
    autoRef.current = auto;
  }, [auto]);
  function stop() {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    playingRef.current = false;
    window.speechSynthesis?.cancel();
    audio.current?.pause();
    utterance.current = null;
    setStatus("idle");
  }
  function clearAudio() {
    stop();
    cache.current.forEach((u) => URL.revokeObjectURL(u));
    cache.current.clear();
    setUrl("");
    setAudioTime({ current: 0, duration: 0 });
    setError("");
  }
  useEffect(() => {
    if (moduleId === initial && indexRef.current === initialSegment) return;
    clearAudio();
    setModuleId(initial);
    indexRef.current = initialSegment;
    setIndex(initialSegment);
  }, [initial, initialSegment]);
  useEffect(() => {
    if ("speechSynthesis" in window) {
      const sync = () =>
        setVoices(
          window.speechSynthesis
            .getVoices()
            .filter((v) => v.lang.toLowerCase().startsWith("pt")),
        );
      sync();
      window.speechSynthesis.addEventListener("voiceschanged", sync);
      return () =>
        window.speechSynthesis.removeEventListener("voiceschanged", sync);
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    fetch("/api/health")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((j) => {
        if (!mounted) return;
        setBackend(j.service === "aula01-audio");
        if (j.service === "aula01-audio" && j.credentials) {
          setCredentials(j.credentials);
          if (!preferredProvider()) {
            if (j.credentials.openai) setProvider("openai");
            else if (j.credentials.gemini) setProvider("gemini");
          }
        }
      })
      .catch(() => {
        if (mounted) setBackend(false);
      });
    return () => {
      mounted = false;
      generation.current++;
      controller.current?.abort();
      window.speechSynthesis?.cancel();
      audio.current?.pause();
      cache.current.forEach((u) => URL.revokeObjectURL(u));
      cache.current.clear();
    };
  }, []);
  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate;
  }, [rate, url]);
  async function updateCredential(remove = false) {
    clearAudio();
    setSavingKey(true);
    try {
      const response = await fetch("/api/credentials", {
        method: remove ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...(remove ? {} : { apiKey }) }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "Não foi possível atualizar a chave.");
      setCredentials(result.credentials);
      setApiKey("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível atualizar a chave.",
      );
    } finally {
      setSavingKey(false);
    }
  }
  function selectSegment(n: number) {
    stop();
    indexRef.current = n;
    setIndex(n);
    onPositionChange?.(moduleId, n);
    setUrl("");
    setAudioTime({ current: 0, duration: 0 });
    setError("");
  }
  function finish(token: number, n: number) {
    if (generation.current !== token) return;
    playingRef.current = false;
    setStatus("idle");
    if (autoRef.current && n < 3) {
      indexRef.current = n + 1;
      setIndex(n + 1);
      void play(n + 1);
    }
  }
  async function play(n = indexRef.current) {
    stop();
    setError("");
    const token = generation.current;
    indexRef.current = n;
    setIndex(n);
    onPositionChange?.(moduleId, n);
    if (provider === "browser") {
      if (!("speechSynthesis" in window)) {
        setError(
          "Este navegador não oferece narração. Use Chrome/Edge ou conecte uma API.",
        );
        return;
      }
      const u = new SpeechSynthesisUtterance(
        narration(modules[moduleId])[n].text,
      );
      u.lang = "pt-BR";
      u.rate = rate;
      u.voice =
        voices.find((v) => v.voiceURI === browserVoice) ||
        voices.find((v) => v.lang === "pt-BR") ||
        voices[0] ||
        null;
      utterance.current = u;
      u.onend = () => finish(token, n);
      u.onerror = (e) => {
        if (
          generation.current !== token ||
          e.error === "interrupted" ||
          e.error === "canceled"
        )
          return;
        playingRef.current = false;
        setError(
          "A voz não pôde ser reproduzida. Verifique as vozes em português no sistema ou use a conexão por API.",
        );
        setStatus("idle");
      };
      u.onstart = () => {
        if (generation.current === token) {
          playingRef.current = true;
          setStatus("playing");
        }
      };
      window.speechSynthesis.speak(u);
      setStatus("starting");
      return;
    }
    if (!backend) {
      setError(
        "Para usar a API, abra o projeto pelo INICIAR_WINDOWS.bat ou npm start. A versão ABRIR.html oferece voz do navegador.",
      );
      return;
    }
    if (!credentials[provider]) {
      setError(
        canManageCredentials
          ? "Salve a chave de API para gerar este trecho."
          : "O administrador ainda não configurou este provedor. Use a voz do navegador.",
      );
      return;
    }
    setStatus("loading");
    const key = `${provider}-${model}-${voice}-${gemVoice}-${moduleId}-${n}`;
    try {
      let blobUrl = cache.current.get(key);
      if (!blobUrl) {
        controller.current = new AbortController();
        const r = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.current.signal,
          body: JSON.stringify({
            provider,
            moduleId,
            sectionIndex: n,
            voice: provider === "openai" ? voice : gemVoice,
            model: provider === "openai" ? "gpt-4o-mini-tts" : model,
          }),
        });
        if (!r.ok) {
          let msg = "Não foi possível gerar o áudio.";
          try {
            msg = (await r.json()).error || msg;
          } catch {}
          throw Error(msg);
        }
        const blob = await r.blob();
        if (generation.current !== token) return;
        blobUrl = URL.createObjectURL(blob);
        cache.current.set(key, blobUrl);
      }
      if (generation.current !== token) return;
      setUrl(blobUrl);
      const element = audio.current!;
      element.src = blobUrl;
      element.playbackRate = rate;
      element.onended = () => finish(token, n);
      element.ontimeupdate = () =>
        setAudioTime({
          current: element.currentTime,
          duration: Number.isFinite(element.duration) ? element.duration : 0,
        });
      await element.play();
      if (generation.current === token) {
        playingRef.current = true;
        setStatus("playing");
      }
    } catch (e) {
      if (generation.current !== token) return;
      playingRef.current = false;
      setStatus("idle");
      setError(e instanceof Error ? e.message : "Erro ao gerar áudio.");
    }
  }
  function toggle() {
    if (status === "playing") {
      if (provider === "browser") window.speechSynthesis.pause();
      else audio.current?.pause();
      setStatus("paused");
    } else if (status === "paused") {
      if (provider === "browser") window.speechSynthesis.resume();
      else
        void audio.current
          ?.play()
          .catch(() => setError("Clique em reiniciar para tocar este trecho."));
      setStatus("playing");
    } else void play();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MENOS LEITURA. MAIS COMPREENSÃO.</span>
          <h1>
            Sua aula, em voz alta<span>.</span>
          </h1>
          <p>Ouça em português, acompanhe os trechos e pare para pensar.</p>
        </div>
        <span className="tag">
          <Headphones size={15} />
          Estudo com áudio
        </span>
      </div>
      <div className="audio-grid">
        <div>
          <div className="audio-cover">
            <div>
              <span className="light-label">AULA 01 · NARRAÇÃO SINTÉTICA</span>
              <h2>
                O conhecimento
                <br />
                também entra
                <br />
                pelos ouvidos.
              </h2>
              <p>
                Uma pausa para a tela.
                <br />
                Um novo jeito de estudar.
              </p>
            </div>
            <FactoryArt compact />
          </div>
          <div className="panel audio-player">
            <div className="player-heading">
              <span className="icon-box lavender">
                <Headphones />
              </span>
              <div>
                <small>VOCÊ ESTÁ OUVINDO</small>
                <h3>{module.title}</h3>
              </div>
            </div>
            <label className="field">
              Escolher aula
              <select
                value={moduleId}
                onChange={(e) => {
                  clearAudio();
                  setModuleId(+e.target.value);
                  setIndex(0);
                  indexRef.current = 0;
                  onPositionChange?.(+e.target.value, 0);
                }}
              >
                {modules.map((m) => (
                  <option value={m.id} key={m.id}>
                    {String(m.id + 1).padStart(2, "0")} · {m.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="waveform" aria-hidden="true">
              {Array.from({ length: 48 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: 12 + ((i * 37) % 41),
                    animationDelay: `${i * 0.035}s`,
                  }}
                  className={status === "playing" ? "moving" : ""}
                />
              ))}
            </div>
            <div className="player-controls">
              <button
                className="icon-button"
                aria-label="Trecho anterior"
                disabled={index === 0}
                onClick={() => selectSegment(index - 1)}
              >
                <SkipBack size={19} />
              </button>
              <button
                className="play-button"
                aria-label={
                  status === "playing"
                    ? "Pausar narração"
                    : "Reproduzir narração"
                }
                onClick={toggle}
                disabled={
                  savingKey || status === "loading" || status === "starting"
                }
              >
                {status === "loading" || status === "starting" ? (
                  <LoaderCircle className="spin" />
                ) : status === "playing" ? (
                  <Pause fill="currentColor" />
                ) : (
                  <Play fill="currentColor" />
                )}
              </button>
              <button
                className="icon-button"
                aria-label="Próximo trecho"
                disabled={index === 3}
                onClick={() => selectSegment(index + 1)}
              >
                <SkipForward size={19} />
              </button>
              <button
                className="icon-button"
                aria-label="Parar narração"
                onClick={stop}
              >
                <Square size={18} />
              </button>
              <select
                className="speed-select"
                aria-label="Velocidade da narração"
                value={rate}
                onChange={(e) => setRate(+e.target.value)}
              >
                {[0.75, 1, 1.25, 1.5].map((r) => (
                  <option key={r} value={r}>
                    {r}×
                  </option>
                ))}
              </select>
            </div>
            <p className="player-status" role="status">
              {status === "loading"
                ? "Gerando este trecho pela API…"
                : status === "playing"
                  ? "Reproduzindo"
                  : status === "paused"
                    ? "Pausado"
                    : status === "starting"
                      ? "Iniciando voz…"
                      : "Pronto para ouvir"}{" "}
              · trecho {index + 1} de 4
            </p>
            {provider !== "browser" && url && (
              <>
                <label className="sr-only" htmlFor="audioSeek">
                  Posição do áudio
                </label>
                <input
                  id="audioSeek"
                  className="audio-seek"
                  type="range"
                  min="0"
                  max={audioTime.duration || 1}
                  value={audioTime.current}
                  onChange={(e) => {
                    if (audio.current)
                      audio.current.currentTime = +e.target.value;
                  }}
                />
                <a
                  className="text-link"
                  href={url}
                  download={`Aula01_${moduleId + 1}_Trecho${index + 1}.${provider === "openai" ? "mp3" : "wav"}`}
                >
                  <Download size={15} />
                  Baixar este trecho
                </a>
              </>
            )}
            <label className="check-label">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
              Continuar para o próximo trecho automaticamente
            </label>
            <p className="small-text">
              Na voz do navegador, a nova velocidade vale ao reiniciar o trecho.
              Em API, vale durante a reprodução.
            </p>
            {error && (
              <div className="notice error" role="alert">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
            <audio
              ref={audio}
              preload="metadata"
              onError={() => {
                setError(
                  "O navegador não conseguiu decodificar o áudio. Tente gerar novamente ou use a voz do navegador.",
                );
                setStatus("idle");
              }}
            />
          </div>
          <div className="section-title">
            <h2>Acompanhe a explicação</h2>
            <span>4 trechos por aula</span>
          </div>
          <div className="transcript">
            {segments.map((s, n) => (
              <button
                key={n}
                className={`transcript-block ${n === index ? "current" : ""}`}
                onClick={() => selectSegment(n)}
              >
                <span className="transcript-number">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
                {n === index && <Volume2 size={20} />}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="panel voice-settings">
            <span className="icon-box mint">
              <Volume2 />
            </span>
            <h3>Escolha a sua voz</h3>
            <p className="muted">
              {canManageCredentials
                ? "Configure a narração para os alunos do campus."
                : "Escolha a narração disponível para suas aulas."}
            </p>
            <div className="provider-options">
              {[
                ["browser", "Voz do navegador", "Sem chave de API"],
                ["openai", "OpenAI", "Narração por IA"],
                ["gemini", "Google Gemini", "Narração por IA"],
              ].map(([id, name, sub]) => (
                <button
                  key={id}
                  className={provider === id ? "selected" : ""}
                  disabled={savingKey}
                  onClick={() => {
                    clearAudio();
                    setApiKey("");
                    setProvider(id);
                    try {
                      localStorage.setItem("datamind-audio-provider", id);
                    } catch {}
                  }}
                >
                  <span>
                    <strong>{name}</strong>
                    <small>{credentials[id] ? "Chave configurada" : sub}</small>
                  </span>
                  {provider === id ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <ChevronRight size={17} />
                  )}
                </button>
              ))}
            </div>
            {provider === "browser" ? (
              <>
                <label className="field">
                  Voz em português
                  <select
                    value={browserVoice}
                    onChange={(e) => setBrowserVoice(e.target.value)}
                  >
                    <option value="">Automática · português brasileiro</option>
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} · {v.lang}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="notice">
                  <Volume2 size={18} />
                  <span>
                    A qualidade depende das vozes instaladas no sistema.{" "}
                    {voices.length === 0
                      ? "Nenhuma voz em português foi detectada até agora."
                      : "Vozes em português disponíveis."}
                  </span>
                </div>
              </>
            ) : (
              <>
                {credentials[provider] && (
                  <div className="notice success" role="status">
                    <ShieldCheck size={18} />
                    <span>
                      {credentials[provider] === "environment"
                        ? "Chave configurada no servidor. Pronta para usar."
                        : "Chave salva neste computador. Você não precisa inseri-la novamente."}
                    </span>
                  </div>
                )}
                {canManageCredentials &&
                  credentials[provider] !== "environment" && (
                    <>
                      <label className="field">
                        <span>
                          <KeyRound size={15} />
                          {credentials[provider]
                            ? "Substituir chave de API"
                            : "Sua chave de API"}
                        </span>
                        <input
                          type="password"
                          autoComplete="off"
                          disabled={savingKey || !backend}
                          placeholder={
                            provider === "openai"
                              ? "Chave da OpenAI Platform"
                              : "Chave do Google AI Studio"
                          }
                          value={apiKey}
                          onChange={(e) => {
                            clearAudio();
                            setApiKey(e.target.value);
                          }}
                        />
                        <small>
                          Salve para reutilizar a chave mesmo após fechar o
                          projeto.
                        </small>
                      </label>
                      <button
                        className="button primary"
                        disabled={
                          !backend || savingKey || apiKey.trim().length < 10
                        }
                        onClick={() => void updateCredential()}
                      >
                        {savingKey
                          ? "Atualizando…"
                          : "Salvar chave neste computador"}
                      </button>
                      {credentials[provider] && (
                        <button
                          className="text-link clear-key"
                          disabled={savingKey || !backend}
                          onClick={() => void updateCredential(true)}
                        >
                          Remover chave salva
                        </button>
                      )}
                    </>
                  )}
                <label className="field">
                  Voz
                  <select
                    value={provider === "openai" ? voice : gemVoice}
                    onChange={(e) => {
                      clearAudio();
                      provider === "openai"
                        ? setVoice(e.target.value)
                        : setGemVoice(e.target.value);
                    }}
                  >
                    {(provider === "openai"
                      ? ["coral", "alloy", "nova", "onyx", "sage", "shimmer"]
                      : ["Kore", "Puck", "Aoede", "Charon", "Zephyr", "Sulafat"]
                    ).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                {!canManageCredentials && !credentials[provider] && (
                  <div className="notice">
                    <ShieldCheck size={18} />
                    <span>
                      Este provedor ainda não foi configurado pelo
                      administrador. Você pode usar a voz do navegador.
                    </span>
                  </div>
                )}
                {canManageCredentials && provider === "gemini" && (
                  <label className="field">
                    Modelo TTS
                    <input
                      value={model}
                      onChange={(e) => {
                        clearAudio();
                        setModel(e.target.value);
                      }}
                    />
                    <small>
                      Endpoint Interactions. Padrão: gemini-3.8-flash-tts;
                      depende do acesso da sua conta.
                    </small>
                  </label>
                )}
                <div className={`notice ${backend ? "success" : ""}`}>
                  <ShieldCheck size={18} />
                  <span>
                    {backend
                      ? "Servidor local disponível. A chave salva fica na configuração privada do projeto, fora do navegador e do caderno."
                      : "Abra pelo iniciador local para habilitar as APIs."}
                  </span>
                </div>
                <p className="small-text">
                  {canManageCredentials ? (
                    <>
                      Ao clicar em reproduzir, o texto do trecho é enviado ao
                      serviço escolhido. A API pode ter cobrança própria e
                      precisa de acesso a um modelo de voz. A assinatura do
                      aplicativo não configura uma chave neste projeto.
                    </>
                  ) : (
                    <>
                      A voz é sintética. Ao reproduzir, o roteiro da aula é
                      enviado ao serviço escolhido. Suas anotações não fazem
                      parte desse envio.
                    </>
                  )}
                </p>
                {canManageCredentials && (
                  <a
                    className="text-link"
                    target="_blank"
                    rel="noreferrer"
                    href={
                      provider === "openai"
                        ? "https://platform.openai.com/api-keys"
                        : "https://aistudio.google.com/api-keys"
                    }
                  >
                    Abrir painel de chaves
                    <ChevronRight size={14} />
                  </a>
                )}
              </>
            )}
            <div className="audio-hint">
              <Headphones size={22} />
              <h4>Ouvir também é interagir.</h4>
              <p>
                No terceiro trecho, pause e responda à pergunta. Depois, ouça a
                explicação e compare com o seu raciocínio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
