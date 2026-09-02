// Unified AI provider layer for AINOS tools.
//
// Fallback chain (text):   Groq → Gemini → Cloudflare → HuggingFace → Pollinations
// Fallback chain (vision): Groq → Gemini → Cloudflare → HuggingFace → Pollinations
//
// All providers are 100% free tiers (no credit card). Code auto-activates
// each provider when its tokens are present in .env — order is honoured, so
// missing providers are simply skipped.
//
// Why multiple providers?
// - Groq free keys are fast but get rate-limited (30 req/min) and Groq
//   periodically decommissions free models. Gemini has been unreliable on
//   free keys. Pollinations returns 402/502 often. Cloudflare (10K
//   neurons/day) and HuggingFace (1K req/day) give us two more safety nets
//   for the demo.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
// Both models use GPT-OSS family — Groq decommissioned all Llama-3.x and Llama-4
// variants on the free tier. openai/gpt-oss-20b is the only text model that
// works reliably on free keys; qwen/qwen3.6-27b is the only vision model that
// still returns 200 OK.
const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL || 'openai/gpt-oss-20b';
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

// Cloudflare Workers AI — 10K neurons/day free (no card)
const CLOUDFLARE_API_KEY = (process.env.CLOUDFLARE_API_KEY || '').trim();
const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const CLOUDFLARE_ACCOUNT_EMAIL = (process.env.CLOUDFLARE_ACCOUNT_EMAIL || '').trim();
const CLOUDFLARE_TEXT_MODEL = process.env.CLOUDFLARE_TEXT_MODEL || '@cf/meta/llama-3.1-8b-instruct';
const CLOUDFLARE_VISION_MODEL = process.env.CLOUDFLARE_VISION_MODEL || '@cf/llava-hf/llava-1.5-7b-hf';

// HuggingFace Inference API — 1K req/day free (no card)
const HUGGINGFACE_API_KEY = (process.env.HUGGINGFACE_API_KEY || '').trim();
const HUGGINGFACE_TEXT_MODEL = process.env.HUGGINGFACE_TEXT_MODEL || 'meta-llama/Llama-3.2-3B-Instruct';
const HUGGINGFACE_VISION_MODEL = process.env.HUGGINGFACE_VISION_MODEL || 'Salesforce/blip-image-captioning-large';

// ─── Key rotation helpers ───────────────────────────────────────────────────

// Supports multiple keys so rate limits rotate: GROQ_API_KEYS="key1,key2" and/or GROQ_API_KEY
function groqKeys(): string[] {
  const list = (process.env.GROQ_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  const single = (process.env.GROQ_API_KEY || '').trim();
  if (single && !list.includes(single)) list.push(single);
  return list;
}

// Supports multiple keys so quota rotates: GEMINI_API_KEYS="key1,key2" and/or GEMINI_API_KEY
function geminiKeys(): string[] {
  const list = (process.env.GEMINI_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  const single = (process.env.GEMINI_API_KEY || '').trim();
  if (single && !list.includes(single)) list.push(single);
  return list;
}

function geminiKey(): string | undefined {
  return geminiKeys()[0];
}

// Supports multiple keys for Cloudflare and HuggingFace too
function cloudflareKeys(): string[] {
  const list = (process.env.CLOUDFLARE_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (CLOUDFLARE_API_KEY && !list.includes(CLOUDFLARE_API_KEY)) list.push(CLOUDFLARE_API_KEY);
  return list;
}

function huggingfaceKeys(): string[] {
  const list = (process.env.HUGGINGFACE_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (HUGGINGFACE_API_KEY && !list.includes(HUGGINGFACE_API_KEY)) list.push(HUGGINGFACE_API_KEY);
  return list;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Sleep helper used between retries
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Groq helpers (primary — free, fast, no billing) ────────────────────────

async function callGroq(
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  options: { json?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  const keys = groqKeys();
  if (!keys.length) throw new Error('No Groq API key');

  const body: Record<string, unknown> = {
    model: GROQ_TEXT_MODEL,
    messages,
    // openai/gpt-oss-20b has an 8k TPM limit — keep max_tokens small enough
    // that a single request stays under it, otherwise Groq returns 413.
    max_tokens: 4096,
  };
  if (options.json) {
    body.response_format = { type: 'json_object' };
  }

  // Rotate keys on rate limit (429) so multiple keys pool their limits
  let lastErr = '';
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[attempt % keys.length];
    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      }, options.timeoutMs ?? 30_000);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error('Groq returned empty response');
        return text;
      }

      const errText = await res.text().catch(() => '');
      lastErr = `Groq error ${res.status}: ${errText.slice(0, 200)}`;

      // 429 = rate limit — try next key
      if (res.status === 429) {
        console.warn(`[groq] key ${key.slice(0, 12)}... rate limited — rotating to next key`);
        continue;
      }
      // Other errors — throw immediately
      throw new Error(lastErr);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Groq error') && !e.message.includes('429')) {
        throw e;
      }
      lastErr = e instanceof Error ? e.message : 'Groq network error';
    }
  }
  throw new Error(lastErr || 'Groq rate limit exceeded on all keys');
}

async function groqText(systemPrompt: string, userPrompt: string, options: { json?: boolean } = {}): Promise<string> {
  return callGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { json: options.json });
}

async function groqVision(imageBase64: string, instruction: string): Promise<string> {
  const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : imageBase64;
  return callGroq([
    {
      role: 'user',
      content: [
        { type: 'text', text: instruction },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ]);
}

// ─── Gemini helpers ─────────────────────────────────────────────────────────

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,([\s\S]+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2].replace(/\s/g, '') };
}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

async function callGemini(
  parts: GeminiPart[],
  options: { systemPrompt?: string; json?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  const keys = geminiKeys();
  if (!keys.length) throw new Error('No Gemini key');

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    // Long-form blog JSON needs a high output cap, otherwise the response is
    // truncated mid-JSON and parsing fails
    generationConfig: { maxOutputTokens: 65536 },
  };
  if (options.systemPrompt) {
    body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
  }
  if (options.json) {
    body.generationConfig = { responseMimeType: 'application/json', maxOutputTokens: 65536 };
  }

  // Rotate keys on quota errors (429/403) so multiple free keys pool their limits
  let lastErr = '';
  for (const key of keys) {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      options.timeoutMs ?? 60_000
    );

    if (res.ok) {
      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string }) => p.text ?? '')
        .join('');
      if (!text) throw new Error('Gemini returned empty response');
      return text;
    }

    const errText = await res.text().catch(() => '');
    lastErr = `Gemini error ${res.status}: ${errText.slice(0, 200)}`;
    // 429=quota, 403=banned, 401=invalid key, 503=unavailable — all should try next key
    if (res.status !== 429 && res.status !== 403 && res.status !== 401 && res.status !== 503) throw new Error(lastErr);
    console.warn(`[gemini] key ${key.slice(0, 8)}... status ${res.status} — rotating to next key`);
  }
  throw new Error(lastErr || 'Gemini quota exceeded on all keys');
}

// ─── Cloudflare Workers AI helpers ──────────────────────────────────────────
//
// Free tier: 10,000 neurons/day, no card. Endpoint requires Account ID + API
// token. Text and vision both available. Vision is via LLaVA-1.5 which is
// small but stable. Auth: Authorization: Bearer <API_TOKEN>.

function cloudflareConfigured(): boolean {
  return Boolean(CLOUDFLARE_API_KEY && CLOUDFLARE_ACCOUNT_ID);
}

async function callCloudflare(
  path: string,
  payload: unknown,
  options: { timeoutMs?: number } = {}
): Promise<string> {
  const keys = cloudflareKeys();
  if (!keys.length || !CLOUDFLARE_ACCOUNT_ID) throw new Error('No Cloudflare credentials');

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${path}`;

  // Cloudflare's free tier rarely rate-limits, but rotate if we see 429
  let lastErr = '';
  for (const key of keys) {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    }, options.timeoutMs ?? 30_000);

    if (res.ok) {
      const data = await res.json();
      // Cloudflare returns { result: { response: "..." } } for text and
      // { result: { description: "..." } } for vision/image-to-text.
      const result = data.result;
      if (typeof result === 'string') return result;
      if (result && typeof result === 'object') {
        if (typeof (result as { response?: string }).response === 'string') {
          return (result as { response: string }).response;
        }
        if (typeof (result as { description?: string }).description === 'string') {
          return (result as { description: string }).description;
        }
        if (Array.isArray((result as { data?: unknown[] }).data)) {
          const data = (result as { data: Array<{ text?: string }> }).data;
          const joined = data.map((d) => d.text ?? '').join('');
          if (joined) return joined;
        }
        // Fallback: serialise the result so we never return empty
        return JSON.stringify(result);
      }
      throw new Error('Cloudflare returned empty response');
    }

    const errText = await res.text().catch(() => '');
    lastErr = `Cloudflare error ${res.status}: ${errText.slice(0, 200)}`;
    if (res.status === 429) {
      console.warn(`[cloudflare] rate limited — rotating to next key`);
      continue;
    }
    throw new Error(lastErr);
  }
  throw new Error(lastErr || 'Cloudflare failed on all keys');
}

async function cloudflareText(systemPrompt: string, userPrompt: string, options: { json?: boolean } = {}): Promise<string> {
  // Cloudflare's llama-3.1 chat-style endpoint. JSON is enforced by instructing
  // the model in the system prompt since Cloudflare doesn't expose a JSON mode.
  const sys = options.json
    ? `${systemPrompt}\n\nIMPORTANT: Return ONLY valid JSON. No prose, no markdown.`
    : systemPrompt;
  return callCloudflare(CLOUDFLARE_TEXT_MODEL, {
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userPrompt },
    ],
  });
}

async function cloudflareVision(imageBase64: string, instruction: string): Promise<string> {
  // LLaVA-1.5 uses a single text prompt with the image embedded as a data URI
  return callCloudflare(CLOUDFLARE_VISION_MODEL, {
    image: imageBase64,
    prompt: instruction,
    max_tokens: 512,
  });
}

// ─── HuggingFace Inference API helpers ──────────────────────────────────────
//
// Free tier: ~1,000 requests/day, no card. Auth: Authorization: Bearer
// <HF_TOKEN>. Endpoint accepts raw JSON or base64 image bytes depending on the
// model. We default to small chat + image-to-text models that work reliably
// on the free inference tier.

function huggingfaceConfigured(): boolean {
  return Boolean(HUGGINGFACE_API_KEY);
}

async function callHuggingface(
  model: string,
  payload: unknown,
  options: { timeoutMs?: number; isBinary?: boolean } = {}
): Promise<string> {
  const keys = huggingfaceKeys();
  if (!keys.length) throw new Error('No HuggingFace key');

  const url = `https://router.huggingface.co/v1/chat/completions`;

  let lastErr = '';
  for (const key of keys) {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    }, options.timeoutMs ?? 30_000);

    if (res.ok) {
      const raw = await res.text();
      // The HuggingFace router returns OpenAI-compatible chat-completions
      // shape: { choices: [{ message: { content: "..." } }] }
      try {
        const data = JSON.parse(raw);
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content) return content;
        // Some endpoints (legacy) return array of { generated_text }
        if (Array.isArray(data) && data.length > 0) {
          if (typeof data[0] === 'string') return data.join('\n');
          if (typeof data[0]?.generated_text === 'string') return data[0].generated_text;
        }
        if (data && typeof data === 'object' && typeof (data as { generated_text?: string }).generated_text === 'string') {
          return (data as { generated_text: string }).generated_text;
        }
        // Fallback: return raw if we cannot parse
        return raw;
      } catch {
        // Not JSON — return raw
        return raw;
      }
    }

    const errText = await res.text().catch(() => '');
    lastErr = `HuggingFace error ${res.status}: ${errText.slice(0, 200)}`;
    // 503 = model loading, 429 = rate limit — both should retry/rotate
    if (res.status === 429 || res.status === 503) {
      console.warn(`[huggingface] model ${model} status ${res.status} — rotating`);
      continue;
    }
    throw new Error(lastErr);
  }
  throw new Error(lastErr || 'HuggingFace failed on all keys');
}

async function huggingfaceText(systemPrompt: string, userPrompt: string, options: { json?: boolean } = {}): Promise<string> {
  // The HF router uses the OpenAI-compatible chat-completions shape, so the
  // model name goes in the body. JSON mode is enforced via the system prompt
  // because the router doesn't expose a response_format field for all models.
  const sys = options.json
    ? `${systemPrompt}\n\nIMPORTANT: Return ONLY valid JSON. No prose, no markdown.`
    : systemPrompt;
  return callHuggingface(HUGGINGFACE_TEXT_MODEL, {
    model: HUGGINGFACE_TEXT_MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });
}

async function huggingfaceVision(imageBase64: string, instruction: string): Promise<string> {
  // The HF router accepts OpenAI-style messages with image_url content parts.
  // For vision we use a dedicated vision-capable chat model — Salesforce/blip
  // still works on the legacy endpoint, so fall back to the legacy call for
  // vision only (text is routed through the modern chat-completions endpoint).
  const part = splitDataUrl(imageBase64);
  const b64 = part ? part.data : imageBase64;
  return callHuggingfaceLegacyVision(HUGGINGFACE_VISION_MODEL, b64, instruction);
}

async function callHuggingfaceLegacyVision(
  model: string,
  b64: string,
  instruction: string
): Promise<string> {
  // The legacy vision endpoint at api-inference.huggingface.co/models/<model>
  // accepts raw base64 image bytes in the inputs field. Used only as the
  // HuggingFace vision fallback. If the legacy endpoint is not reachable
  // (e.g. ENOTFOUND on the user's network), we throw so the chain can move
  // on to the next provider.
  const keys = huggingfaceKeys();
  if (!keys.length) throw new Error('No HuggingFace key');
  const url = `https://api-inference.huggingface.co/models/${model}`;
  let lastErr = '';
  for (const key of keys) {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        inputs: b64,
        parameters: { prompt: instruction, max_new_tokens: 200 },
      }),
    }, 30_000);
    if (res.ok) {
      const raw = await res.text();
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && typeof data[0]?.generated_text === 'string') {
          return data[0].generated_text;
        }
        if (data && typeof (data as { generated_text?: string }).generated_text === 'string') {
          return (data as { generated_text: string }).generated_text;
        }
        return raw;
      } catch {
        return raw;
      }
    }
    lastErr = `HF vision error ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`;
    if (res.status === 429 || res.status === 503) continue;
    throw new Error(lastErr);
  }
  throw new Error(lastErr || 'HF vision failed');
}

// ─── Pollinations helpers (last-resort fallback) ────────────────────────────

async function pollinationsText(systemPrompt: string, userPrompt: string): Promise<string> {
  const body = JSON.stringify({
    model: 'openai',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchWithTimeout('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }, 90_000);
      if (res.ok) return await res.text();
    } catch {
      // network error / timeout — retry or fall through
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
  }

  // Last resort: GET endpoint (separate rate-limit bucket)
  const qs = new URLSearchParams({ model: 'openai', system: systemPrompt });
  const res = await fetchWithTimeout(
    `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?${qs.toString()}`,
    { method: 'GET' },
    90_000
  );
  if (!res.ok) throw new Error('AI service is busy right now — please try again in a moment');
  return await res.text();
}

async function pollinationsVision(imageBase64: string, instruction: string): Promise<string> {
  const res = await fetchWithTimeout('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: instruction },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
    }),
  }, 30_000);

  if (!res.ok) throw new Error(`Pollinations vision ${res.status}`);
  const raw = await res.text();
  try {
    const parsed = JSON.parse(raw);
    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content) return content;
  } catch {
    /* raw text reply */
  }
  return raw;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate text (optionally strict JSON).
 *
 * Fallback chain: Groq → Gemini → Cloudflare → HuggingFace → Pollinations.
 * Each step is only attempted if the provider is configured (keys present in
 * .env) — otherwise we skip directly to the next one.
 */
export async function generateAIText(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  // 1️⃣ Groq — fastest, free, but rate-limited
  if (groqKeys().length) {
    try {
      return await groqText(systemPrompt, userPrompt, { json: options.json });
    } catch (e) {
      console.warn('Groq text failed, trying Gemini:', e instanceof Error ? e.message : e);
    }
  }

  // 2️⃣ Gemini — accurate but free tier is gated
  if (geminiKey()) {
    try {
      return await callGemini([{ text: userPrompt }], { systemPrompt, json: options.json, timeoutMs: options.timeoutMs });
    } catch (e) {
      console.warn('Gemini text failed, trying Cloudflare:', e instanceof Error ? e.message : e);
    }
  }

  // 3️⃣ Cloudflare Workers AI — 10K neurons/day, no card, stable
  if (cloudflareConfigured()) {
    try {
      return await cloudflareText(systemPrompt, userPrompt, { json: options.json });
    } catch (e) {
      console.warn('Cloudflare text failed, trying HuggingFace:', e instanceof Error ? e.message : e);
    }
  }

  // 4️⃣ HuggingFace Inference API — 1K req/day, no card
  if (huggingfaceConfigured()) {
    try {
      return await huggingfaceText(systemPrompt, userPrompt, { json: options.json });
    } catch (e) {
      console.warn('HuggingFace text failed, trying Pollinations:', e instanceof Error ? e.message : e);
    }
  }

  // 5️⃣ Pollinations — anonymous, best-effort only
  return pollinationsText(systemPrompt, userPrompt);
}

/**
 * Analyze an image / video frame with AI vision.
 *
 * Fallback chain: Groq → Gemini → Cloudflare → HuggingFace → Pollinations.
 * Returns null when no vision backend is reachable.
 */
export async function analyzeMedia(imageBase64: string, instruction: string): Promise<string | null> {
  // 1️⃣ Groq vision — fast, but the qwen vision model has a per-request
  //    token cap that large phone photos exceed
  if (groqKeys().length) {
    try {
      return await groqVision(imageBase64, instruction);
    } catch (e) {
      console.warn('Groq vision failed, trying Gemini:', e instanceof Error ? e.message : e);
    }
  }

  // 2️⃣ Gemini vision — accurate but free keys have been flaky
  if (geminiKey()) {
    const part = splitDataUrl(imageBase64);
    if (part) {
      try {
        return await callGemini([
          { text: instruction },
          { inline_data: { mime_type: part.mimeType, data: part.data } },
        ]);
      } catch (e) {
        console.warn('Gemini vision failed, trying Cloudflare:', e instanceof Error ? e.message : e);
      }
    }
  }

  // 3️⃣ Cloudflare vision (LLaVA-1.5) — stable, free
  if (cloudflareConfigured()) {
    try {
      return await cloudflareVision(imageBase64, instruction);
    } catch (e) {
      console.warn('Cloudflare vision failed, trying HuggingFace:', e instanceof Error ? e.message : e);
    }
  }

  // 4️⃣ HuggingFace vision (BLIP) — caption-style, free
  if (huggingfaceConfigured()) {
    try {
      return await huggingfaceVision(imageBase64, instruction);
    } catch (e) {
      console.warn('HuggingFace vision failed, trying Pollinations:', e instanceof Error ? e.message : e);
    }
  }

  // 5️⃣ Pollinations vision (best-effort — currently 402-gated)
  try {
    return await pollinationsVision(imageBase64, instruction);
  } catch (e) {
    console.warn('Vision analysis unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}
