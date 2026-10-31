import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { getNarration } from "./tts.mjs";

// Cache only course narration. Notes, passwords and API keys never enter files.
export function createAudioCache({ directory, generate }) {
  const pending = new Map();
  const waiting = [];
  let active = 0;
  async function acquire() {
    if (active < 2) {
      active++;
      return;
    }
    await new Promise((resolve) => waiting.push(resolve));
  }
  function release() {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
  return async (body) => {
    if (!body.apiKey || body.apiKey.trim().length < 10)
      throw Error("Configure a chave de API no servidor para gerar áudio.");
    const text = getNarration(body.moduleId, body.sectionIndex, body.courseId);
    const voices =
      body.provider === "openai"
        ? ["coral", "alloy", "nova", "onyx", "sage", "shimmer"]
        : ["Kore", "Puck", "Aoede", "Charon", "Zephyr", "Sulafat"];
    const voice = voices.includes(body.voice) ? body.voice : voices[0];
    const model =
      body.provider === "openai"
        ? "gpt-4o-mini-tts"
        : body.model || "gemini-3.8-flash-tts";
    if (!["openai", "gemini"].includes(body.provider))
      throw Error("Escolha OpenAI ou Gemini.");
    const key = createHash("sha256")
      .update(JSON.stringify([1, body.provider, model, voice, text]))
      .digest("hex");
    const type = body.provider === "openai" ? "audio/mpeg" : "audio/wav";
    const file = path.join(
      directory,
      key + (body.provider === "openai" ? ".mp3" : ".wav"),
    );
    try {
      const bytes = await readFile(file);
      if (bytes.length) return { bytes, type };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= 30)
      throw Object.assign(
        Error("Há áudios na fila. Aguarde um momento e tente novamente."),
        { status: 429 },
      );
    const operation = (async () => {
      await acquire();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90000);
      try {
        const result = await generate(
          { ...body, model, voice },
          controller.signal,
        );
        const temporary = file + "." + randomUUID() + ".tmp";
        try {
          await mkdir(directory, { recursive: true, mode: 0o700 });
          await writeFile(temporary, result.bytes, { flag: "wx", mode: 0o600 });
          await rename(temporary, file);
        } catch {
          // Audio still works if the cache is full/unavailable; no false saved status.
          await rm(temporary, { force: true }).catch(() => {});
        }
        return result;
      } finally {
        clearTimeout(timer);
        release();
      }
    })();
    pending.set(key, operation);
    try {
      return await operation;
    } finally {
      pending.delete(key);
    }
  };
}
