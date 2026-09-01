// Unified AI provider layer for AINOS tools.
// Primary: Google Gemini (when GEMINI_API_KEY is set) — reliable text + vision.
// Fallback: Pollinations.ai anonymous tier (text works intermittently; vision is
// currently gated with HTTP 402, so it is best-effort only).

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || undefined;
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
  const key = geminiKey();
  if (!key) throw new Error('No Gemini key');

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

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    options.timeoutMs ?? 60_000
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? '')
    .join('');
  if (!text) throw new Error('Gemini returned empty response');
  return text;
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

/** Generate text (optionally strict JSON). Gemini first, Pollinations fallback. */
export async function generateAIText(
  systemPrompt: string,
  userPrompt: string,
  options: { json?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  if (geminiKey()) {
    try {
      return await callGemini([{ text: userPrompt }], { systemPrompt, json: options.json, timeoutMs: options.timeoutMs });
    } catch (e) {
      console.warn('Gemini text generation failed, falling back to Pollinations:', e instanceof Error ? e.message : e);
    }
  }
  return pollinationsText(systemPrompt, userPrompt);
}

/**
 * Analyze an image / video frame with AI vision.
 * Returns the AI description text, or null when no vision backend is reachable
 * (Pollinations anonymous vision is currently gated with HTTP 402).
 */
export async function analyzeMedia(imageBase64: string, instruction: string): Promise<string | null> {
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
  try {
    return await pollinationsVision(imageBase64, instruction);
  } catch (e) {
    console.warn('Vision analysis unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}
