// Unified AI provider layer for AINOS tools.
// Primary: Groq (free, fast, no billing) — text + vision.
// Secondary: Google Gemini (when GEMINI_API_KEY is set) — text + vision.
// Fallback: Pollinations.ai anonymous tier (text works intermittently; vision is
// currently gated with HTTP 402, so it is best-effort only).

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL || 'openai/gpt-oss-20b';
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview';

// Supports multiple keys so rate limits rotate: GROQ_API_KEYS="key1,key2" and/or GROQ_API_KEY
function groqKeys(): string[] {
  const list = (process.env.GROQ_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  const single = (process.env.GROQ_API_KEY || '').trim();
  if (single && !list.includes(single)) list.push(single);
  return list;
}

let groqKeyIndex = 0;
function nextGroqKey(): string | undefined {
  const keys = groqKeys();
  if (!keys.length) return undefined;
  const key = keys[groqKeyIndex % keys.length];
  groqKeyIndex++;
  return key;
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

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
    max_tokens: 16384,
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

// ─── Pollinations helpers (fallback) ────────────────────────────────────────

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

/** Generate text (optionally strict JSON). Groq → Gemini → Pollinations. */
export async function generateAIText(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  // Try Groq first (free, fast, no billing)
  if (groqKeys().length) {
    try {
      return await groqText(systemPrompt, userPrompt, { json: options.json });
    } catch (e) {
      console.warn('Groq text generation failed, trying Gemini:', e instanceof Error ? e.message : e);
    }
  }

  // Try Gemini second
  if (geminiKey()) {
    try {
      return await callGemini([{ text: userPrompt }], { systemPrompt, json: options.json, timeoutMs: options.timeoutMs });
    } catch (e) {
      console.warn('Gemini text generation failed, falling back to Pollinations:', e instanceof Error ? e.message : e);
    }
  }

  // Last resort: Pollinations
  return pollinationsText(systemPrompt, userPrompt);
}

/**
 * Analyze an image / video frame with AI vision.
 * Groq → Gemini → Pollinations. Returns null when no vision backend is reachable.
 */
export async function analyzeMedia(imageBase64: string, instruction: string): Promise<string | null> {
  // Try Groq vision first (free, fast)
  if (groqKeys().length) {
    try {
      return await groqVision(imageBase64, instruction);
    } catch (e) {
      console.warn('Groq vision failed, trying Gemini:', e instanceof Error ? e.message : e);
    }
  }

  // Try Gemini vision second
  if (geminiKey()) {
    const part = splitDataUrl(imageBase64);
    if (part) {
      try {
        return await callGemini([
          { text: instruction },
          { inline_data: { mime_type: part.mimeType, data: part.data } },
        ]);
      } catch (e) {
        console.warn('Gemini vision failed, trying Pollinations:', e instanceof Error ? e.message : e);
      }
    }
  }

  // Last resort: Pollinations vision (currently gated with 402)
  try {
    return await pollinationsVision(imageBase64, instruction);
  } catch (e) {
    console.warn('Vision analysis unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}
