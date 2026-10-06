import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createCredentialStore } from "../server/credentials.mjs";
import { createAppServer } from "../server/index.mjs";
import { createAccountStore } from "../server/accounts.mjs";

test("falha de conexão externa retorna 502 com orientação sem expor a chave", async (t) => {
  const app = await (
    await fixture(t)
  )(async () => {
    throw new TypeError("fetch failed", {
      cause: Object.assign(new Error("test-private-gemini"), {
        code: "EACCES",
      }),
    });
  });
  await app.request("/api/credentials", {
    provider: "gemini",
    apiKey: "test-private-gemini",
  });
  const response = await app.request("/api/tts", {
    provider: "gemini",
    moduleId: 0,
    sectionIndex: 0,
  });
  assert.equal(response.status, 502);
  const result = await response.json();
  assert.match(result.error, /conexão.*bloqueada/);
  assert.ok(!result.error.includes("test-private-gemini"));
});

async function fixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "datamind-server-"));
  assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(dir).startsWith("datamind-server-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, "api-keys.json");
  async function start(fetchImpl) {
    const credentials = await createCredentialStore({ file, env: {} });
    const accounts = await createAccountStore({
      file: path.join(dir, "accounts.json"),
    });
    const calls = [];
    const server = createAppServer({
      credentials,
      accounts,
      fetchImpl:
        fetchImpl ||
        (async (url, options) => {
          calls.push({ url, options });
          if (url.includes("googleapis"))
            return Response.json({
              steps: [
                {
                  type: "model_output",
                  content: [{ type: "audio", data: "AAEAAQ==" }],
                },
              ],
            });
          return new Response(new Uint8Array([1, 2, 3]));
        }),
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    const close = () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      });
    t.after(close);
    const signedIn = await fetch(
      base + (accounts.needsSetup() ? "/api/auth/setup" : "/api/auth/login"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: base },
        body: JSON.stringify({
          name: "Administrador de teste",
          email: "admin@example.test",
          password: "test-only-password-123",
        }),
      },
    );
    assert.equal(signedIn.status, 200);
    const cookie = signedIn.headers.get("set-cookie").split(";")[0];
    return {
      base,
      calls,
      close,
      request: (route, body, method = "POST", origin = base) =>
        fetch(base + route, {
          method,
          headers: {
            "Content-Type": "application/json",
            Cookie: cookie,
            ...(origin ? { Origin: origin } : {}),
          },
          body: JSON.stringify(body),
        }),
    };
  }
  return start;
}

test("salvar, reiniciar, gerar áudio sem chave no pedido e remover", async (t) => {
  const start = await fixture(t);
  let app = await start();
  const saved = await app.request("/api/credentials", {
    provider: "openai",
    apiKey: "test-private-openai",
  });
  assert.equal(saved.status, 200);
  assert.ok(!(await saved.text()).includes("test-private-openai"));
  await app.close();
  app = await start();
  const health = await (await fetch(app.base + "/api/health")).json();
  assert.equal(health.credentials.openai, "local");
  assert.ok(!JSON.stringify(health).includes("test-private-openai"));
  const audio = await app.request("/api/tts", {
    provider: "openai",
    moduleId: 0,
    sectionIndex: 0,
  });
  assert.equal(audio.status, 200);
  assert.equal(audio.headers.get("Content-Type"), "audio/mpeg");
  assert.equal(
    app.calls[0].options.headers.Authorization,
    "Bearer test-private-openai",
  );
  assert.equal(
    (await app.request("/api/credentials", { provider: "openai" }, "DELETE"))
      .status,
    200,
  );
  assert.equal(
    (
      await app.request("/api/tts", {
        provider: "openai",
        moduleId: 0,
        sectionIndex: 0,
      })
    ).status,
    400,
  );
  await app.close();
  app = await start();
  assert.equal(
    (await (await fetch(app.base + "/api/health")).json()).credentials.openai,
    null,
  );
});

test("cada provedor recebe sua própria chave e a chave salva tem prioridade", async (t) => {
  const app = await (await fixture(t))();
  await app.request("/api/credentials", {
    provider: "openai",
    apiKey: "test-private-openai",
  });
  await app.request("/api/credentials", {
    provider: "gemini",
    apiKey: "test-private-gemini",
  });
  assert.equal(
    (
      await app.request("/api/tts", {
        provider: "openai",
        apiKey: "test-wrong-client-key",
        moduleId: 0,
        sectionIndex: 0,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await app.request("/api/tts", {
        provider: "gemini",
        moduleId: 0,
        sectionIndex: 0,
      })
    ).status,
    200,
  );
  assert.equal(
    app.calls[0].options.headers.Authorization,
    "Bearer test-private-openai",
  );
  assert.equal(
    app.calls[1].options.headers["x-goog-api-key"],
    "test-private-gemini",
  );
});

test("configuração recusa outras origens, origem ausente e corpo inválido", async (t) => {
  const app = await (await fixture(t))();
  for (const origin of [
    "https://external.example",
    "http://localhost.evil:5173",
    "",
  ]) {
    assert.equal(
      (
        await app.request(
          "/api/credentials",
          { provider: "openai", apiKey: "test-private-openai" },
          "POST",
          origin,
        )
      ).status,
      403,
    );
  }
  assert.equal((await app.request("/api/credentials", null)).status, 400);
  assert.equal((await app.request("/api/tts", null)).status, 400);
  assert.equal((await fetch(app.base + "/api/credentials")).status, 405);
  assert.equal((await fetch(app.base + "/.local/api-keys.json")).status, 404);
  const health = await (await fetch(app.base + "/api/health")).json();
  assert.equal(health.credentials.openai, null);
  assert.equal(app.calls.length, 0);
});
