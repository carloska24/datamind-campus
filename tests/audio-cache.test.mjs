import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createAudioCache } from "../server/audio-cache.mjs";

test("15 alunos compartilham uma geração e o áudio persiste após reinício sem guardar a chave", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "datamind-audio-"));
  assert.equal(
    path.dirname(path.resolve(directory)),
    path.resolve(os.tmpdir()),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  let calls = 0;
  const generate = async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { bytes: Buffer.from("test-audio-bytes"), type: "audio/mpeg" };
  };
  const body = {
    provider: "openai",
    apiKey: "test-only-private-key",
    moduleId: 0,
    sectionIndex: 0,
  };
  let audio = createAudioCache({ directory, generate });
  const results = await Promise.all(
    Array.from({ length: 15 }, () => audio(body)),
  );
  assert.equal(calls, 1);
  assert.ok(
    results.every((result) => result.bytes.toString() === "test-audio-bytes"),
  );
  audio = createAudioCache({ directory, generate });
  await audio(body);
  assert.equal(calls, 1);
  await assert.rejects(() => audio({ ...body, apiKey: "" }));
  await audio({ ...body, sectionIndex: 1 });
  assert.equal(calls, 2);
  assert.ok(
    (await readdir(directory)).every((file) =>
      /^[a-f0-9]{64}\.mp3$/.test(file),
    ),
  );
});

test("erro de geração não é salvo e trechos distintos mantêm duas gerações simultâneas", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "datamind-audio-"));
  assert.equal(
    path.dirname(path.resolve(directory)),
    path.resolve(os.tmpdir()),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  let working = 0,
    peak = 0,
    fail = true;
  const audio = createAudioCache({
    directory,
    generate: async () => {
      if (fail) throw Error("test failure");
      working++;
      peak = Math.max(peak, working);
      await new Promise((resolve) => setTimeout(resolve, 10));
      working--;
      return { bytes: Buffer.from("test-audio"), type: "audio/wav" };
    },
  });
  const body = {
    provider: "gemini",
    apiKey: "test-only-private-key",
    moduleId: 0,
    sectionIndex: 0,
  };
  await assert.rejects(() => audio(body), /test failure/);
  assert.deepEqual(await readdir(directory), []);
  fail = false;
  await Promise.all(
    Array.from({ length: 10 }, (_, moduleId) => audio({ ...body, moduleId })),
  );
  assert.equal(peak, 2);
});
