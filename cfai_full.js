var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/itty-router/index.mjs
var e = /* @__PURE__ */ __name(({ base: e2 = "", routes: t = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: (o3, s2, r2, n2) => "handle" == s2 ? r2.fetch : (o4, ...a) => t.push([s2.toUpperCase?.(), RegExp(`^${(n2 = (e2 + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), a, n2]) && r2 }), routes: t, ...o2, async fetch(e3, ...o3) {
  let s2, r2, n2 = new URL(e3.url), a = e3.query = { __proto__: null };
  for (let [e4, t2] of n2.searchParams)
    a[e4] = a[e4] ? [].concat(a[e4], t2) : t2;
  for (let [a2, c2, i2, l2] of t)
    if ((a2 == e3.method || "ALL" == a2) && (r2 = n2.pathname.match(c2))) {
      e3.params = r2.groups || {}, e3.route = l2;
      for (let t2 of i2)
        if (null != (s2 = await t2(e3.proxy ?? e3, ...o3)))
          return s2;
    }
} }), "e");
var o = /* @__PURE__ */ __name((e2 = "text/plain; charset=utf-8", t) => (o2, { headers: s2 = {}, ...r2 } = {}) => void 0 === o2 || "Response" === o2?.constructor.name ? o2 : new Response(t ? t(o2) : o2, { headers: { "content-type": e2, ...s2.entries ? Object.fromEntries(s2) : s2 }, ...r2 }), "o");
var s = o("application/json; charset=utf-8", JSON.stringify);
var r = /* @__PURE__ */ __name((e2) => ({ 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 500: "Internal Server Error" })[e2] || "Unknown Error", "r");
var n = /* @__PURE__ */ __name((e2 = 500, t) => {
  if (e2 instanceof Error) {
    const { message: o2, ...s2 } = e2;
    e2 = e2.status || 500, t = { error: o2 || r(e2), ...s2 };
  }
  return t = { status: e2, ..."object" == typeof t ? t : { error: t || r(e2) } }, s(t, { status: e2 });
}, "n");
var c = o("text/plain; charset=utf-8", String);
var i = o("text/html");
var l = o("image/jpeg");
var p = o("image/png");
var d = o("image/webp");
var f = /* @__PURE__ */ __name((e2 = {}) => {
  const { origins: t = ["*"], maxAge: o2, methods: s2 = ["GET"], headers: r2 = {} } = e2;
  let n2;
  const a = "function" == typeof t ? t : (e3) => t.includes(e3) || t.includes("*"), c2 = { "content-type": "application/json", "Access-Control-Allow-Methods": s2.join(", "), ...r2 };
  o2 && (c2["Access-Control-Max-Age"] = o2);
  return { corsify: (e3) => {
    if (!e3)
      throw new Error("No fetch handler responded and no upstream to proxy to specified.");
    const { headers: t2, status: o3, body: s3 } = e3;
    return [101, 301, 302, 308].includes(o3) || t2.get("access-control-allow-origin") ? e3 : new Response(s3, { status: o3, headers: { ...Object.fromEntries(t2), ...c2, ...n2, "content-type": t2.get("content-type") } });
  }, preflight: (e3) => {
    const t2 = [.../* @__PURE__ */ new Set(["OPTIONS", ...s2])], o3 = e3.headers.get("origin") || "";
    if (n2 = a(o3) && { "Access-Control-Allow-Origin": o3 }, "OPTIONS" === e3.method) {
      const o4 = { ...c2, "Access-Control-Allow-Methods": t2.join(", "), "Access-Control-Allow-Headers": e3.headers.get("Access-Control-Request-Headers"), ...n2 };
      return new Response(null, { headers: e3.headers.get("Origin") && e3.headers.get("Access-Control-Request-Method") && e3.headers.get("Access-Control-Request-Headers") ? o4 : { Allow: t2.join(", ") } });
    }
  } };
}, "f");

// routes/chat.js
var chatHandler = /* @__PURE__ */ __name(async (request, env) => {
  let model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  let messages = [];
  let error = null;
  const created = Math.floor(Date.now() / 1e3);
  const uuid = crypto.randomUUID();
  try {
    if (request.headers.get("Content-Type") === "application/json") {
      let json = await request.json();
      if (json?.model) {
        const mapper = env.MODEL_MAPPER ?? {};
        model = mapper[json.model] ? mapper[json.model] : json.model;
      }
      if (json?.messages) {
        if (Array.isArray(json.messages)) {
          if (json.messages.length === 0) {
            return Response.json({ error: "no messages provided" }, { status: 400 });
          }
          messages = json.messages;
        }
      }
      if (!json?.stream)
        json.stream = false;
      let buffer = "";
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      const transformer = new TransformStream({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk);
          while (true) {
            const newlineIndex = buffer.indexOf("\n");
            if (newlineIndex === -1) {
              break;
            }
            const line = buffer.slice(0, newlineIndex + 1);
            buffer = buffer.slice(newlineIndex + 1);
            try {
              if (line.startsWith("data: ")) {
                const content = line.slice("data: ".length);
                console.log(content);
                const doneflag = content.trim() == "[DONE]";
                if (doneflag) {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  return;
                }
                const data = JSON.parse(content);
                const newChunk = "data: " + JSON.stringify({
                  id: uuid,
                  created,
                  object: "chat.completion.chunk",
                  model,
                  choices: [
                    {
                      delta: { content: data.response },
                      index: 0,
                      finish_reason: null
                    }
                  ]
                }) + "\n\n";
                controller.enqueue(encoder.encode(newChunk));
              }
            } catch (err) {
              console.error("Error parsing line:", err);
            }
          }
        }
      });
      const aiResp = await env.AI.run(model, { stream: json.stream, messages });
      return json.stream ? new Response(aiResp.pipeThrough(transformer), {
        headers: {
          "content-type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      }) : Response.json({
        id: uuid,
        model,
        created,
        object: "chat.completion",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: aiResp.response
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      });
    }
  } catch (e2) {
    error = e2;
  }
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "invalid request" }, { status: 400 });
}, "chatHandler");

// routes/completion.js
var completionHandler = /* @__PURE__ */ __name(async (request, env) => {
  let model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  const created = Math.floor(Date.now() / 1e3);
  const uuid = crypto.randomUUID();
  let error = null;
  try {
    if (request.headers.get("Content-Type") === "application/json") {
      let json = await request.json();
      if (json?.model) {
        const mapper = env.MODEL_MAPPER ?? {};
        model = mapper[json.model] ? mapper[json.model] : json.model;
      }
      if (json?.prompt) {
        if (typeof json.prompt === "string") {
          if (json.prompt.length === 0) {
            return Response.json({ error: "no prompt provided" }, { status: 400 });
          }
        }
      }
      const aiResp = await env.AI.run(model, { prompt: json.prompt });
      return Response.json({
        id: uuid,
        model,
        created,
        object: "text_completion",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            text: aiResp.response,
            logprobs: null
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      });
    }
  } catch (e2) {
    error = e2;
  }
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "invalid request" }, { status: 400 });
}, "completionHandler");

// routes/embeddings.js
var embeddingsHandler = /* @__PURE__ */ __name(async (request, env) => {
  let model = "@cf/baai/bge-base-en-v1.5";
  let error = null;
  try {
    if (request.headers.get("Content-Type") === "application/json") {
      const json = await request.json();
      const embeddings = await env.AI.run(model, {
        text: json.input
      });
      return Response.json({
        object: "list",
        data: [
          {
            object: "embedding",
            embedding: embeddings.data[0],
            index: 0
          }
        ],
        model,
        usage: {
          prompt_tokens: 0,
          total_tokens: 0
        }
      });
    }
  } catch (e2) {
    error = e2;
  }
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "invalid request" }, { status: 400 });
}, "embeddingsHandler");

// routes/audio.js
var transcriptionHandler = /* @__PURE__ */ __name(async (request, env) => {
  let model = "@cf/openai/whisper";
  let error = null;
  console.log(request.headers.get("Content-Type"));
  try {
    if (request.headers.get("Content-Type").includes("multipart/form-data")) {
      const formData = await request.formData();
      const audio = formData.get("file");
      if (!audio) {
        return Response.json({ error: "no audi`o provided" }, { status: 400 });
      }
      const blob = await audio.arrayBuffer();
      const input = {
        audio: [...new Uint8Array(blob)]
      };
      const resp = await env.AI.run(model, input);
      return Response.json({
        text: resp.text
      });
    }
  } catch (e2) {
    error = e2;
  }
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "invalid request" }, { status: 400 });
}, "transcriptionHandler");
function getLanguageId(text) {
  text = text.toLowerCase();
  if (text.includes("\n")) {
    return text.split("\n")[0];
  } else if (text.includes(" ")) {
    return text.split(" ")[0];
  } else {
    return text;
  }
}
__name(getLanguageId, "getLanguageId");
var translationHandler = /* @__PURE__ */ __name(async (request, env) => {
  let model = "@cf/openai/whisper";
  let error = null;
  try {
    if (request.headers.get("Content-Type").includes("multipart/form-data")) {
      const formData = await request.formData();
      const audio = formData.get("file");
      if (!audio) {
        throw new Error("no audio provided");
      }
      const blob = await audio.arrayBuffer();
      const input = {
        audio: [...new Uint8Array(blob)]
      };
      const resp = await env.AI.run(model, input);
      const language_id_resp = await env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
        messages: [
          {
            role: "user",
            content: "Output one of the following: english, chinese, french, spanish, arabic, russian, german, japanese, portuguese, hindi. Identify the following languages.\nQ:'Hola mi nombre es brian y el tuyo?'"
          },
          { role: "assistant", content: "spanish" },
          { role: "user", content: "Was f\xFCr ein sch\xF6nes Baby!" },
          { role: "assistant", content: "german" },
          { role: "user", content: resp.text }
        ]
      });
      const translation_resp = await env.AI.run("@cf/meta/m2m100-1.2b", {
        text: resp.text,
        source_lang: getLanguageId(language_id_resp.response),
        target_lang: "english"
      });
      if (!translation_resp.translated_text) {
        console.log({ translation_resp });
        throw new Error("translation failed");
      }
      return Response.json({
        text: translation_resp.translated_text
      });
    }
  } catch (e2) {
    error = e2;
  }
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "invalid request" }, { status: 400 });
}, "translationHandler");

// utils/converters.js
function uint8ArrayToBase64(uint8Array) {
  let string = "";
  uint8Array.forEach((byte) => {
    string += String.fromCharCode(byte);
  });
  return btoa(string);
}
__name(uint8ArrayToBase64, "uint8ArrayToBase64");

// utils/uuid.js
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c2) {
    const r2 = Math.random() * 16 | 0;
    const v = c2 === "x" ? r2 : r2 & 3 | 8;
    return v.toString(16);
  });
}
__name(uuidv4, "uuidv4");

// utils/stream.js
async function streamToBuffer(stream) {
  const chunks = [];
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      chunks.push(value);
    }
    const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }
    return concatenated;
  } finally {
    reader.releaseLock();
  }
}
__name(streamToBuffer, "streamToBuffer");

// routes/image.js
var imageGenerationHandler = /* @__PURE__ */ __name(async (request, env) => {
  let model = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
  let format = "url";
  let error = null;
  let created = Math.floor(Date.now() / 1e3);
  try {
    if (request.headers.get("Content-Type") === "application/json") {
      let json = await request.json();
      if (!json?.prompt) {
        throw new Error("no prompt provided");
      }
      if (json?.format) {
        format = json.format;
        if (format !== "b64_json" && format !== "url") {
          throw new Error("invalid format. must be b64_json or url");
        }
      }
      const inputs = {
        prompt: json.prompt
      };
      const respStream = await env.AI.run(model, inputs);
      const respBuffer = await streamToBuffer(respStream);
      if (format === "b64_json") {
        const b64_json = uint8ArrayToBase64(respBuffer);
        return new Response(JSON.stringify({
          data: [{ b64_json }],
          created
        }), {
          headers: {
            "Content-Type": "application/json"
          }
        });
      } else {
        const name = uuidv4() + ".png";
        await env.IMAGE_BUCKET.put(name, respBuffer);
        const urlObj = new URL(request.url);
        const url = urlObj.origin + "/v1/images/get/" + name;
        return new Response(JSON.stringify({
          data: [{ url }],
          created
        }), {
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
    }
  } catch (e2) {
    error = e2;
  }
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  return new Response(JSON.stringify({ error: "invalid request" }), {
    status: 400,
    headers: {
      "Content-Type": "application/json"
    }
  });
}, "imageGenerationHandler");
var getImageHandler = /* @__PURE__ */ __name(async (request, env) => {
  const { params } = request;
  const { name } = params;
  if (!name) {
    return new Response(null, {
      status: 404
    });
  }
  const image = await env.IMAGE_BUCKET.get(name);
  if (!image) {
    return new Response(null, {
      status: 404
    });
  }
  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png"
    }
  });
}, "getImageHandler");

// routes/models.js
var getModels = /* @__PURE__ */ __name(async (env) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/models/search?hide_experimental=false&search=Text+Generation`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}`
  };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }
  const data = await response.json();
  return data.result;
}, "getModels");
var modelsHandler = /* @__PURE__ */ __name(async (request, env) => {
  const models = await getModels(env);
  const modelList = models.map((model) => ({
    id: model.name,
    object: "model",
    created: Math.round(Date.now()),
    owned_by: model.source === 1 ? "cloudflare" : "huggingface"
  }));
  return s({
    object: "list",
    data: modelList
  });
}, "modelsHandler");

// index.js
var { preflight, corsify } = f();
var router = e({ base: "/v1" });
function extractToken(authorizationHeader) {
  if (authorizationHeader) {
    const parts = authorizationHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
  }
  return null;
}
__name(extractToken, "extractToken");
var bearerAuthentication = /* @__PURE__ */ __name((request, env) => {
  const authorizationHeader = request.headers.get("Authorization");
  if (!authorizationHeader) {
    return n(401, "Unauthorized");
  }
  const access_token = extractToken(authorizationHeader);
  if (env.ACCESS_TOKEN !== access_token) {
    return n(403, "Forbidden");
  }
}, "bearerAuthentication");
router.all("*", preflight);
router.all("*", bearerAuthentication).post("/chat/completions", chatHandler).post("/completions", completionHandler).post("/embeddings", embeddingsHandler).post("/audio/transcriptions", transcriptionHandler).post("/audio/translations", translationHandler).post("/images/generations", imageGenerationHandler).get("/images/get/:name", getImageHandler).get("/models", modelsHandler);
router.all("*", () => new Response("404, not found!", { status: 404 }));
var openai_cf_workers_ai_default = {
  fetch: (request, env, ctx) => router.handle(request, env, ctx).catch((e2) => {
    console.error(e2);
    return n(e2);
  }).then(corsify)
};
export {
  openai_cf_workers_ai_default as default
};
//# sourceMappingURL=index.js.map
