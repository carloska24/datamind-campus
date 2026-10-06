import { readFileSync } from "node:fs";
export function getNarration(moduleId, sectionIndex) {
  // Read the same lesson source as the current build, even after a content update.
  const modules = JSON.parse(
    readFileSync(new URL("../src/data/modules.json", import.meta.url), "utf8"),
  );
  if (
    !Number.isInteger(moduleId) ||
    moduleId < 0 ||
    moduleId >= modules.length ||
    !Number.isInteger(sectionIndex) ||
    sectionIndex < 0 ||
    sectionIndex > 3
  )
    throw new Error("Selecione um módulo e um trecho válidos.");
  const m = modules[moduleId];
  return [
    `Nesta aula, vamos estudar ${m.title}. ${m.idea} Primeiro, entenda o conceito. ${m.explain}`,
    `Vamos conectar isso à prática. ${m.example}`,
    `Agora, uma pergunta para você. ${m.question} Pause a reprodução e tente responder com as suas palavras antes de seguir para o próximo trecho.`,
    `Vamos conferir o raciocínio. ${m.answer} Para revisar, explique a ideia central sem olhar e pense em outro exemplo da sua rotina.`,
  ][sectionIndex];
}
export function wavFromPCM(bytes, rate = 24000) {
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(36 + bytes.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(bytes.length, 40);
  return Buffer.concat([header, bytes]);
}
export function extractGeminiAudio(result) {
  const blocks = (result.steps || [])
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content || [])
    .filter((c) => c.type === "audio" && c.data);
  if (!blocks.length)
    throw new Error(
      "O Gemini não retornou áudio. Verifique o modelo TTS e o acesso da conta.",
    );
  const last = blocks.at(-1);
  const bytes = Buffer.from(last.data, "base64");
  if (bytes.length < 4) throw new Error("O Gemini retornou áudio vazio.");
  if (bytes.subarray(0, 4).toString() === "RIFF") return bytes;
  return wavFromPCM(bytes, 24000);
}
export function providerError(status) {
  if (status === 401 || status === 403)
    return "Chave inválida ou sem permissão para este modelo. Verifique sua conta e o serviço escolhido.";
  if (status === 429)
    return "Limite ou saldo da API atingido. Verifique a quota do serviço e tente mais tarde.";
  if (status === 404)
    return "Modelo de voz não disponível para esta conta. Confira o identificador do modelo na documentação do provedor.";
  return `O serviço de voz respondeu com erro ${status}. Confira o modelo, a quota e o acesso da conta.`;
}
export async function generateSpeech(body, fetchImpl = fetch, signal) {
  try {
    return await requestSpeech(body, fetchImpl, signal);
  } catch (e) {
    if (e.name === "AbortError" || e.name === "TimeoutError") throw e;
    const codes = [
      e.code,
      e.cause?.code,
      ...(e.cause?.errors || []).map((error) => error.code),
    ];
    const networkCodes = [
      "EACCES",
      "EPERM",
      "ENOTFOUND",
      "EAI_AGAIN",
      "ECONNREFUSED",
      "ECONNRESET",
      "ETIMEDOUT",
      "ENETUNREACH",
      "EHOSTUNREACH",
    ];
    if (
      (e instanceof TypeError && e.message.startsWith("fetch failed")) ||
      codes.some((code) => networkCodes.includes(code))
    ) {
      const provider = body.provider === "gemini" ? "Google Gemini" : "OpenAI";
      const blocked = codes.some((code) => ["EACCES", "EPERM"].includes(code));
      const error = new Error(
        blocked
          ? `A conexão do servidor com ${provider} foi bloqueada. Feche o servidor atual e reabra o projeto pelo iniciador local para permitir acesso à internet.`
          : `Não foi possível conectar o servidor a ${provider}. Verifique a conexão com a internet, o proxy ou o firewall e tente novamente.`,
      );
      error.status = 502;
      throw error;
    }
    throw e;
  }
}

async function requestSpeech(body, fetchImpl, signal) {
  const { provider, apiKey, moduleId, sectionIndex } = body;
  if (!["openai", "gemini"].includes(provider))
    throw Error("Escolha OpenAI ou Gemini.");
  if (
    typeof apiKey !== "string" ||
    apiKey.trim().length < 10 ||
    apiKey.length > 512 ||
    /[\r\n]/.test(apiKey)
  )
    throw Error("Insira uma chave de API válida.");
  const text = getNarration(moduleId, sectionIndex);
  let response;
  if (provider === "openai") {
    const voice = [
      "coral",
      "alloy",
      "nova",
      "onyx",
      "sage",
      "shimmer",
    ].includes(body.voice)
      ? body.voice
      : "coral";
    response = await fetchImpl("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: text,
        instructions:
          "Narre em português brasileiro, com dicção clara, tom acolhedor de professor e pausas naturais. Leia fielmente o texto, sem acrescentar conteúdo.",
        response_format: "mp3",
      }),
    });
    if (!response.ok) throw Error(providerError(response.status));
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0) throw Error("O serviço retornou áudio vazio.");
    return { bytes, type: "audio/mpeg" };
  }
  const model = body.model || "gemini-3.8-flash-tts";
  if (
    typeof model !== "string" ||
    !/^gemini-[a-z0-9.-]{1,70}tts(?:-[a-z0-9.-]+)?$/.test(model)
  )
    throw Error("Informe um identificador válido de modelo Gemini TTS.");
  const voice = [
    "Kore",
    "Puck",
    "Aoede",
    "Charon",
    "Zephyr",
    "Sulafat",
  ].includes(body.voice)
    ? body.voice
    : "Kore";
  response = await fetchImpl(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      signal,
      headers: {
        "x-goog-api-key": apiKey.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "text",
                text,
                annotations: [
                  {
                    type: "speech_metadata",
                    style:
                      "Brazilian Portuguese narration. Calm, clear teacher voice. Read the exact supplied text, with natural pauses, without adding commentary.",
                  },
                ],
              },
            ],
          },
        ],
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice }] },
      }),
    },
  );
  if (!response.ok) throw Error(providerError(response.status));
  return {
    bytes: extractGeminiAudio(await response.json()),
    type: "audio/wav",
  };
}
