import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
let html = await readFile("dist/index.html", "utf8");
const scriptMatch = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const cssMatch = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
if (!scriptMatch || !cssMatch) throw Error("Assets de build não encontrados.");
let js = await readFile(path.join("dist", scriptMatch[1]), "utf8");
// Inline course images as well as code so ABRIR.html remains self-contained.
const imagePaths = new Set(
  js.match(/\/course-art\/[a-zA-Z0-9_./-]+\.(?:png|jpg|svg)/g) ?? [],
);
const embeddedImages = [];
for (const file of imagePaths) {
  const bytes = await readFile(path.join("dist", file.slice(1)));
  const mime = file.endsWith(".svg")
    ? "image/svg+xml"
    : file.endsWith(".png")
      ? "image/png"
      : "image/jpeg";
  const name = `__datamindCourseImage${embeddedImages.length}`;
  embeddedImages.push(
    `const ${name}="data:${mime};base64,${bytes.toString("base64")}";`,
  );
  // Vite may emit plain string literals with any of the three quote styles.
  for (const quote of ['"', "'", "`"]) {
    js = js.replaceAll(`${quote}${file}${quote}`, name);
  }
}
js = embeddedImages.join("\n") + "\n" + js;
if (/\/course-art\/[a-zA-Z0-9_./-]+\.(?:png|jpg|svg)/.test(js)) {
  throw Error("Uma imagem do curso não foi incorporada no HTML portátil.");
}
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
