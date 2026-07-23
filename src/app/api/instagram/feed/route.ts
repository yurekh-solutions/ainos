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

// Try using CORS proxies to fetch Instagram data
async function fetchWithProxy(username: string): Promise<InstagramFeedResponse | null> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.instagram.com/${username}/?__a=1&__d=dis`)}`,
    `https://corsproxy.io/?${encodeURIComponent(`https://www.instagram.com/${username}/?__a=1&__d=dis`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.instagram.com/${username}/?__a=1&__d=dis`)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      console.log(`Trying proxy: ${proxyUrl.substring(0, 50)}...`);
      
      const res = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.log(`Proxy failed with status: ${res.status}`);
        continue;
      }

      const text = await res.text();
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log('Response is not valid JSON');
        continue;
      }

      // Extract data from response
      const user = data?.graphql?.user || data?.data?.user;
      if (!user) {
        console.log('No user data in response');
        continue;
      }

      const profilePic = user.profile_pic_url_hd || user.profile_pic_url || '';
      const bio = user.biography || '';
      const posts: InstagramPost[] = [];

      const edges = user.edge_owner_to_timeline_media?.edges || [];
      edges.forEach((edge: { node: { id: string; display_url: string; thumbnail_src?: string; edge_media_to_caption?: { edges: { node: { text: string } }[] }; shortcode: string; is_video: boolean } }, idx: number) => {
        posts.push({
          id: edge.node.id || `post-${idx}`,
          media_url: edge.node.display_url || edge.node.thumbnail_src || '',
          thumbnail_url: edge.node.thumbnail_src,
          caption: edge.node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
          permalink: `https://www.instagram.com/p/${edge.node.shortcode}/`,
          is_video: edge.node.is_video || false,
        });
      });

      if (posts.length > 0) {
        console.log(`Successfully fetched ${posts.length} posts via proxy`);
        return {
          username: INSTAGRAM_USERNAME,
          profile_picture_url: profilePic,
          bio: bio,
          posts,
          cached: false,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.log(`Proxy error:`, error);
      continue;
    }
  }

  console.error('All proxies failed');
  return null;
}

// Direct Instagram fetch (usually blocked)
async function fetchDirect(username: string): Promise<InstagramFeedResponse | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-IG-App-ID': '936619743392459',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const user = data?.graphql?.user;
    if (!user) return null;

    const posts: InstagramPost[] = [];
    const edges = user.edge_owner_to_timeline_media?.edges || [];
    
    edges.forEach((edge: { node: { id: string; display_url: string; shortcode: string; is_video: boolean } }, idx: number) => {
      posts.push({
        id: edge.node.id || `post-${idx}`,
        media_url: edge.node.display_url || '',
        permalink: `https://www.instagram.com/p/${edge.node.shortcode}/`,
        is_video: edge.node.is_video || false,
        caption: '',
      });
    });

    return {
      username: INSTAGRAM_USERNAME,
      profile_picture_url: user.profile_pic_url_hd || user.profile_pic_url || '',
      bio: user.biography || '',
      posts,
      cached: false,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
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

  // Try direct first, then proxies
  let data = await fetchDirect(INSTAGRAM_USERNAME);
  
  if (!data || data.posts.length === 0) {
    console.log('Direct fetch failed, trying proxies...');
    data = await fetchWithProxy(INSTAGRAM_USERNAME);
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
        error: 'Could not fetch Instagram data through any method.',
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
