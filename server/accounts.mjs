import { mkdir, readFile, rename, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const hashOptions = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
export const SESSION_SECONDS = 12 * 60 * 60;
const digest = (value) => createHash("sha256").update(value).digest("hex");
const publicUser = ({ id, name, email, role, disabled, createdAt }) => ({
  id,
  name,
  email,
  role,
  disabled,
  createdAt,
});
const emptyStudy = () => ({
  done: [],
  notes: {},
  lastActivity: null,
  revision: 0,
  updatedAt: null,
});
export function accountError(status, message) {
  return Object.assign(new Error(message), { status });
}
function identity(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (name.length < 2 || name.length > 80)
    throw accountError(400, "Informe seu nome (2 a 80 caracteres).");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw accountError(400, "Informe um e-mail válido.");
  return { name, email };
}
function password(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128)
    throw accountError(400, "Use uma senha de 12 a 128 caracteres.");
  return value;
}
async function encodePassword(value) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password(value), salt, 64, hashOptions);
  return { salt, hash: key.toString("hex") };
}
async function matches(value, encoded) {
  if (typeof value !== "string" || value.length > 128) return false;
  const key = await derive(value, encoded.salt, 64, hashOptions);
  return timingSafeEqual(key, Buffer.from(encoded.hash, "hex"));
}
export function validateStudy(body, nested = false) {
  if (
    !Array.isArray(body.done) ||
    body.done.some((id) => !Number.isInteger(id) || id < 0 || id >= 14)
  )
    throw accountError(400, "Progresso inválido.");
  if (
    !body.notes ||
    typeof body.notes !== "object" ||
    Array.isArray(body.notes) ||
    Object.entries(body.notes).some(
      ([id, text]) =>
        !/^(?:[0-9]|1[0-3])$/.test(id) ||
        typeof text !== "string" ||
        text.length > 20000,
    )
  )
    throw accountError(
      400,
      "Anotações inválidas (até 20 mil caracteres por módulo).",
    );
  const activity = body.lastActivity;
  // Only valid study destinations are persisted, never arbitrary URLs or HTML.
  if (
    activity !== null &&
    (typeof activity !== "string" ||
      !/^#\/(?:aula02\/)?(?:projeto\/[1-5]|aula\/(?:[1-9]|1[0-4])|audio\/(?:[1-9]|1[0-4])\/[1-4]|kdd\/[1-5]|laboratorios\/[1-4]|revisao\/(?:[1-9]|1[0-4]))$/.test(
        activity,
      ))
  )
    throw accountError(400, "Atividade inválida.");
  if (!Number.isInteger(body.revision) || body.revision < 0)
    throw accountError(400, "Versão do estudo inválida.");
  if (
    typeof activity === "string" &&
    !activity.startsWith("#/aula02/") &&
    (/^#\/laboratorios\/[34]$/.test(activity) ||
      activity.startsWith("#/projeto/"))
  )
    throw accountError(400, "Atividade inválida.");
  if (typeof activity === "string" && activity.startsWith("#/aula02/kdd/"))
    throw accountError(400, "Atividade inválida.");
  const courses = {};
  if (body.courses !== undefined) {
    if (
      nested ||
      !body.courses ||
      typeof body.courses !== "object" ||
      Array.isArray(body.courses) ||
      Object.keys(body.courses).some((key) => key !== "aula02")
    )
      throw accountError(400, "Aula inválida.");
    if (body.courses.aula02) {
      const validated = validateStudy(
        { ...body.courses.aula02, lastActivity: null, revision: 0 },
        true,
      );
      courses.aula02 = { done: validated.done, notes: validated.notes };
    }
  }
  return {
    ...(Object.keys(courses).length ? { courses } : {}),
    done: [...new Set(body.done)],
    notes: { ...body.notes },
    lastActivity: activity,
  };
}

// Local pilot: one server process owns this file; writes are serialized and atomic.
export async function createAccountStore({
  file = new URL("../.local/campus-accounts.json", import.meta.url),
  now = Date.now,
} = {}) {
  const filePath = file instanceof URL ? fileURLToPath(file) : file;
  let data = { version: 1, users: [], studies: {}, resets: [] };
  try {
    data = JSON.parse(await readFile(filePath, "utf8"));
    if (
      data.version !== 1 ||
      !Array.isArray(data.users) ||
      !data.studies ||
      !Array.isArray(data.resets)
    )
      throw Error();
  } catch (e) {
    if (e.code !== "ENOENT")
      throw Error(
        "Não foi possível ler as contas do campus. Preserve .local/campus-accounts.json e confira o arquivo.",
      );
  }
  const sessions = new Map();
  const dummy = await encodePassword(randomBytes(24).toString("hex"));
  let pending = Promise.resolve();
  function update(operation) {
    const task = pending.then(async () => {
      const next = structuredClone(data);
      const result = await operation(next);
      const temporary = `${filePath}.${randomUUID()}.tmp`;
      try {
        await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
        await writeFile(temporary, JSON.stringify(next), {
          flag: "wx",
          mode: 0o600,
        });
        await rename(temporary, filePath);
      } catch {
        await rm(temporary, { force: true }).catch(() => {});
        throw accountError(
          503,
          "Não foi possível salvar no servidor. Confira o espaço e as permissões da pasta .local.",
        );
      }
      data = next;
      return result;
    });
    pending = task.catch(() => {});
    return task;
  }
  function issue(user) {
    for (const [key, session] of sessions)
      if (session.expires <= now()) sessions.delete(key);
    const token = randomBytes(32).toString("hex");
    sessions.set(digest(token), {
      userId: user.id,
      expires: now() + SESSION_SECONDS * 1000,
    });
    return { token, user: publicUser(user) };
  }
  function invalidate(userId) {
    for (const [key, session] of sessions)
      if (session.userId === userId) sessions.delete(key);
  }
  return {
    needsSetup: () => data.users.length === 0,
    async create(body, setup = false) {
      const result = await update(async (next) => {
        if (setup && next.users.length)
          throw accountError(
            409,
            "O administrador já foi criado. Entre com sua conta.",
          );
        if (!setup && !next.users.length)
          throw accountError(
            409,
            "O administrador precisa configurar o campus primeiro.",
          );
        const person = identity(body);
        if (next.users.some((user) => user.email === person.email))
          throw accountError(
            409,
            "Não foi possível cadastrar esse e-mail. Tente entrar ou fale com o administrador.",
          );
        const user = {
          id: randomUUID(),
          ...person,
          role: setup ? "admin" : "student",
          disabled: false,
          createdAt: new Date(now()).toISOString(),
          password: await encodePassword(body.password),
        };
        next.users.push(user);
        next.studies[user.id] = emptyStudy();
        return user;
      });
      return issue(result);
    },
    async login(body) {
      const email =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const user = data.users.find((candidate) => candidate.email === email);
      const correct = await matches(body.password, user?.password || dummy);
      if (!correct || !user || user.disabled)
        throw accountError(
          401,
          "E-mail ou senha incorretos, ou conta desativada.",
        );
      return issue(user);
    },
    userFor(token) {
      if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
        return null;
      const key = digest(token),
        session = sessions.get(key);
      if (!session) return null;
      if (session.expires <= now()) {
        sessions.delete(key);
        return null;
      }
      const user = data.users.find(
        (candidate) => candidate.id === session.userId && !candidate.disabled,
      );
      return user ? publicUser(user) : null;
    },
    logout(token) {
      if (token) sessions.delete(digest(token));
    },
    study(userId) {
      return structuredClone(data.studies[userId] || emptyStudy());
    },
    saveStudy(userId, body) {
      const study = validateStudy(body);
      return update((next) => {
        if (!next.users.some((user) => user.id === userId && !user.disabled))
          throw accountError(401, "Entre novamente para salvar.");
        const previous = next.studies[userId] || emptyStudy();
        if (previous.revision !== body.revision)
          throw accountError(
            409,
            "Seu estudo mudou em outra aba ou dispositivo. Exporte o caderno atual e recarregue para continuar.",
          );
        const record = {
          ...study,
          ...(body.courses === undefined && previous.courses
            ? { courses: previous.courses }
            : {}),
          revision: previous.revision + 1,
          updatedAt: new Date(now()).toISOString(),
        };
        next.studies[userId] = record;
        return record;
      });
    },
    listUsers() {
      return data.users.map((user) => {
        const study = data.studies[user.id] || emptyStudy();
        return {
          ...publicUser(user),
          completed: study.done.length,
          completedByCourse: {
            aula01: study.done.length,
            aula02: study.courses?.aula02?.done.length ?? 0,
          },
          updatedAt: study.updatedAt,
        };
      });
    },
    async setDisabled(userId, disabled) {
      if (typeof disabled !== "boolean")
        throw accountError(400, "Status inválido.");
      await update((next) => {
        const user = next.users.find((candidate) => candidate.id === userId);
        if (!user || user.role === "admin")
          throw accountError(400, "Escolha uma conta de aluno.");
        user.disabled = disabled;
      });
      invalidate(userId);
    },
    async createReset(userId) {
      const token = randomBytes(32).toString("hex");
      await update((next) => {
        const user = next.users.find((candidate) => candidate.id === userId);
        if (!user || user.disabled || user.role !== "student")
          throw accountError(400, "Escolha um aluno ativo.");
        next.resets = next.resets.filter(
          (reset) => reset.userId !== userId && reset.expires > now(),
        );
        next.resets.push({
          userId,
          hash: digest(token),
          expires: now() + 60 * 60 * 1000,
        });
      });
      return token;
    },
    async resetPassword(body) {
      if (typeof body.token !== "string" || !/^[a-f0-9]{64}$/.test(body.token))
        throw accountError(400, "Link de recuperação inválido ou expirado.");
      const userId = await update(async (next) => {
        const reset = next.resets.find(
          (item) => item.hash === digest(body.token) && item.expires > now(),
        );
        const user =
          reset &&
          next.users.find((item) => item.id === reset.userId && !item.disabled);
        if (!user)
          throw accountError(400, "Link de recuperação inválido ou expirado.");
        user.password = await encodePassword(body.password);
        next.resets = next.resets.filter((item) => item.userId !== user.id);
        return user.id;
      });
      invalidate(userId);
    },
  };
}
