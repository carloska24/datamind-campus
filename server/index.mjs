import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSpeech } from "./tts.mjs";
import { createCredentialStore } from "./credentials.mjs";
import { createAccountStore } from "./accounts.mjs";
import { createAccountRouter, sessionToken } from "./account-routes.mjs";
const root = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".ipynb": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};
function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
export function createAppServer({ credentials, accounts, fetchImpl = fetch }) {
  if (!accounts) throw Error("O servidor exige armazenamento de contas.");
  const accountRouter = createAccountRouter(accounts);
  let active = 0;
  const activeUsers = new Set();
  const server = http.createServer(async (req, res) => {
    try {
      const port = server.address()?.port;
      const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("Cache-Control", "no-store");
      if (!allowedHosts.has(req.headers.host)) {
        json(res, 403, {
          error: "Servidor disponível somente pelo endereço local.",
        });
        return;
      }
      const url = new URL(req.url, "http://127.0.0.1");
      if (
        url.pathname.startsWith("/api/") &&
        ["POST", "PUT", "DELETE", "PATCH"].includes(req.method)
      ) {
        if (
          ![
            "http://127.0.0.1:" + port,
            "http://localhost:" + port,
            "http://127.0.0.1:5173",
            "http://localhost:5173",
          ].includes(req.headers.origin)
        ) {
          json(res, 403, { error: "Origem não autorizada." });
          return;
        }
      }
      if (url.pathname.startsWith("/api/") && req.headers["x-campus-user"]) {
        const user = accounts.userFor(sessionToken(req));
        if (!user) {
          json(res, 401, {
            error: "Sua sessão expirou. Exporte seu caderno e entre novamente.",
          });
          return;
        }
        if (user.id !== req.headers["x-campus-user"]) {
          json(res, 409, {
            error:
              "A conta ativa mudou em outra aba. Exporte este caderno e recarregue antes de continuar.",
          });
          return;
        }
      }
      if (await accountRouter(req, res, url.pathname)) return;
      if (url.pathname === "/api/health" && req.method === "GET") {
        json(res, 200, {
          service: "aula01-audio",
          credentials: credentials.status(),
        });
        return;
      }
      const configRequest = url.pathname === "/api/credentials";
      if (
        configRequest ||
        (url.pathname === "/api/tts" && req.method === "POST")
      ) {
        if (configRequest && !["POST", "DELETE"].includes(req.method)) {
          json(res, 405, { error: "Método não permitido." });
          return;
        }
        const user = accounts.userFor(sessionToken(req));
        if (!user) {
          json(res, 401, { error: "Entre na sua conta para continuar." });
          return;
        }
        if (configRequest && user.role !== "admin") {
          json(res, 403, {
            error: "Somente o administrador pode configurar a narração.",
          });
          return;
        }
        const origin = req.headers.origin;
        if (
          (configRequest && !origin) ||
          (origin &&
            ![
              "http://127.0.0.1:" + port,
              "http://localhost:" + port,
              "http://127.0.0.1:5173",
              "http://localhost:5173",
            ].includes(origin))
        ) {
          json(res, 403, { error: "Origem não autorizada." });
          return;
        }
        if (!req.headers["content-type"]?.startsWith("application/json")) {
          json(res, 415, { error: "Formato de solicitação inválido." });
          return;
        }
        if (!configRequest && (active >= 2 || activeUsers.has(user.id))) {
          json(res, 429, {
            error: "Já há áudios sendo gerados. Aguarde e tente novamente.",
          });
          return;
        }
        let text = "";
        try {
          for await (const chunk of req) {
            text += chunk;
            if (Buffer.byteLength(text) > 16000) {
              json(res, 413, { error: "Solicitação muito grande." });
              return;
            }
          }
        } catch {
          json(res, 400, { error: "Solicitação interrompida." });
          return;
        }
        let body;
        try {
          body = JSON.parse(text);
          if (!body || typeof body !== "object" || Array.isArray(body))
            throw Error();
        } catch {
          json(res, 400, { error: "Solicitação inválida." });
          return;
        }
        if (configRequest) {
          try {
            if (req.method === "DELETE")
              await credentials.remove(body.provider);
            else await credentials.save(body.provider, body.apiKey);
            json(res, 200, { credentials: credentials.status() });
          } catch (e) {
            json(res, 400, { error: e.message });
          }
          return;
        }
        active++;
        activeUsers.add(user.id);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90000);
        res.on("close", () => {
          if (!res.writableEnded) controller.abort();
        });
        try {
          const apiKey = credentials.get(body.provider);
          const result = await generateSpeech(
            { ...body, apiKey },
            fetchImpl,
            controller.signal,
          );
          if (!res.destroyed) {
            res.writeHead(200, {
              "Content-Type": result.type,
              "Content-Length": result.bytes.length,
              "Cache-Control": "no-store",
            });
            res.end(result.bytes);
          }
        } catch (e) {
          if (!res.destroyed)
            json(
              res,
              e.name === "AbortError" || e.name === "TimeoutError"
                ? 504
                : e.status || 400,
              {
                error:
                  e.name === "AbortError" || e.name === "TimeoutError"
                    ? "O serviço demorou demais. Tente novamente."
                    : e.message || "Não foi possível gerar o áudio.",
              },
            );
        } finally {
          clearTimeout(timer);
          active--;
          activeUsers.delete(user.id);
        }
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        json(res, 404, { error: "Rota não encontrada." });
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        json(res, 405, { error: "Método não permitido." });
        return;
      }
      try {
        const pathname = decodeURIComponent(url.pathname);
        let file = path.resolve(root, "." + pathname);
        if (file !== root && !file.startsWith(root + path.sep)) {
          json(res, 403, { error: "Caminho inválido." });
          return;
        }
        if (
          file === root ||
          (await stat(file).catch(() => null))?.isDirectory()
        )
          file = path.join(file, "index.html");
        const bytes = await readFile(file);
        res.writeHead(200, {
          "Content-Type":
            types[path.extname(file)] || "application/octet-stream",
        });
        res.end(req.method === "HEAD" ? undefined : bytes);
      } catch {
        json(res, 404, {
          error:
            "Arquivo não encontrado. Execute npm run build antes de iniciar.",
        });
      }
    } catch (e) {
      if (!res.destroyed && !res.headersSent)
        json(res, e.status || 500, {
          error: e.status
            ? e.message
            : "Não foi possível concluir a solicitação. Tente novamente.",
        });
    }
  });
  return server;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const port = Number(process.env.PORT || 4173);
  const credentials = await createCredentialStore();
  const accounts = await createAccountStore();
  const server = createAppServer({ credentials, accounts });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `DataMind disponível em http://127.0.0.1:${port}\nAbra esse endereço no Chrome ou Edge. Ctrl+C encerra o servidor.`,
    ),
  );
}
