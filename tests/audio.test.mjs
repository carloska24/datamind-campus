import test from "node:test";
import assert from "node:assert/strict";
import {
  generateSpeech,
  getNarration,
  extractGeminiAudio,
  wavFromPCM,
} from "../server/tts.mjs";
test("narração limitada ao módulo e trecho solicitados", () => {
  assert.match(getNarration(0, 0), /Da pergunta à decisão/);
  assert.throws(() => getNarration(99, 0));
  assert.throws(() => getNarration(0, -1));
});
test("OpenAI usa endpoint de voz e devolve bytes", async () => {
  let sent;
  const fake = async (url, opts) => {
    sent = { url, opts };
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
  };
  const r = await generateSpeech(
    {
      provider: "openai",
      apiKey: "test-key-not-real",
      moduleId: 0,
      sectionIndex: 1,
      voice: "coral",
    },
    fake,
  );
  assert.equal(r.type, "audio/mpeg");
  assert.equal(sent.url, "https://api.openai.com/v1/audio/speech");
  const body = JSON.parse(sent.opts.body);
  assert.equal(body.model, "gpt-4o-mini-tts");
  assert.match(body.input, /AOI/);
});
test("Gemini usa Interactions e transforma PCM em WAV", async () => {
  let sent;
  const fake = async (url, opts) => {
    sent = { url, opts };
    return Response.json({
      steps: [
        {
          type: "model_output",
          content: [
            {
              type: "audio",
              data: Buffer.from([0, 1, 0, 2]).toString("base64"),
            },
          ],
        },
      ],
    });
  };
  const r = await generateSpeech(
    {
      provider: "gemini",
      apiKey: "test-key-not-real",
      moduleId: 11,
      sectionIndex: 0,
      voice: "Kore",
    },
    fake,
  );
  assert.equal(r.bytes.subarray(0, 4).toString(), "RIFF");
  assert.equal(r.bytes.readUInt32LE(24), 24000);
  assert.equal(
    sent.url,
    "https://generativelanguage.googleapis.com/v1beta/interactions",
  );
  assert.equal(JSON.parse(sent.opts.body).model, "gemini-3.8-flash-tts");
});
test("erros de provedor não expõem chave ou resposta bruta", async () => {
  await assert.rejects(
    generateSpeech(
      {
        provider: "openai",
        apiKey: "secret-testing-key",
        moduleId: 0,
        sectionIndex: 0,
      },
      async () => new Response("secret-testing-key", { status: 401 }),
    ),
    (e) =>
      !e.message.includes("secret-testing-key") && e.message.includes("Chave"),
  );
  await assert.rejects(
    generateSpeech(
      {
        provider: "gemini",
        apiKey: "test-key-not-real",
        moduleId: 0,
        sectionIndex: 0,
        model: "../../danger",
      },
      async () => {
        throw Error("Não deveria chamar");
      },
    ),
    /identificador/,
  );
});
test("WAV completo preservado e resposta sem áudio rejeitada", () => {
  const wav = wavFromPCM(Buffer.from([0, 1, 0, 2]));
  assert.deepEqual(
    extractGeminiAudio({
      steps: [
        {
          type: "model_output",
          content: [{ type: "audio", data: wav.toString("base64") }],
        },
      ],
    }),
    wav,
  );
  assert.throws(() => extractGeminiAudio({ steps: [] }));
});

test("falha de rede informa o provedor e o bloqueio sem expor dados internos", async () => {
  for (const provider of ["openai", "gemini"]) {
    const failure = new TypeError("fetch failed secret-testing-key", {
      cause: new AggregateError([
        Object.assign(new Error("private address"), { code: "EACCES" }),
      ]),
    });
    await assert.rejects(
      generateSpeech(
        {
          provider,
          apiKey: "secret-testing-key",
          moduleId: 0,
          sectionIndex: 0,
        },
        async () => {
          throw failure;
        },
      ),
      (e) => {
        assert.equal(e.status, 502);
        assert.match(e.message, /bloqueada/);
        assert.match(e.message, /iniciador local/);
        assert.ok(
          e.message.includes(
            provider === "gemini" ? "Google Gemini" : "OpenAI",
          ),
        );
        assert.ok(!e.message.includes("secret-testing-key"));
        assert.ok(!e.message.includes("private address"));
        return true;
      },
    );
  }
});

test("falha comum de conexão orienta verificar a rede e cancelamento permanece cancelamento", async () => {
  const body = {
    provider: "gemini",
    apiKey: "test-key-not-real",
    moduleId: 0,
    sectionIndex: 0,
  };
  await assert.rejects(
    generateSpeech(body, async () => {
      throw new TypeError("fetch failed", {
        cause: Object.assign(new Error(), { code: "ENOTFOUND" }),
      });
    }),
    (e) => e.status === 502 && /conexão com a internet/.test(e.message),
  );
  const abort = new DOMException("Canceled", "AbortError");
  await assert.rejects(
    generateSpeech(body, async () => {
      throw abort;
    }),
    (e) => e === abort,
  );
});
