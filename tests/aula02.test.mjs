import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseRoute, routeHash } from "../src/navigation.ts";
import { createAccountStore, validateStudy } from "../server/accounts.mjs";
import { getNarration } from "../server/tts.mjs";
import { createAudioCache } from "../server/audio-cache.mjs";

const readJson = async (file) =>
  JSON.parse(await readFile(new URL(file, import.meta.url), "utf8"));

test("audio cache separates the same topic number in different lessons", async (t) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "campus-aula02-audio-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  let calls = 0;
  const cache = createAudioCache({
    directory,
    generate: async (body) => {
      calls++;
      return {
        bytes: Buffer.from(
          getNarration(body.moduleId, body.sectionIndex, body.courseId),
        ),
        type: "audio/mpeg",
      };
    },
  });
  const request = {
    provider: "openai",
    apiKey: "test-only-key-long-enough",
    moduleId: 0,
    sectionIndex: 0,
  };
  const first = await cache(request);
  const second = await cache({ ...request, courseId: "aula02" });
  assert.notDeepEqual(first.bytes, second.bytes);
  assert.deepEqual(
    (await cache({ ...request, courseId: "aula02" })).bytes,
    second.bytes,
  );
  assert.equal(calls, 2);
});

test("Aula 02 round-trips all topics, audio segments, labs and project steps", () => {
  for (const page of ["lesson", "audio", "review"]) {
    for (let moduleId = 0; moduleId < 14; moduleId++) {
      for (
        let position = 0;
        position < (page === "audio" ? 4 : 1);
        position++
      ) {
        const route = {
          page,
          moduleId,
          ...(page === "audio" ? { position } : {}),
          courseId: "aula02",
        };
        assert.deepEqual(parseRoute(routeHash(route), 14), route);
      }
    }
  }
  for (const [page, count] of [
    ["labs", 4],
    ["project", 5],
  ]) {
    for (let position = 0; position < count; position++) {
      const route = { page, position, courseId: "aula02" };
      assert.deepEqual(parseRoute(routeHash(route), 14), route);
    }
  }
  for (const hash of [
    "#/aula02/aula/15",
    "#/aula02/audio/1/5",
    "#/aula02/laboratorios/5",
    "#/aula02/projeto/6",
    "#/aula02/kdd/1",
    "#/aula02/aula02/aula/1",
    "#/laboratorios/3",
    "#/projeto/1",
  ])
    assert.equal(parseRoute(hash, 14), null, hash);
  assert.equal(routeHash({ page: "lesson", moduleId: 0 }), "#/aula/1");
});

test("audio selects Aula 02 content without accepting arbitrary course paths", async () => {
  const modules = await readJson("../src/data/aula02-modules.json");
  for (const m of modules) {
    assert.ok(
      m.guide.objective && m.guide.steps.length >= 3 && m.question && m.answer,
    );
    for (let i = 0; i < 4; i++)
      assert.ok(getNarration(m.id, i, "aula02").length > 50);
    assert.ok(getNarration(m.id, 0, "aula02").includes(m.title));
  }
  assert.notEqual(getNarration(0, 0), getNarration(0, 0, "aula02"));
  assert.throws(() => getNarration(0, 0, "../../secrets"));
  assert.throws(() => getNarration(14, 0, "aula02"));
});

test("one account persists isolated lesson notes and progress with revision control", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "campus-aula02-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, "accounts.json");
  const store = await createAccountStore({ file });
  const { user } = await store.create(
    {
      name: "Teste Campus",
      email: "test@example.com",
      password: "test-password-long-enough",
    },
    true,
  );
  const old = {
    done: [0, 3],
    notes: { 0: "Minha nota original" },
    lastActivity: "#/aula/4",
    revision: 0,
  };
  await store.saveStudy(user.id, old);
  const saved = await store.saveStudy(user.id, {
    ...old,
    revision: 1,
    courses: { aula02: { done: [0, 13], notes: { 0: "Pandas é outra aula" } } },
    lastActivity: "#/aula02/audio/14/4",
  });
  assert.deepEqual(saved.done, [0, 3]);
  assert.equal(saved.notes[0], "Minha nota original");
  assert.equal(saved.courses.aula02.notes[0], "Pandas é outra aula");
  const reopened = await createAccountStore({ file });
  assert.deepEqual(reopened.study(user.id), saved);
  await assert.rejects(
    reopened.saveStudy(user.id, { ...old, revision: 0 }),
    /outra aba/,
  );
  const legacy = await reopened.saveStudy(user.id, { ...old, revision: 2 });
  assert.deepEqual(legacy.courses, saved.courses);
  for (const courses of [
    { aula03: {} },
    { aula02: { done: [14], notes: {} } },
    { aula02: { done: [], notes: { 99: "inválida" } } },
  ])
    assert.throws(() => validateStudy({ ...old, courses }));
});

test("laboratory production totals reconcile with source CSV and weighted rates", async () => {
  const results = await readJson("../src/data/aula02-results.json");
  const text = await readFile(
    new URL("../public/materiais/aula02/producao.csv", import.meta.url),
    "utf8",
  );
  const rows = text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(","));
  assert.equal(rows.length, 100);
  assert.equal(
    rows.reduce((sum, r) => sum + Number(r[3]), 0),
    results.producao.total,
  );
  for (const g of results.producao.rows) {
    const group = rows.filter((r) => r[1] === g.grupo);
    assert.equal(group.length, g.registros);
    assert.equal(
      group.reduce((sum, r) => sum + Number(r[3]), 0),
      g.pecas_produzidas,
    );
    assert.equal(
      group.reduce((sum, r) => sum + Number(r[4]), 0),
      g.pecas_defeituosas,
    );
    assert.ok(
      Math.abs(g.taxa - (g.pecas_defeituosas / g.pecas_produzidas) * 100) <
        1e-10,
    );
  }
  const project = await readJson("../src/data/aula02-project.json");
  assert.equal(project.steps.length, 5);
  assert.equal(
    project.rubric.reduce((s, r) => s + r.points, 0),
    100,
  );
});

test("Aula 02 uses distinct, traceable figures rather than recycled Aula 01 covers", async () => {
  const art = await readJson("../src/data/aula02-artwork.json");
  assert.equal(art.length, 14);
  assert.equal(new Set(art.map((item) => item.file)).size, 14);
  for (const [index, item] of art.entries()) {
    assert.equal(item.moduleId, index);
    assert.ok(item.alt && item.caption && item.label && item.source);
    assert.ok(item.file.startsWith("/course-art/aula02/curated/"));
    const bytes = await readFile(
      new URL("../public" + item.file, import.meta.url),
    );
    assert.ok(bytes.length > 500);
    if (item.file.endsWith(".svg")) {
      assert.ok(bytes.toString().includes("<svg"));
      assert.ok(!bytes.toString().includes("<script"));
    }
  }
  const figures = await readJson("../src/data/aula02-figures.json");
  assert.equal(figures[11].page, 54);
  assert.ok(figures[11].note.includes("inversão"));
});
