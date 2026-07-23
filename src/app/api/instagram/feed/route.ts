import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

const CACHE_KEY = 'instagram:feed:live';
const CACHE_TTL = 1800; // 30 min cache
const INSTAGRAM_USERNAME = 'yurekhsolutions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface InstagramPost {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  caption: string;
  permalink: string;
  is_video: boolean;
}

interface InstagramFeedResponse {
  username: string;
  profile_picture_url: string;
  bio: string;
  posts: InstagramPost[];
  cached: boolean;
  lastUpdated: string;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Try Instagram's public JSON endpoint (no auth required)
async function fetchInstagramJSON(username: string): Promise<InstagramFeedResponse | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-IG-App-ID': '936619743392459',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error('Instagram JSON endpoint failed:', res.status);
      return null;
    }

    const data = await res.json();
    const user = data?.graphql?.user;
    
    if (!user) {
      console.error('No user data in Instagram response');
      return null;
    }

    const edges = user?.edge_owner_to_timeline_media?.edges || [];
    const posts: InstagramPost[] = edges.map((edge: { node: { id: string; display_url: string; thumbnail_src?: string; edge_media_to_caption?: { edges: { node: { text: string } }[] }; shortcode: string; is_video: boolean; video_url?: string } }, idx: number) => ({
      id: edge.node.id || `post-${idx}`,
      media_url: edge.node.display_url || edge.node.thumbnail_src || '',
      thumbnail_url: edge.node.thumbnail_src,
      caption: edge.node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
      permalink: `https://www.instagram.com/p/${edge.node.shortcode}/`,
      is_video: edge.node.is_video || false,
    }));

    return {
      username: INSTAGRAM_USERNAME,
      profile_picture_url: user.profile_pic_url_hd || user.profile_pic_url || '',
      bio: user.biography || '',
      posts,
      cached: false,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Instagram JSON fetch error:', error);
    return null;
  }
}

// Fallback: Scrape Instagram's HTML page
async function scrapeInstagram(username: string): Promise<InstagramFeedResponse | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error('Instagram scrape failed:', res.status);
      return null;
    }

    const html = await res.text();
    let profilePic = '';
    let bio = '';
    const posts: InstagramPost[] = [];

    // Extract from meta tags
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (ogImageMatch) profilePic = ogImageMatch[1];

    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (descMatch) bio = descMatch[1];

    // Extract display_url patterns
    const displaySrcMatch = html.match(/"display_url"\s*:\s*"(https:\/\/[^"]+)"/g);
    if (displaySrcMatch && displaySrcMatch.length > 0) {
      displaySrcMatch.slice(0, 12).forEach((match: string, index: number) => {
        const urlMatch = match.match(/"display_url"\s*:\s*"(https:\/\/[^"]+)"/);
        if (urlMatch) {
          posts.push({
            id: `post-${index + 1}`,
            media_url: urlMatch[1].replace(/\\u0026/g, '&'),
            caption: '',
            permalink: `https://www.instagram.com/${username}/`,
            is_video: false,
          });
        }
      });
    }

    if (posts.length > 0 || profilePic) {
      return {
        username: INSTAGRAM_USERNAME,
        profile_picture_url: profilePic,
        bio: bio,
        posts,
        cached: false,
        lastUpdated: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error('Instagram scrape error:', error);
    return null;
  }
}

export async function GET() {
  // Try Redis cache first
  try {
    const redis = getRedis();
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached as string) as InstagramFeedResponse;
        return NextResponse.json({ ...parsed, cached: true }, { headers: CORS_HEADERS });
      }
    }
  } catch (err) {
    console.error('Redis cache read error:', err);
  }

  // Try JSON endpoint first, then fallback to scraping
  let data = await fetchInstagramJSON(INSTAGRAM_USERNAME);
  
  if (!data || data.posts.length === 0) {
    console.log('JSON endpoint failed, trying HTML scrape...');
    data = await scrapeInstagram(INSTAGRAM_USERNAME);
  }

  if (!data || data.posts.length === 0) {
    return NextResponse.json(
      {
        username: INSTAGRAM_USERNAME,
        profile_picture_url: '',
        bio: '',
        posts: [],
        cached: false,
        lastUpdated: new Date().toISOString(),
        error: 'Could not fetch Instagram data. Instagram may be rate-limiting or blocking requests.',
      },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  // Cache in Redis
  try {
    const redis = getRedis();
    if (redis) {
      await redis.set(CACHE_KEY, JSON.stringify(data), 'EX', CACHE_TTL);
    }
  } catch (err) {
    console.error('Redis cache write error:', err);
  }

  return NextResponse.json(data, { headers: CORS_HEADERS });
}
