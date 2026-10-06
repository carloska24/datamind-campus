import path from "node:path";
import { fileURLToPath } from "node:url";

export function deploymentConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const address = env.PUBLIC_URL || env.RENDER_EXTERNAL_URL || "";
  let publicOrigin = "";
  if (address) {
    const url = new URL(address);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw Error("PUBLIC_URL deve ser a origem HTTPS do campus.");
    publicOrigin = url.origin;
  }
  if (production && !publicOrigin)
    throw Error("Configure PUBLIC_URL ou RENDER_EXTERNAL_URL em produção.");
  if (production && (!env.DATA_DIR || !path.isAbsolute(env.DATA_DIR)))
    throw Error(
      "Configure DATA_DIR com o caminho absoluto do disco persistente.",
    );
  if (production && (env.SETUP_TOKEN?.length || 0) < 32)
    throw Error(
      "Configure SETUP_TOKEN com pelo menos 32 caracteres para proteger o primeiro administrador.",
    );
  const dataDir =
    env.DATA_DIR || fileURLToPath(new URL("../.local/", import.meta.url));
  return {
    production,
    publicOrigin,
    dataDir,
    setupToken: env.SETUP_TOKEN || "",
    host: production ? "0.0.0.0" : "127.0.0.1",
    port: Number(env.PORT || 4173),
  };
}
