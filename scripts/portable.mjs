import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
let html = await readFile("dist/index.html", "utf8");
const scriptMatch = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const cssMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
if (!scriptMatch || !cssMatch) throw Error("Assets de build não encontrados.");
const js = await readFile(path.join("dist", scriptMatch[1]), "utf8");
const css = await readFile(path.join("dist", cssMatch[1]), "utf8");
html = html
  .replace(
    scriptMatch[0],
    () =>
      `<script type="module">${js.replace(/<\/script/gi, "<\\/script")}</script>`,
  )
  .replace(cssMatch[0], () => `<style>${css}</style>`);
await writeFile("dist/ABRIR.html", html);
console.log(
  "dist/ABRIR.html: versão portátil sem dependências externas. APIs exigem npm start.",
);
