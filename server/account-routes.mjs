import { accountError, SESSION_SECONDS } from "./accounts.mjs";
import { timingSafeEqual } from "node:crypto";

export function sessionToken(req) {
  return req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("datamind_session="))
    ?.slice(17);
}
export function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
export async function readJson(req, maxBytes = 320000) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw accountError(415, "Formato de solicitação inválido.");
  let text = "";
  req.setEncoding("utf8");
  for await (const chunk of req) {
    text += chunk;
    if (Buffer.byteLength(text) > maxBytes)
      throw accountError(413, "Solicitação muito grande.");
  }
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Error();
    return body;
  } catch {
    throw accountError(400, "Solicitação inválida.");
  }
}
export function createAccountRouter(
  accounts,
  { secureCookies = false, setupToken = "" } = {},
) {
  const attempts = new Map();
  let active = 0;
  const waiting = [];
  const cookieFlags = `HttpOnly; SameSite=Strict; Path=/${secureCookies ? "; Secure" : ""}`;
  async function acquire() {
    if (active < 2) {
      active++;
      return;
    }
    if (waiting.length >= 30)
      throw accountError(
        429,
        "Há muitos acessos agora. Aguarde um momento e tente novamente.",
      );
    await new Promise((resolve) => waiting.push(resolve));
  }
  function release() {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
  return async (req, res, pathname) => {
    const token = sessionToken(req);
    const user = accounts.userFor(token);
    const publicRoutes = ["setup", "register", "login", "reset"];
    const action = pathname.slice("/api/auth/".length);
    if (pathname === "/api/auth/session" && req.method === "GET") {
      sendJson(res, 200, {
        user,
        needsSetup: accounts.needsSetup(),
        setupProtected: Boolean(setupToken),
      });
      return true;
    }
    if (
      pathname.startsWith("/api/auth/") &&
      req.method === "POST" &&
      publicRoutes.includes(action)
    ) {
      // Do not trust client-supplied forwarding headers for security limits.
      // Successful sign-ins do not consume the failure budget shared by a proxy.
      const ip = req.socket.remoteAddress;
      const now = Date.now();
      for (const [key, attempt] of attempts)
        if (attempt.until <= now) attempts.delete(key);
      const attempt = attempts.get(ip) || {
        count: 0,
        until: now + 15 * 60 * 1000,
      };
      if (attempt.count >= 30) {
        res.setHeader("Retry-After", "60");
        throw accountError(
          429,
          "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        );
      }
      await acquire();
      try {
        const body = await readJson(req, 4000);
        if (action === "setup" && setupToken) {
          const candidate = Buffer.from(
            typeof body.setupToken === "string" ? body.setupToken : "",
          );
          const expected = Buffer.from(setupToken);
          if (
            candidate.length !== expected.length ||
            !timingSafeEqual(candidate, expected)
          )
            throw accountError(
              403,
              "Informe o código de ativação do administrador disponível no painel do servidor.",
            );
        }
        if (action === "reset") {
          await accounts.resetPassword(body);
          res.setHeader(
            "Set-Cookie",
            `datamind_session=; ${cookieFlags}; Max-Age=0`,
          );
          sendJson(res, 200, { ok: true });
        } else {
          const result =
            action === "login"
              ? await accounts.login(body)
              : await accounts.create(body, action === "setup");
          res.setHeader(
            "Set-Cookie",
            `datamind_session=${result.token}; ${cookieFlags}; Max-Age=${SESSION_SECONDS}`,
          );
          sendJson(res, 200, { user: result.user });
        }
      } catch (error) {
        if ([400, 401, 403, 409].includes(error.status)) {
          attempt.count++;
          attempts.set(ip, attempt);
        }
        throw error;
      } finally {
        release();
      }
      return true;
    }
    if (pathname === "/api/auth/logout" && req.method === "POST") {
      accounts.logout(token);
      res.setHeader(
        "Set-Cookie",
        `datamind_session=; ${cookieFlags}; Max-Age=0`,
      );
      sendJson(res, 200, { ok: true });
      return true;
    }
    if (pathname === "/api/study") {
      if (!user) throw accountError(401, "Entre na sua conta para continuar.");
      if (req.method === "GET") sendJson(res, 200, accounts.study(user.id));
      else if (req.method === "PUT") {
        if (req.headers["x-campus-user"] !== user.id)
          throw accountError(
            409,
            "Confirme a conta ativa antes de salvar seu estudo.",
          );
        sendJson(
          res,
          200,
          await accounts.saveStudy(user.id, await readJson(req)),
        );
      } else throw accountError(405, "Método não permitido.");
      return true;
    }
    if (pathname === "/api/admin/users") {
      if (!user) throw accountError(401, "Entre na sua conta para continuar.");
      if (user.role !== "admin")
        throw accountError(403, "Acesso exclusivo do administrador.");
      if (req.method === "GET")
        sendJson(res, 200, { users: accounts.listUsers() });
      else if (req.method === "POST") {
        const body = await readJson(req, 4000);
        if (body.action === "status") {
          await accounts.setDisabled(body.userId, body.disabled);
          sendJson(res, 200, { ok: true });
        } else if (body.action === "reset")
          sendJson(res, 200, {
            token: await accounts.createReset(body.userId),
          });
        else throw accountError(400, "Ação inválida.");
      } else throw accountError(405, "Método não permitido.");
      return true;
    }
    return false;
  };
}
