import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createCredentialStore } from "../server/credentials.mjs";

async function temporaryDirectory(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "datamind-keys-"));
  assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(dir).startsWith("datamind-keys-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test("chaves persistem após reiniciar e o status não revela segredos", async (t) => {
  const dir = await temporaryDirectory(t);
  const file = path.join(dir, "private", "api-keys.json");
  const store = await createCredentialStore({ file, env: {} });
  await store.save("openai", "  test-openai-key  ");
  await store.save("gemini", "test-gemini-key");
  const restarted = await createCredentialStore({ file, env: {} });
  assert.equal(restarted.get("openai"), "test-openai-key");
  assert.equal(restarted.get("gemini"), "test-gemini-key");
  assert.deepEqual(restarted.status(), { openai: "local", gemini: "local" });
  assert.ok(!JSON.stringify(restarted.status()).includes("test-openai-key"));
  await restarted.remove("openai");
  const afterRemoval = await createCredentialStore({ file, env: {} });
  assert.equal(afterRemoval.get("openai"), "");
  assert.equal(afterRemoval.get("gemini"), "test-gemini-key");
  assert.ok(!(await readFile(file, "utf8")).includes("test-openai-key"));
});

test("configuração de ambiente tem prioridade e não é alterada pela interface", async (t) => {
  const dir = await temporaryDirectory(t);
  const store = await createCredentialStore({
    file: path.join(dir, "keys.json"),
    env: {
      OPENAI_API_KEY: "test-environment-key",
      GEMINI_API_KEY: "test-google-key",
    },
  });
  assert.equal(store.get("openai"), "test-environment-key");
  assert.deepEqual(store.status(), {
    openai: "environment",
    gemini: "environment",
  });
  await assert.rejects(store.save("openai", "test-another-key"), /ambiente/);
  await assert.rejects(store.remove("openai"), /ambiente/);
});

test("entrada inválida não grava nem substitui a chave existente", async (t) => {
  const dir = await temporaryDirectory(t);
  const store = await createCredentialStore({
    file: path.join(dir, "keys.json"),
    env: {},
  });
  await store.save("openai", "test-valid-key");
  for (const key of [
    "short",
    "test-key\nunsafe",
    "x".repeat(513),
    123,
    null,
    undefined,
  ]) {
    await assert.rejects(store.save("openai", key), /válida/);
  }
  await assert.rejects(
    store.save("../../escape", "test-valid-key"),
    /provedor/,
  );
  assert.equal(store.get("openai"), "test-valid-key");
});

test("falha ao gravar não informa sucesso nem perde a chave em memória", async (t) => {
  const dir = await temporaryDirectory(t);
  const file = path.join(dir, "private", "keys.json");
  const store = await createCredentialStore({ file, env: {} });
  await writeFile(path.dirname(file), "blocks directory creation");
  await assert.rejects(store.save("openai", "test-valid-key"));
  assert.equal(store.get("openai"), "");
});

test("gravações simultâneas preservam as chaves dos dois provedores", async (t) => {
  const dir = await temporaryDirectory(t);
  const file = path.join(dir, "keys.json");
  const store = await createCredentialStore({ file, env: {} });
  await Promise.all([
    store.save("openai", "test-openai-key"),
    store.save("gemini", "test-gemini-key"),
  ]);
  const restarted = await createCredentialStore({ file, env: {} });
  assert.deepEqual(restarted.status(), { openai: "local", gemini: "local" });
});
