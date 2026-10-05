import { mkdir, readFile, rename, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const defaultFile = new URL("../.local/api-keys.json", import.meta.url);
const providers = ["openai", "gemini"];

function validateProvider(provider) {
  if (!providers.includes(provider)) throw Error("Escolha um provedor válido.");
}

export function validateApiKey(key) {
  if (
    typeof key !== "string" ||
    key.trim().length < 10 ||
    key.length > 512 ||
    /[\r\n]/.test(key)
  )
    throw Error("Insira uma chave de API válida.");
  return key.trim();
}

export async function createCredentialStore({
  file = defaultFile,
  env = process.env,
} = {}) {
  const filePath = file instanceof URL ? fileURLToPath(file) : file;
  let saved = {};
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8"));
    for (const provider of providers) {
      if (parsed?.[provider] !== undefined)
        saved[provider] = validateApiKey(parsed[provider]);
    }
  } catch (e) {
    if (e.code !== "ENOENT")
      throw Error(
        "Não foi possível ler a configuração local de API. Confira .local/api-keys.json.",
      );
  }
  const environment = {
    openai: env.OPENAI_API_KEY?.trim() || "",
    gemini: env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim() || "",
  };
  // Serialize updates so saving one provider cannot discard another provider's key.
  let pending = Promise.resolve();
  function update(provider, key) {
    const operation = pending.then(async () => {
      validateProvider(provider);
      if (environment[provider])
        throw Error(
          "Esta chave vem do ambiente. Altere ou remova a variável no servidor.",
        );
      const next = { ...saved };
      if (key === undefined) delete next[provider];
      else next[provider] = validateApiKey(key);
      const temporary = `${filePath}.${randomUUID()}.tmp`;
      try {
        await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
        await writeFile(temporary, JSON.stringify(next), {
          mode: 0o600,
          flag: "wx",
        });
        await rename(temporary, filePath);
      } catch {
        await rm(temporary, { force: true }).catch(() => {});
        throw Error(
          "Não foi possível salvar a configuração local. Confira a permissão de escrita na pasta do projeto.",
        );
      }
      saved = next;
    });
    pending = operation.catch(() => {});
    return operation;
  }
  return {
    get(provider) {
      validateProvider(provider);
      return environment[provider] || saved[provider] || "";
    },
    status() {
      return Object.fromEntries(
        providers.map((provider) => [
          provider,
          environment[provider]
            ? "environment"
            : saved[provider]
              ? "local"
              : null,
        ]),
      );
    },
    save: async (provider, key) => update(provider, validateApiKey(key)),
    remove: (provider) => update(provider),
  };
}
