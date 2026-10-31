import { useEffect, useRef, useState } from "react";
import {
  X,
  LogOut,
  Users,
  ShieldCheck,
  Copy,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { campusRequest, type CampusUser } from "../accounts";
type Member = CampusUser & {
  completed: number;
  completedByCourse?: { aula01: number; aula02: number };
  updatedAt: string | null;
};
export default function AccountPanel({
  user,
  onClose,
  onLogout,
  onRestore,
}: {
  user: CampusUser;
  onClose: () => void;
  onLogout: () => Promise<void | false>;
  onRestore: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [members, setMembers] = useState<Member[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [link, setLink] = useState(""),
    [copied, setCopied] = useState(false);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const result = await campusRequest<{ users: Member[] }>(
        "/api/admin/users",
      );
      setMembers(result.users);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar os alunos.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const popup = dialog.current;
    popup?.showModal();
    if (user.role === "admin") void refresh();
    return () => popup?.close();
  }, []);
  async function action(member: Member, kind: "status" | "reset") {
    if (
      kind === "status" &&
      !member.disabled &&
      !confirm(
        `Desativar a conta de ${member.name}? O acesso será encerrado, mas o estudo será preservado.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setLink("");
    setCopied(false);
    try {
      const result = await campusRequest<{ token?: string }>(
        "/api/admin/users",
        { action: kind, userId: member.id, disabled: !member.disabled },
      );
      if (result.token)
        setLink(
          `${window.location.origin}${window.location.pathname}#/recuperar?token=${result.token}`,
        );
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível atualizar a conta.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      if ((await onLogout()) === false) setBusy(false);
    } catch {
      setError("Não foi possível encerrar a sessão. Tente novamente.");
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="account-dialog"
      aria-labelledby="account-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="account-dialog-head">
        <div>
          <span className="eyebrow">
            {user.role === "admin" ? "GESTÃO DO CAMPUS" : "SEU ESPAÇO"}
          </span>
          <h2 id="account-title">
            {user.role === "admin" ? "Alunos e sua conta" : "Minha conta"}
          </h2>
        </div>
        <button
          autoFocus
          className="icon-button"
          aria-label="Fechar minha conta"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      <div className="account-identity panel">
        <span className="icon-box lavender">
          <ShieldCheck />
        </span>
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
          <small>
            {user.role === "admin" ? "Administrador" : "Aluno"} · Aula 01
          </small>
        </div>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void logout()}
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </div>
      <p className="small-text">
        Seu caderno é privado. O administrador acompanha a quantidade de módulos
        concluídos, sem acesso às suas anotações.
      </p>
      {user.role === "admin" && (
        <>
          <div className="account-metrics">
            <div>
              <Users size={21} />
              <strong>
                {members.filter((member) => member.role === "student").length}
              </strong>
              <span>alunos cadastrados</span>
            </div>
            <div>
              <ShieldCheck size={21} />
              <strong>Aberto</strong>
              <span>cadastro de alunos</span>
            </div>
          </div>
          <div className="section-title">
            <div>
              <h3>Alunos da Aula 01</h3>
              <p className="small-text">
                Cada cadastro cria um aluno da Aula 01. O acesso por outros
                computadores exige hospedagem.
              </p>
            </div>
            <button
              className="icon-button"
              aria-label="Atualizar lista de alunos"
              disabled={loading || busy}
              onClick={() => void refresh()}
            >
              <RefreshCw size={18} />
            </button>
          </div>
          {loading ? (
            <p role="status">Carregando alunos…</p>
          ) : members.filter((member) => member.role === "student").length ===
            0 ? (
            <div className="account-empty">
              <Users size={28} />
              <strong>Sua turma começa aqui</strong>
              <p>
                Quando um aluno criar uma conta, ele aparecerá nesta lista com
                seu progresso.
              </p>
            </div>
          ) : (
            <div className="member-list">
              {members
                .filter((member) => member.role === "student")
                .map((member) => (
                  <article className="member-card" key={member.id}>
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.email}</span>
                      <small>
                        {member.disabled ? "Conta desativada" : "Conta ativa"}
                        {member.updatedAt
                          ? ` · Estudou em ${new Date(member.updatedAt).toLocaleDateString("pt-BR")}`
                          : " · Ainda não começou"}
                      </small>
                    </div>
                    <div className="member-progress">
                      <strong>
                        Aula 01: {member.completed}/14 · Aula 02:{" "}
                        {member.completedByCourse?.aula02 ?? 0}/14
                      </strong>
                      <span>tópicos compreendidos</span>
                      <progress
                        max={28}
                        value={
                          member.completed +
                          (member.completedByCourse?.aula02 ?? 0)
                        }
                        aria-label={`Progresso de ${member.name}`}
                      />
                    </div>
                    <div className="member-actions">
                      <button
                        className="button secondary"
                        disabled={busy || member.disabled}
                        onClick={() => void action(member, "reset")}
                      >
                        <KeyRound size={14} />
                        Recuperar acesso
                      </button>
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() => void action(member, "status")}
                      >
                        {member.disabled ? "Reativar conta" : "Desativar conta"}
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
          {link && (
            <div className="reset-share notice">
              <div>
                <strong>Link de recuperação criado</strong>
                <p>
                  Compartilhe diretamente com o aluno. Vale por uma hora e pode
                  ser usado uma vez.
                </p>
                <input aria-label="Link de recuperação" readOnly value={link} />
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(link)
                    .then(() => setCopied(true))
                    .catch(() =>
                      setError("Selecione e copie o link manualmente."),
                    );
                }}
              >
                <Copy size={15} />
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          )}
          <div className="notice">
            <ShieldCheck size={18} />
            <span>
              Configure as chaves de narração em <strong>Ouvir as aulas</strong>
              . Os alunos usam a voz configurada sem receber a chave.
            </span>
          </div>
          <details className="entry-recovery">
            <summary>Trazer meu estudo da versão anterior</summary>
            <p>
              O estudo antigo continua neste navegador. Importe-o somente se ele
              for seu; a importação substitui o estudo desta conta.
            </p>
            <button className="button secondary" onClick={onRestore}>
              Importar estudo anterior
            </button>
          </details>
        </>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
    </dialog>
  );
}
