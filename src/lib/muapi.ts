// MuAPI.ai + Pollinations.ai Client
// Full generative AI API: image, video, lip sync, image-to-image, cinema
// Docs: https://muapi.ai | https://pollinations.ai

const MUAPI_BASE = 'https://api.muapi.ai/api/v1';
const POLLINATIONS_IMAGE_URL = 'https://image.pollinations.ai/prompt';
const POLLINATIONS_VIDEO_URL = 'https://video.pollinations.ai/prompt';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PollinationsParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
  nologo?: boolean;
  enhance?: boolean;
  negative?: string;
}

export interface PollinationsResponse {
  url: string;
  prompt: string;
  model: string;
  status: 'complete' | 'error';
  error?: string;
}

export interface MuAPIJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output_url?: string;
  error?: string;
}

export interface MuAPIModel {
  id: string;
  name: string;
  type: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video' | 'lip-sync';
  description?: string;
  maxImages?: number;
  resolutions?: string[];
  durations?: string[];
  aspectRatios?: string[];
}

// ─── Pollinations Models (FREE, no API key) ─────────────────────────────────

export const POLLINATIONS_MODELS = {
  'flux': 'flux',
  'flux-realism': 'flux-realism',
  'flux-anime': 'flux-anime',
  'flux-3d': 'flux-3d',
  'turbo': 'turbo',
  'any-dark': 'any-dark',
  'flux-pro': 'flux-pro',
  'midjourney': 'midjourney',
  'dall-e-3': 'dall-e-3',
} as const;

export type PollinationsModel = keyof typeof POLLINATIONS_MODELS;

export const STYLE_MODEL_MAP: Record<string, PollinationsModel> = {
  'photorealistic': 'flux-realism',
  'illustration': 'flux',
  '3d-render': 'flux-3d',
  'anime': 'flux-anime',
  'oil-painting': 'flux',
  'watercolor': 'flux',
  'cinematic': 'flux-pro',
  'minimal': 'turbo',
};

// ─── MuAPI Model Catalog ────────────────────────────────────────────────────

export const MUAPI_MODELS: MuAPIModel[] = [
  // Text-to-Image
  { id: 'nano-banana-2', name: 'Nano Banana 2', type: 'text-to-image', description: 'Google Gemini 3.1 Flash · 1K/2K/4K', resolutions: ['1K', '2K', '4K'], aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'] },
  { id: 'seedream-5', name: 'Seedream 5.0', type: 'text-to-image', description: 'ByteDance · Up to 4K', resolutions: ['1K', '2K', '4K'], aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'] },
  { id: 'flux-dev', name: 'Flux Dev', type: 'text-to-image', description: 'High quality text-to-image' },
  { id: 'flux-pro', name: 'Flux Pro', type: 'text-to-image', description: 'Professional grade' },
  { id: 'ideogram-v3', name: 'Ideogram v3', type: 'text-to-image', description: 'Best text rendering' },
  { id: 'midjourney-v7', name: 'Midjourney v7', type: 'text-to-image', description: 'Artistic excellence' },
  { id: 'gpt-4o-image', name: 'GPT-4o Image', type: 'text-to-image', description: 'OpenAI image generation' },
  { id: 'sdxl', name: 'SDXL', type: 'text-to-image', description: 'Stable Diffusion XL' },
  { id: 'minimax-image-01', name: 'MiniMax Image 01', type: 'text-to-image', description: 'MiniMax · Up to 4K', aspectRatios: ['1:1', '16:9', '9:16', '4:3'] },

  // Image-to-Image
  { id: 'nano-banana-2-edit', name: 'Nano Banana 2 Edit', type: 'image-to-image', description: 'Up to 14 reference images', maxImages: 14, resolutions: ['1K', '2K', '4K'] },
  { id: 'seedream-5-edit', name: 'Seedream 5.0 Edit', type: 'image-to-image', description: 'Natural language style transfer' },
  { id: 'flux-kontext-dev', name: 'Flux Kontext Dev', type: 'image-to-image', description: 'Context-aware editing', maxImages: 10 },
  { id: 'flux-kontext-pro', name: 'Flux Kontext Pro', type: 'image-to-image', description: 'Pro editing', maxImages: 2 },
  { id: 'gpt-4o-edit', name: 'GPT-4o Edit', type: 'image-to-image', description: 'OpenAI image editing', maxImages: 10 },
  { id: 'seededit-v3', name: 'Seededit v3', type: 'image-to-image', description: 'ByteDance image editing' },
  { id: 'upscaler', name: 'Upscaler', type: 'image-to-image', description: 'Enhance & upscale images' },
  { id: 'bg-remover', name: 'Background Remover', type: 'image-to-image', description: 'Remove backgrounds' },

  // Text-to-Video
  { id: 'kling-v3', name: 'Kling v3', type: 'text-to-video', description: 'High quality video', durations: ['5s', '10s', '15s'], aspectRatios: ['16:9', '9:16', '1:1'] },
  { id: 'sora-2', name: 'Sora 2', type: 'text-to-video', description: 'OpenAI video generation', durations: ['5s', '10s', '20s'] },
  { id: 'veo-3', name: 'Veo 3', type: 'text-to-video', description: 'Google video generation', durations: ['5s', '8s'] },
  { id: 'wan-2.6', name: 'Wan 2.6', type: 'text-to-video', description: 'Alibaba video generation', durations: ['5s', '10s'] },
  { id: 'seedance-2', name: 'Seedance 2.0', type: 'text-to-video', description: 'ByteDance · High quality', durations: ['5s', '10s', '15s'], aspectRatios: ['16:9', '9:16', '4:3', '3:4'] },
  { id: 'hailuo-2.3', name: 'Hailuo 2.3', type: 'text-to-video', description: 'MiniMax video', durations: ['6s', '10s'] },
  { id: 'runway-gen3', name: 'Runway Gen-3', type: 'text-to-video', description: 'Runway video generation', durations: ['5s', '10s'] },
  { id: 'grok-imagine-t2v', name: 'Grok Imagine T2V', type: 'text-to-video', description: 'xAI video · 6/10/15s', durations: ['6s', '10s', '15s'], aspectRatios: ['9:16', '16:9', '2:3', '3:2', '1:1'] },

  // Image-to-Video
  { id: 'kling-v2.1-i2v', name: 'Kling v2.1 I2V', type: 'image-to-video', description: 'Animate images to video', durations: ['5s', '10s'] },
  { id: 'veo3-i2v', name: 'Veo3 I2V', type: 'image-to-video', description: 'Google image-to-video' },
  { id: 'runway-i2v', name: 'Runway I2V', type: 'image-to-video', description: 'Runway image animation' },
  { id: 'seedance-2-i2v', name: 'Seedance 2.0 I2V', type: 'image-to-video', description: 'ByteDance · Up to 9 refs', durations: ['5s', '10s', '15s'], aspectRatios: ['16:9', '9:16', '4:3', '3:4'] },
  { id: 'midjourney-v7-i2v', name: 'Midjourney v7 I2V', type: 'image-to-video', description: 'Midjourney video from images' },
  { id: 'grok-imagine-i2v', name: 'Grok Imagine I2V', type: 'image-to-video', description: 'xAI cinematic from images', durations: ['6s', '10s', '15s'] },

  // Lip Sync
  { id: 'infinite-talk', name: 'Infinite Talk', type: 'lip-sync', description: 'Portrait + audio → talking video', resolutions: ['480p', '720p'] },
  { id: 'wan2.2-speech', name: 'Wan 2.2 Speech', type: 'lip-sync', description: 'Speech to video', resolutions: ['480p', '720p'] },
  { id: 'ltx-2.3-lipsync', name: 'LTX 2.3 Lipsync', type: 'lip-sync', description: 'High quality lip sync', resolutions: ['480p', '720p', '1080p'] },
  { id: 'ltx-2-19b-lipsync', name: 'LTX 2 19B Lipsync', type: 'lip-sync', description: '19B parameter lip sync', resolutions: ['480p', '720p', '1080p'] },
  { id: 'sync-lipsync', name: 'Sync Lipsync', type: 'lip-sync', description: 'Video + audio → lipsync' },
  { id: 'latentsync', name: 'LatentSync', type: 'lip-sync', description: 'Latent space lip sync' },
  { id: 'creatify-lipsync', name: 'Creatify Lipsync', type: 'lip-sync', description: 'Creatify lip sync' },
  { id: 'veed-lipsync', name: 'Veed Lipsync', type: 'lip-sync', description: 'Veed lip sync' },
  { id: 'infinite-talk-v2v', name: 'Infinite Talk V2V', type: 'lip-sync', description: 'Video-to-video lip sync', resolutions: ['480p', '720p'] },
];

// ─── Cinema Controls ────────────────────────────────────────────────────────

export const CINEMA_CONTROLS = {
  cameras: [
    { id: 'modular-8k', name: 'Modular 8K Digital', desc: 'Ultra high resolution' },
    { id: 'full-frame-cine', name: 'Full-Frame Cine Digital', desc: 'Cinema standard' },
    { id: '70mm-film', name: 'Grand Format 70mm Film', desc: 'Epic film look' },
    { id: 'studio-s35', name: 'Studio Digital S35', desc: 'Classic cinema sensor' },
    { id: '16mm-film', name: 'Classic 16mm Film', desc: 'Vintage film grain' },
    { id: 'large-format', name: 'Premium Large Format Digital', desc: 'Modern large sensor' },
  ],
  lenses: [
    { id: 'creative-tilt', name: 'Creative Tilt', desc: 'Tilt-shift effect' },
    { id: 'compact-anamorphic', name: 'Compact Anamorphic', desc: 'Widescreen oval bokeh' },
    { id: 'extreme-macro', name: 'Extreme Macro', desc: 'Close-up detail' },
    { id: '70s-cinema', name: "70s Cinema Prime", desc: 'Vintage warm tones' },
    { id: 'classic-anamorphic', name: 'Classic Anamorphic', desc: 'Traditional anamorphic' },
    { id: 'modern-prime', name: 'Premium Modern Prime', desc: 'Sharp modern look' },
    { id: 'warm-cinema', name: 'Warm Cinema Prime', desc: 'Warm cinematic tones' },
    { id: 'swirl-bokeh', name: 'Swirl Bokeh Portrait', desc: 'Artistic bokeh' },
    { id: 'vintage-prime', name: 'Vintage Prime', desc: 'Soft vintage character' },
    { id: 'halation', name: 'Halation Diffusion', desc: 'Dreamy glow' },
    { id: 'clinical-sharp', name: 'Clinical Sharp Prime', desc: 'Maximum sharpness' },
  ],
  focalLengths: [
    { id: '8mm', name: '8mm Ultra-Wide', modifier: 'ultra-wide angle, 8mm focal length' },
    { id: '14mm', name: '14mm Wide', modifier: 'wide angle, 14mm focal length' },
    { id: '24mm', name: '24mm', modifier: '24mm focal length, natural perspective' },
    { id: '35mm', name: '35mm Human Eye', modifier: '35mm focal length, human eye perspective' },
    { id: '50mm', name: '50mm Portrait', modifier: '50mm portrait lens, natural compression' },
    { id: '85mm', name: '85mm Tight Portrait', modifier: '85mm telephoto, tight portrait compression' },
  ],
  apertures: [
    { id: 'f1.4', name: 'f/1.4 Shallow', modifier: 'f/1.4 aperture, extremely shallow depth of field, creamy bokeh' },
    { id: 'f4', name: 'f/4 Balanced', modifier: 'f/4 aperture, balanced depth of field' },
    { id: 'f11', name: 'f/11 Deep Focus', modifier: 'f/11 aperture, deep focus, everything sharp' },
  ],
};

// ─── Pollinations (FREE, no API key) ────────────────────────────────────────

export function getImageUrl(params: PollinationsParams): string {
  const encodedPrompt = encodeURIComponent(params.prompt);
  const searchParams = new URLSearchParams();

  if (params.model) searchParams.set('model', params.model);
  if (params.width) searchParams.set('width', String(params.width));
  if (params.height) searchParams.set('height', String(params.height));
  if (params.seed !== undefined) searchParams.set('seed', String(params.seed));
  if (params.nologo) searchParams.set('nologo', 'true');
  if (params.enhance) searchParams.set('enhance', 'true');
  if (params.negative) searchParams.set('negative', params.negative);

  const qs = searchParams.toString();
  return `${POLLINATIONS_IMAGE_URL}/${encodedPrompt}${qs ? `?${qs}` : ''}`;
}

export async function generateImage(params: PollinationsParams): Promise<PollinationsResponse> {
  const model = params.model || 'flux';
  const url = getImageUrl({ ...params, model });

  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) {
      return { url, prompt: params.prompt, model, status: 'complete' };
    }
  } catch {
    // If HEAD fails, still return the URL
  }

  return { url, prompt: params.prompt, model, status: 'complete' };
}

export async function generateVideo(prompt: string): Promise<PollinationsResponse> {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `${POLLINATIONS_VIDEO_URL}/${encodedPrompt}`;
  return { url, prompt, model: 'pollinations-video', status: 'complete' };
}

export async function getAvailableModels(): Promise<string[]> {
  try {
    const res = await fetch('https://image.pollinations.ai/models');
    if (res.ok) {
      const models = await res.json();
      return Array.isArray(models) ? models : Object.keys(POLLINATIONS_MODELS);
    }
  } catch {
    // Fallback
  }
  return Object.keys(POLLINATIONS_MODELS);
}

export async function generateMedia(
  prompt: string,
  mediaType: 'image' | 'video',
  style: string
): Promise<PollinationsResponse> {
  const model = STYLE_MODEL_MAP[style] || 'flux';

  if (mediaType === 'video') {
    return generateVideo(prompt);
  }

  return generateImage({
    prompt,
    model,
    width: 1024,
    height: 1024,
    nologo: true,
    enhance: true,
  });
}

// ─── MuAPI Client (requires API key) ────────────────────────────────────────

export function getMuAPIKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('muapi_api_key');
  }
  return process.env.MUAPI_API_KEY || null;
}

export function setMuAPIKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('muapi_api_key', key);
  }
}

async function muapiRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>,
  apiKey?: string
): Promise<Record<string, unknown>> {
  const key = apiKey || getMuAPIKey();
  if (!key) throw new Error('MuAPI key required. Add your key in Settings.');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': key,
  };

  const res = await fetch(`${MUAPI_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MuAPI error: ${res.status} - ${err}`);
  }

  return res.json();
}

// Submit a generation job
export async function submitJob(
  modelId: string,
  params: Record<string, unknown>,
  apiKey?: string
): Promise<string> {
  const data = await muapiRequest(`/${modelId}`, 'POST', params, apiKey);
  return data.request_id as string || data.id as string;
}

// Poll for job result
export async function pollJob(requestId: string, apiKey?: string): Promise<MuAPIJob> {
  const data = await muapiRequest(`/predictions/${requestId}/result`, 'GET', undefined, apiKey);
  return {
    id: requestId,
    status: (data.status as MuAPIJob['status']) || 'pending',
    output_url: data.output as string || data.url as string,
    error: data.error as string,
  };
}

// Poll until complete (with timeout)
export async function waitForJob(
  requestId: string,
  apiKey?: string,
  timeoutMs = 120000,
  intervalMs = 3000
): Promise<MuAPIJob> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const job = await pollJob(requestId, apiKey);

    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Generation timed out. Please try again.');
}

// Upload a file for image-to-image or lip sync
export async function uploadFile(file: File, apiKey?: string): Promise<string> {
  const key = apiKey || getMuAPIKey();
  if (!key) throw new Error('MuAPI key required');

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${MUAPI_BASE}/upload_file`, {
    method: 'POST',
    headers: { 'x-api-key': key },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  const data = await res.json();
  return data.url as string;
}

// ─── High-level generation helpers ──────────────────────────────────────────

export async function generateMuImage(
  modelId: string,
  prompt: string,
  options: {
    imageUrl?: string;
    imagesList?: string[];
    aspectRatio?: string;
    resolution?: string;
    quality?: string;
    negativePrompt?: string;
  } = {},
  apiKey?: string
): Promise<string> {
  const params: Record<string, unknown> = { prompt };

  if (options.imageUrl) params.image_url = options.imageUrl;
  if (options.imagesList?.length) params.images_list = options.imagesList;
  if (options.aspectRatio) params.aspect_ratio = options.aspectRatio;
  if (options.resolution) params.resolution = options.resolution;
  if (options.quality) params.quality = options.quality;
  if (options.negativePrompt) params.negative_prompt = options.negativePrompt;

  const requestId = await submitJob(modelId, params, apiKey);
  const job = await waitForJob(requestId, apiKey);

  if (job.status === 'failed') throw new Error(job.error || 'Generation failed');
  return job.output_url!;
}

export async function generateMuVideo(
  modelId: string,
  prompt: string,
  options: {
    imageUrl?: string;
    duration?: string;
    aspectRatio?: string;
    quality?: string;
  } = {},
  apiKey?: string
): Promise<string> {
  const params: Record<string, unknown> = { prompt };

  if (options.imageUrl) params.image_url = options.imageUrl;
  if (options.duration) params.duration = options.duration;
  if (options.aspectRatio) params.aspect_ratio = options.aspectRatio;
  if (options.quality) params.quality = options.quality;

  const requestId = await submitJob(modelId, params, apiKey);
  const job = await waitForJob(requestId, apiKey, 300000); // 5 min for video

  if (job.status === 'failed') throw new Error(job.error || 'Video generation failed');
  return job.output_url!;
}

export async function generateLipSync(
  modelId: string,
  options: {
    imageUrl?: string;
    videoUrl?: string;
    audioUrl: string;
    prompt?: string;
    resolution?: string;
  },
  apiKey?: string
): Promise<string> {
  const params: Record<string, unknown> = { audio_url: options.audioUrl };

  if (options.imageUrl) params.image_url = options.imageUrl;
  if (options.videoUrl) params.video_url = options.videoUrl;
  if (options.prompt) params.prompt = options.prompt;
  if (options.resolution) params.resolution = options.resolution;

  const requestId = await submitJob(modelId, params, apiKey);
  const job = await waitForJob(requestId, apiKey, 300000);

  if (job.status === 'failed') throw new Error(job.error || 'Lip sync failed');
  return job.output_url!;
}

// Build cinema prompt with camera controls
export function buildCinemaPrompt(
  basePrompt: string,
  controls: {
    camera?: string;
    lens?: string;
    focalLength?: string;
    aperture?: string;
  }
): string {
  const parts = [basePrompt];

  if (controls.camera) {
    const cam = CINEMA_CONTROLS.cameras.find(c => c.id === controls.camera);
    if (cam) parts.push(`shot on ${cam.name}`);
  }

  if (controls.lens) {
    const lens = CINEMA_CONTROLS.lenses.find(l => l.id === controls.lens);
    if (lens) parts.push(`${lens.name} lens`);
  }

  if (controls.focalLength) {
    const fl = CINEMA_CONTROLS.focalLengths.find(f => f.id === controls.focalLength);
    if (fl) parts.push(fl.modifier);
  }

  if (controls.aperture) {
    const ap = CINEMA_CONTROLS.apertures.find(a => a.id === controls.aperture);
    if (ap) parts.push(ap.modifier);
  }

  parts.push('cinematic lighting, professional cinematography, film grain');

  return parts.join(', ');
}
