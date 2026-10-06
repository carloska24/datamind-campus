import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { deploymentConfig } from "../server/deployment.mjs";
import { createAccountStore } from "../server/accounts.mjs";
import { createCredentialStore } from "../server/credentials.mjs";
import { createAppServer } from "../server/index.mjs";

const activation = "test-only-activation-code-with-32-characters";
// Node fetch rewrites Host. Use native HTTP to exercise the reverse-proxy host.
function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, res => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve(new Response(Buffer.concat(chunks), {
        status: res.statusCode,
        headers: Object.fromEntries(Object.entries(res.headers).map(([name, value]) => [name, Array.isArray(value) ? value.join(", ") : value])),
      })));
    });
    req.on("error", reject);
    req.end(options.body);
  });
}
test("produção exige HTTPS, disco persistente e ativação privada; local mantém loopback", () => {
  assert.equal(deploymentConfig({}).host, "127.0.0.1");
  const env = {
    NODE_ENV: "production",
    RENDER_EXTERNAL_URL: "https://campus.example",
    DATA_DIR: path.join(os.tmpdir(), "campus"),
    SETUP_TOKEN: activation,
  };
  assert.equal(deploymentConfig(env).host, "0.0.0.0");
  assert.equal(deploymentConfig(env).publicOrigin, "https://campus.example");
  for (const invalid of [
    { RENDER_EXTERNAL_URL: "http://campus.example" },
    { RENDER_EXTERNAL_URL: "https://campus.example/path" },
    { RENDER_EXTERNAL_URL: "" },
    { DATA_DIR: "relative" },
    { SETUP_TOKEN: "" },
  ])
    assert.throws(() => deploymentConfig({ ...env, ...invalid }));
});

test("campus HTTPS protege primeiro administrador, cookies, origem e estudo no disco", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "datamind-deploy-"));
  assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, "accounts.json");
  let accounts = await createAccountStore({ file });
  const credentials = await createCredentialStore({
    file: path.join(dir, "keys.json"),
    env: {},
  });
  const server = createAppServer({
    accounts,
    credentials,
    publicOrigin: "https://campus.example",
    setupToken: activation,
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => {
    server.close();
    server.closeAllConnections();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const person = {
    name: "Admin de teste",
    email: "admin@example.test",
    password: "test-only-password-123",
  };
  const request = (route, body, extra = {}) =>
    httpFetch(base + route, {
      method: "POST",
      headers: {
        Host: "campus.example",
        Origin: "https://campus.example",
        "Content-Type": "application/json",
        ...extra,
      },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await httpFetch(base + "/api/health", { headers: { Host: "evil.example" } }))
      .status,
    403,
  );
  assert.equal((await request("/api/auth/setup", person)).status, 403);
  assert.equal(
    (
      await request(
        "/api/auth/setup",
        { ...person, setupToken: activation },
        { Origin: "https://evil.example" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/api/auth/setup",
        { ...person, setupToken: activation },
        { Origin: base },
      )
    ).status,
    403,
  );
  const created = await request("/api/auth/setup", {
    ...person,
    setupToken: activation,
  });
  assert.equal(created.status, 200);
  const cookie = created.headers.get("set-cookie");
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /HttpOnly; SameSite=Strict/);
  const user = (await created.json()).user;
  const saved = await httpFetch(base + "/api/study", {
    method: "PUT",
    headers: {
      Host: "campus.example",
      Origin: "https://campus.example",
      Cookie: cookie.split(";")[0],
      "Content-Type": "application/json",
      "X-Campus-User": user.id,
    },
    body: JSON.stringify({
      done: [0],
      notes: { 0: "Estudo persistente de teste" },
      lastActivity: "#/aula/1",
      revision: 0,
    }),
  });
  assert.equal(saved.status, 200);
  accounts = await createAccountStore({ file });
  const resumed = await accounts.login(person);
  assert.equal(
    accounts.study(resumed.user.id).notes["0"],
    "Estudo persistente de teste",
  );
  assert.equal(accounts.userFor(cookie.split(";")[0].split("=")[1]), null);
  assert.equal(
    (await request("/api/auth/setup", { ...person, setupToken: activation }))
      .status,
    409,
  );
  assert.equal(
    (
      await request("/api/auth/logout", {}, { Cookie: cookie.split(";")[0] })
    ).headers
      .get("set-cookie")
      .includes("Secure"),
    true,
  );
});

test("logins de uma turma pelo mesmo proxy aguardam limite de memória sem gastar orçamento de falhas", async (t) => {
  let working = 0,
    peak = 0;
  const accounts = {
    userFor: () => null,
    login: async () => {
      working++;
      peak = Math.max(peak, working);
      await new Promise((resolve) => setTimeout(resolve, 5));
      working--;
      return { token: "test", user: { id: "test" } };
    },
  };
  const server = createAppServer({
    accounts,
    credentials: { status: () => ({}) },
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => {
    server.close();
    server.closeAllConnections();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = () =>
    fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { Origin: base, "Content-Type": "application/json" },
      body: "{}",
    });
  for (let wave = 0; wave < 3; wave++) {
    const responses = await Promise.all(Array.from({ length: 15 }, login));
    assert.deepEqual(
      responses.map((response) => response.status),
      Array(15).fill(200),
    );
    await Promise.all(responses.map((response) => response.text()));
  }
  assert.equal(peak, 2);
});
