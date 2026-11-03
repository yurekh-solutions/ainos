import { analyzeMedia } from '@/lib/ai-provider';
import { chargeToolRun } from '@/lib/tool-charge';
import { registerJobHandler } from '@/lib/job-queue';

/**
 * ASYNC MEDIA SCAN JOB (additive migration of /api/social-caption/analyze).
 *
 * The vision call (Gemini primary, Pollinations fallback) can exceed Render's
 * ~55s gateway ceiling on a slow model or a video-frame analysis, which surfaced
 * as a silent "could not scan" for the creator. The route keeps auth / validation
 * / credit-affordability inline and hands this handler the vision + charge, so the
 * request returns a jobId in <2s and the client polls. Credits are charged only on
 * a successful scan; a no-backend result throws (job → failed) so the user is
 * never charged for a scan that produced nothing.
 */

export interface SocialCaptionAnalyzePayload {
  companyId: string | null;
  imageBase64: string;
  mediaType?: string;
}

export interface SocialCaptionAnalyzeResult {
  topic: string;
  description: string;
  niche: string;
  mood: string;
  detectedObjects: unknown[];
  creditsUsed: number;
  creditsBalance: number | null;
}

registerJobHandler<SocialCaptionAnalyzeResult, SocialCaptionAnalyzePayload>('social_caption_analyze', async (payload) => {
  const { companyId, imageBase64, mediaType } = payload;
  const isVideo = mediaType === 'video';
  const label = isVideo ? 'video reel frame' : 'image';

  const instruction = `You are analyzing a ${label} that a creator wants to post on social media.

Look at it carefully and return ONLY this JSON (no markdown, no extra text):
{
  "topic": "A short 4-8 word content topic/title describing what this post is about",
  "description": "2-3 sentences describing exactly what is visible: subjects, actions, setting, mood, colors, style${isVideo ? ', and what likely happens in the reel' : ''}",
  "niche": "The industry/niche this belongs to (e.g. Fitness, Food, Fashion, Tech, Travel, Real Estate)",
  "detectedObjects": ["object1", "object2", "object3"],
  "mood": "The overall mood/emotion in one or two words"
}

Rules:
- topic must read like a real content title a creator would type, not a description
- be specific about what you actually see, never generic
- if text is visible in the media, factor it into the topic`;

  const analysis = await analyzeMedia(imageBase64, instruction);
  if (!analysis) {
    // No vision backend reachable (Pollinations anonymous vision is gated with 402).
    throw new Error('AI scan is unavailable right now — please fill the topic and description manually');
  }

  let result: Record<string, unknown>;
  try {
    result = JSON.parse(analysis);
  } catch {
    const stripped = analysis.replace(/```(?:json)?/gi, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch {
        result = { topic: '', description: stripped.slice(0, 500) };
      }
    } else {
      result = { topic: '', description: stripped.slice(0, 500) };
    }
  }

  const charge = await chargeToolRun(companyId, 'social-caption-analyze', 'AI media scan');
  return {
    topic: typeof result.topic === 'string' ? result.topic : '',
    description: typeof result.description === 'string' ? result.description : '',
    niche: typeof result.niche === 'string' ? result.niche : '',
    mood: typeof result.mood === 'string' ? result.mood : '',
    detectedObjects: Array.isArray(result.detectedObjects) ? result.detectedObjects : [],
    creditsUsed: charge.cost,
    creditsBalance: charge.balance,
  };
});
