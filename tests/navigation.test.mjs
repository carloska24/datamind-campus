import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute, routeHash, studyDestination } from "../src/navigation.ts";
import { searchText } from "../src/search.ts";

test("endereços preservam módulo e trecho e funcionam como fragmentos portáteis", () => {
  const routes = [
    { page: "home" },
    { page: "course" },
    { page: "notes" },
    { page: "resources" },
    { page: "lesson", moduleId: 8 },
    { page: "audio", moduleId: 9, position: 2 },
    { page: "kdd", position: 4 },
    { page: "labs", position: 1 },
    { page: "review", moduleId: 13 },
  ];
  for (const route of routes)
    assert.deepEqual(parseRoute(routeHash(route), 14), route);
  assert.equal(routeHash(routes[5]), "#/audio/10/3");
});
test("links inválidos não acessam conteúdo fora dos limites nem aceitam caminhos extras", () => {
  for (const hash of [
    "#/aula/0",
    "#/aula/15",
    "#/aula/1.5",
    "#/audio/2/5",
    "#/kdd/6",
    "#/laboratorios/3",
    "#/revisao/-1",
    "#/aula/1/extra",
    "#/inicio/extra",
    "#/desconhecido",
    "#/aula/%31",
  ])
    assert.equal(parseRoute(hash, 14), null, hash);
  assert.deepEqual(parseRoute("", 14), { page: "home" });
  assert.deepEqual(parseRoute("#/audio/9/3/", 14), {
    page: "audio",
    moduleId: 8,
    position: 2,
  });
});
test("retomada prioriza atividade real; trilha concluída conduz à revisão", () => {
  assert.deepEqual(studyDestination([0, 1], null, 14), {
    page: "lesson",
    moduleId: 2,
  });
  const audio = { page: "audio", moduleId: 8, position: 2 };
  assert.deepEqual(studyDestination([], audio, 14), audio);
  assert.deepEqual(studyDestination([0], { page: "home" }, 14), {
    page: "lesson",
    moduleId: 1,
  });
  assert.deepEqual(
    studyDestination(
      Array.from({ length: 14 }, (_, i) => i),
      audio,
      14,
    ),
    { page: "review", moduleId: 0 },
  );
});
test("busca normaliza acento, caixa e espaços nas duas entradas", () => {
  assert.equal(searchText(" CORRELAÇÃO "), searchText("correlacao"));
  assert.ok(
    searchText("KDD: pré-processamento").includes(
      searchText("PRE-PROCESSAMENTO"),
    ),
  );
});
