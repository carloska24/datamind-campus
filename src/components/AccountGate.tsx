import { useEffect, useState } from "react";
import {
  BrainCircuit,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  UserRound,
  LoaderCircle,
  Mail,
  KeyRound,
} from "lucide-react";
import App from "../App";
import { campusRequest, type CampusUser, type StudyRecord } from "../accounts";
import { FactoryArt } from "./Illustrations";
import { parseRoute, routeHash } from "../navigation";
import modules from "../data/modules.json";
import "../styles.css";
import "../accounts.css";

type Mode = "login" | "register" | "setup" | "reset";
function resetToken() {
  return (
    new URLSearchParams(
      window.location.hash.startsWith("#/recuperar?")
        ? window.location.hash.split("?")[1]
        : "",
    ).get("token") || ""
  );
}

export default function AccountGate() {
  const [user, setUser] = useState<CampusUser | null>(null),
    [record, setRecord] = useState<StudyRecord>();
  const [loading, setLoading] = useState(true),
    [available, setAvailable] = useState(false),
    [needsSetup, setNeedsSetup] = useState(false);
  const [mode, setMode] = useState<Mode>(() =>
    resetToken() ? "reset" : "login",
  );
  const [setupProtected, setSetupProtected] = useState(false),
    [setupToken, setSetupToken] = useState("");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const offline = window.location.protocol === "file:";
  async function load() {
    setLoading(true);
    setError("");
    try {
      const session = await campusRequest<{
        user: CampusUser | null;
        needsSetup: boolean;
        setupProtected?: boolean;
      }>("/api/auth/session");
      setAvailable(true);
      setNeedsSetup(session.needsSetup);
      setSetupProtected(Boolean(session.setupProtected));
      if (session.needsSetup) setMode("setup");
      if (session.user && !resetToken()) {
        const study = await campusRequest<StudyRecord>(
          "/api/study",
          undefined,
          "GET",
          session.user.id,
        );
        setRecord(study);
        setUser(session.user);
      }
    } catch {
      setAvailable(false);
      setError(
        "O servidor do campus está indisponível. Aguarde um momento e tente novamente. Se estiver usando no seu computador, confira o iniciador local.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!offline) void load();
  }, []);
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (mode !== "login" && password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "reset") {
        await campusRequest("/api/auth/reset", {
          token: resetToken(),
          password,
        });
        window.history.replaceState(null, "", "#/inicio");
        setMode("login");
        setMessage("Senha atualizada. Entre com sua nova senha.");
      } else {
        const result = await campusRequest<{ user: CampusUser }>(
          `/api/auth/${mode}`,
          {
            name,
            email,
            password,
            ...(mode === "setup" ? { setupToken } : {}),
          },
        );
        const study = await campusRequest<StudyRecord>(
          "/api/study",
          undefined,
          "GET",
          result.user.id,
        );
        setRecord(study);
        setUser(result.user);
        setNeedsSetup(false);
        window.history.replaceState(
          null,
          "",
          routeHash(
            parseRoute(window.location.hash, modules.length) ?? {
              page: "home",
            },
          ),
        );
      }
      setPassword("");
      setSetupToken("");
      setConfirmPassword("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Não foi possível entrar.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    await campusRequest("/api/auth/logout", {}, "POST", user?.id);
    setUser(null);
    setEmail("");
    setName("");
    setRecord(undefined);
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    setError("");
    window.history.replaceState(null, "", "#/inicio");
  }
  if (offline) return <App />;
  if (user && record)
    return (
      <App
        key={user.id}
        account={user}
        initialRecord={record}
        onLogout={logout}
      />
    );
  return (
    <main className="account-entry">
      <div className="aurora" aria-hidden="true">
        <span />
        <i />
      </div>
      <section className="entry-story">
        <div className="brand">
          <span className="brand-icon">
            <BrainCircuit size={25} />
          </span>
          <span>
            Data<span className="brand-accent">Mind</span>
            <small>INDUSTRY LEARNING STUDIO</small>
          </span>
        </div>
        <div className="entry-copy">
          <span className="eyebrow">SEU CAMPUS DE APRENDIZAGEM</span>
          <h1>
            Conhecimento que acompanha
            <br />
            <span>a sua jornada.</span>
          </h1>
          <p>
            Explore Data Science e Big Data na indústria. Aprenda, experimente e
            guarde suas descobertas em um espaço só seu.
          </p>
        </div>
        <div className="entry-art" aria-hidden="true">
          <FactoryArt />
        </div>
        <div className="entry-benefits">
          <span>
            <BookOpen size={18} />
            14 módulos para explorar
          </span>
          <span>
            <ShieldCheck size={18} />
            Progresso na sua conta
          </span>
        </div>
      </section>
      <section className="entry-form panel" aria-label="Acesso ao campus">
        <span className="icon-box lavender">
          {mode === "setup" ? <ShieldCheck /> : <UserRound />}
        </span>
        <span className="eyebrow">
          {mode === "setup" ? "PRIMEIRO ACESSO" : "BEM-VINDO AO DATAMIND"}
        </span>
        <h2>
          {mode === "setup"
            ? "Configure seu campus"
            : mode === "register"
              ? "Comece sua jornada"
              : mode === "reset"
                ? "Crie uma nova senha"
                : "Entre no seu campus"}
        </h2>
        <p className="muted">
          {mode === "setup"
            ? "Crie a conta do administrador para gerenciar os alunos e a narração das aulas."
            : mode === "register"
              ? "Crie sua conta de aluno. Seu progresso e suas anotações ficam separados das outras contas."
              : mode === "reset"
                ? "O link pode ser usado uma vez e vale por uma hora."
                : "Retome seus estudos de onde parou."}
        </p>
        {loading ? (
          <p role="status" className="entry-loading">
            <LoaderCircle className="spin" size={20} />
            Conectando ao campus…
          </p>
        ) : available ? (
          <>
            {!needsSetup && mode !== "reset" && (
              <div className="entry-tabs">
                <button
                  type="button"
                  aria-pressed={mode === "login"}
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setPassword("");
                  }}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "register"}
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Criar conta
                </button>
              </div>
            )}
            <form onSubmit={submit}>
              {mode === "setup" && setupProtected && (
                <label className="field">
                  Código de ativação do administrador
                  <input
                    type="password"
                    name="setupToken"
                    autoComplete="off"
                    required
                    value={setupToken}
                    onChange={(event) => setSetupToken(event.target.value)}
                    disabled={busy}
                  />
                  <small>
                    Use o SETUP_TOKEN do painel do Render. Esse código é
                    necessário somente para criar o administrador.
                  </small>
                </label>
              )}
              {(mode === "register" || mode === "setup") && (
                <label className="field">
                  Seu nome
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Como você gostaria de ser chamado?"
                    disabled={busy}
                  />
                </label>
              )}
              {mode !== "reset" && (
                <label className="field">
                  <span>
                    <Mail size={15} />
                    E-mail
                  </span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    disabled={busy}
                  />
                </label>
              )}
              <label className="field">
                <span>
                  <KeyRound size={15} />
                  {mode === "reset" ? "Nova senha" : "Senha"}
                </span>
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={mode === "login" ? 1 : 12}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy}
                />
                {mode !== "login" && (
                  <small>
                    Use pelo menos 12 caracteres. Uma frase também funciona.
                  </small>
                )}
              </label>
              {mode !== "login" && (
                <label className="field">
                  Confirme a senha
                  <input
                    name="confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={busy}
                  />
                </label>
              )}
              {error && (
                <div className="notice error" role="alert">
                  {error}
                </div>
              )}
              {message && (
                <div className="notice success" role="status">
                  {message}
                </div>
              )}
              <button className="button primary entry-submit" disabled={busy}>
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={18} />
                    Aguarde…
                  </>
                ) : (
                  <>
                    {mode === "login"
                      ? "Entrar no campus"
                      : mode === "setup"
                        ? "Criar administrador"
                        : mode === "reset"
                          ? "Salvar nova senha"
                          : "Criar minha conta"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
            {mode === "login" && (
              <details className="entry-recovery">
                <summary>Esqueci minha senha</summary>
                <p>
                  Peça ao administrador do campus um link de recuperação.
                  Depois, escolha sua nova senha. Nenhuma senha é enviada por
                  e-mail.
                </p>
              </details>
            )}
          </>
        ) : (
          <>
            <div className="notice error" role="alert">
              {error}
            </div>
            <button
              className="button primary entry-submit"
              onClick={() => void load()}
            >
              Tentar novamente
            </button>
          </>
        )}
        <small className="entry-footnote">
          Aula 01 · Data Science e Big Data na Indústria
        </small>
      </section>
    </main>
  );
}
