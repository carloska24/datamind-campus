import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import { createAccountStore, SESSION_SECONDS } from "../server/accounts.mjs";
import { createAppServer } from "../server/index.mjs";

const password = "test-only-strong-password";
async function fixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "datamind-accounts-"));
  assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(dir).startsWith("datamind-accounts-"));
  const file = path.join(dir, "accounts.json");
  t.after(() => rm(dir, { recursive: true, force: true }));
  let clock = Date.now();
  const openStore = () => createAccountStore({ file, now: () => clock });
  const accounts = await openStore();
  let calls = 0;
  const server = createAppServer({
    accounts,
    credentials: {
      get: () => "test-only-provider-key",
      status: () => ({ gemini: "local" }),
      save: async () => {},
      remove: async () => {},
    },
    fetchImpl: async () => {
      calls++;
      return Response.json({
        steps: [
          {
            type: "model_output",
            content: [{ type: "audio", data: "AAEAAQ==" }],
          },
        ],
      });
    },
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (
    route,
    body,
    cookie = "",
    method = body === undefined ? "GET" : "POST",
    origin = base,
    expectedUserId = accounts.userFor(cookie.split("=")[1])?.id || "",
  ) =>
    fetch(base + route, {
      method,
      headers: {
        Cookie: cookie,
        Origin: origin,
        "Content-Type": "application/json",
        ...(expectedUserId ? { "X-Campus-User": expectedUserId } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  async function create(email, setup = false, extra = {}) {
    const response = await request(
      `/api/auth/${setup ? "setup" : "register"}`,
      { name: email.split("@")[0], email, password, ...extra },
    );
    assert.equal(response.status, 200);
    const cookieHeader = response.headers.get("set-cookie");
    assert.match(cookieHeader, /HttpOnly; SameSite=Strict; Path=\//);
    return {
      user: (await response.json()).user,
      cookie: cookieHeader.split(";")[0],
    };
  }
  return {
    accounts,
    openStore,
    file,
    request,
    create,
    advance: (ms) => {
      clock += ms;
    },
    calls: () => calls,
  };
}

test("bootstrap único, cadastro aberto apenas de alunos, senha protegida e sessão expira", async (t) => {
  const app = await fixture(t);
  assert.equal(
    (
      await app.request("/api/auth/register", {
        name: "Aluno",
        email: "student@example.test",
        password,
      })
    ).status,
    409,
  );
  const results = await Promise.all([
    app.request("/api/auth/setup", {
      name: "Administrador",
      email: "admin@example.test",
      password,
    }),
    app.request("/api/auth/setup", {
      name: "Outro admin",
      email: "other@example.test",
      password,
    }),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  const student = await app.create("student@example.test", false, {
    role: "admin",
    id: "forged",
  });
  assert.equal(student.user.role, "student");
  assert.notEqual(student.user.id, "forged");
  assert.ok(!JSON.stringify(student.user).includes(password));
  const disk = await readFile(app.file, "utf8");
  assert.ok(!disk.includes(password));
  assert.ok(!disk.includes(student.cookie.split("=")[1]));
  assert.equal(
    (
      await app.request("/api/auth/login", {
        email: "STUDENT@EXAMPLE.TEST",
        password,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await app.request("/api/auth/login", {
        email: "student@example.test",
        password: "wrong-password",
      })
    ).status,
    401,
  );
  app.advance((SESSION_SECONDS + 1) * 1000);
  assert.equal(
    (await app.request("/api/study", undefined, student.cookie)).status,
    401,
  );
  assert.equal(
    (
      await app.request("/api/auth/setup", {
        name: "Admin",
        email: "new@example.test",
        password,
      })
    ).status,
    409,
  );
});

test("progresso e caderno isolados, persistência após reinício e conflito de dispositivos", async (t) => {
  const app = await fixture(t);
  await app.create("admin@example.test", true);
  const one = await app.create("one@example.test"),
    two = await app.create("two@example.test");
  const study = {
    done: [0, 2],
    notes: { 0: "Hipótese privada: correlação não é causa." },
    lastActivity: "#/audio/3/2",
    revision: 0,
    userId: two.user.id,
  };
  assert.equal(
    (await app.request("/api/study", study, one.cookie, "PUT")).status,
    200,
  );
  const other = await (
    await app.request("/api/study", undefined, two.cookie)
  ).json();
  assert.deepEqual(other.done, []);
  assert.deepEqual(other.notes, {});
  const saved = await (
    await app.request("/api/study", undefined, one.cookie)
  ).json();
  assert.equal(saved.notes[0], study.notes[0]);
  assert.equal(saved.lastActivity, study.lastActivity);
  assert.equal(saved.revision, 1);
  assert.equal(
    (
      await app.request(
        "/api/study",
        study,
        two.cookie,
        "PUT",
        undefined,
        one.user.id,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await app.request(
        "/api/study",
        undefined,
        two.cookie,
        "GET",
        undefined,
        one.user.id,
      )
    ).status,
    409,
  );
  assert.deepEqual(
    (await (await app.request("/api/study", undefined, two.cookie)).json())
      .notes,
    {},
  );
  assert.equal(
    (
      await app.request(
        "/api/study",
        { ...study, notes: { 0: "old tab overwrite" } },
        one.cookie,
        "PUT",
      )
    ).status,
    409,
  );
  const reopened = await app.openStore();
  assert.equal(reopened.study(one.user.id).notes[0], study.notes[0]);
  assert.deepEqual(reopened.study(two.user.id).notes, {});
  assert.equal(reopened.userFor(one.cookie.split("=")[1]), null);
  const newLogin = await reopened.login({ email: one.user.email, password });
  assert.equal(reopened.userFor(newLogin.token).id, one.user.id);
  for (const invalid of [
    { ...study, done: [14] },
    { ...study, notes: { __proto__: "bad", 99: "bad" } },
    { ...study, lastActivity: "https://evil.example" },
    { ...study, notes: { 0: "x".repeat(20001) } },
  ]) {
    assert.equal(
      (await app.request("/api/study", invalid, one.cookie, "PUT")).status,
      400,
    );
  }
});

test("autorização no servidor, CSRF, privacidade das notas e áudio para aluno", async (t) => {
  const app = await fixture(t);
  const admin = await app.create("admin@example.test", true),
    student = await app.create("student@example.test");
  for (const route of ["/api/study", "/api/admin/users"])
    assert.equal((await app.request(route)).status, 401);
  assert.equal(
    (
      await app.request("/api/tts", {
        provider: "gemini",
        moduleId: 0,
        sectionIndex: 0,
      })
    ).status,
    401,
  );
  assert.equal(
    (await app.request("/api/admin/users", undefined, student.cookie)).status,
    403,
  );
  assert.equal(
    (
      await app.request(
        "/api/credentials",
        { provider: "gemini", apiKey: "student-forged-key" },
        student.cookie,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await app.request(
        "/api/credentials",
        { provider: "gemini" },
        student.cookie,
        "DELETE",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await app.request(
        "/api/study",
        { done: [], notes: {}, lastActivity: null, revision: 0 },
        student.cookie,
        "PUT",
        "https://evil.example",
      )
    ).status,
    403,
  );
  assert.equal(
    (await app.request("/api/auth/logout", {}, student.cookie, "POST", ""))
      .status,
    403,
  );
  assert.equal(
    (
      await app.request(
        "/api/tts",
        { provider: "gemini", moduleId: 0, sectionIndex: 0 },
        student.cookie,
      )
    ).status,
    200,
  );
  assert.equal(app.calls(), 1);
  await app.request(
    "/api/study",
    {
      done: [0],
      notes: { 0: "private-notebook-content" },
      lastActivity: "#/aula/1",
      revision: 0,
    },
    student.cookie,
    "PUT",
  );
  const report = await (
    await app.request("/api/admin/users", undefined, admin.cookie)
  ).json();
  assert.equal(
    report.users.find((item) => item.id === student.user.id).completed,
    1,
  );
  assert.ok(!JSON.stringify(report).includes("private-notebook-content"));
  assert.ok(!JSON.stringify(report).includes("password"));
  assert.equal(
    (await app.request("/api/auth/logout", {}, student.cookie)).status,
    200,
  );
  assert.equal(
    (await app.request("/api/study", undefined, student.cookie)).status,
    401,
  );
});

test("desativação encerra sessão; recuperação é única e invalida sessões anteriores", async (t) => {
  const app = await fixture(t);
  const admin = await app.create("admin@example.test", true),
    student = await app.create("student@example.test");
  assert.equal(
    (
      await app.request(
        "/api/admin/users",
        { action: "status", userId: admin.user.id, disabled: true },
        admin.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await app.request(
        "/api/admin/users",
        { action: "status", userId: student.user.id, disabled: true },
        student.cookie,
      )
    ).status,
    403,
  );
  await app.request(
    "/api/admin/users",
    { action: "status", userId: student.user.id, disabled: true },
    admin.cookie,
  );
  assert.equal(
    (await app.request("/api/study", undefined, student.cookie)).status,
    401,
  );
  assert.equal(
    (
      await app.request("/api/auth/login", {
        email: student.user.email,
        password,
      })
    ).status,
    401,
  );
  await app.request(
    "/api/admin/users",
    { action: "status", userId: student.user.id, disabled: false },
    admin.cookie,
  );
  const login = await app.request("/api/auth/login", {
    email: student.user.email,
    password,
  });
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const { token } = await (
    await app.request(
      "/api/admin/users",
      { action: "reset", userId: student.user.id },
      admin.cookie,
    )
  ).json();
  assert.ok(!(await readFile(app.file, "utf8")).includes(token));
  assert.equal(
    (
      await app.request("/api/auth/reset", {
        token,
        password: "new-test-only-password",
      })
    ).status,
    200,
  );
  assert.equal(
    (await app.request("/api/study", undefined, cookie)).status,
    401,
  );
  assert.equal(
    (await app.request("/api/auth/reset", { token, password })).status,
    400,
  );
  assert.equal(
    (
      await app.request("/api/auth/login", {
        email: student.user.email,
        password,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await app.request("/api/auth/login", {
        email: student.user.email,
        password: "new-test-only-password",
      })
    ).status,
    200,
  );
  const expired = await (
    await app.request(
      "/api/admin/users",
      { action: "reset", userId: student.user.id },
      admin.cookie,
    )
  ).json();
  app.advance(3600001);
  assert.equal(
    (await app.request("/api/auth/reset", { token: expired.token, password }))
      .status,
    400,
  );
});

test("cadastro rejeita identidade/senha inválida e limita tentativas", async (t) => {
  const app = await fixture(t);
  await app.create("admin@example.test", true);
  for (const extra of [{ password: "short" }, { email: "bad" }, { name: "" }])
    assert.equal(
      (
        await app.request("/api/auth/register", {
          name: "Aluno",
          email: "new@example.test",
          password,
          ...extra,
        })
      ).status,
      400,
    );
  // Successful administrator creation does not consume the failure budget.
  for (let n = 0; n < 27; n++)
    assert.equal((await app.request("/api/auth/login", {})).status, 401);
  assert.equal((await app.request("/api/auth/login", {})).status, 429);
});
