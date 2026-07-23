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

// Try Instagram's mobile/web API endpoints
async function fetchInstagramData(username: string): Promise<InstagramFeedResponse | null> {
  const endpoints = [
    // Method 1: Instagram's public JSON endpoint
    {
      url: `https://www.instagram.com/${username}/?__a=1&__d=dis`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '198387',
        'X-IG-WWW-Claim': '0',
      },
    },
    // Method 2: Instagram's web API
    {
      url: `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'X-IG-App-ID': '936619743392459',
      },
    },
    // Method 3: Instagram's graphql endpoint
    {
      url: `https://www.instagram.com/graphql/query/`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': '936619743392459',
      },
      body: `variables={"id":"${username}","after":null,"first":12}`,
    },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying Instagram endpoint: ${endpoint.url}`);
      
      const res = await fetch(endpoint.url, {
        method: endpoint.body ? 'POST' : 'GET',
        headers: endpoint.headers as unknown as Record<string, string>,
        body: endpoint.body,
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        console.log(`Endpoint failed with status: ${res.status}`);
        continue;
      }

      const data = await res.json();
      
      // Try to extract data from different response formats
      let profilePic = '';
      let bio = '';
      const posts: InstagramPost[] = [];

      // Format 1: GraphQL user data
      const user = data?.graphql?.user || data?.data?.user || data?.data?.user?.edge_owner_to_timeline_media;
      if (user) {
        profilePic = user.profile_pic_url_hd || user.profile_pic_url || '';
        bio = user.biography || '';
        
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
      }

      // Format 2: Direct user data
      if (!posts.length && data?.data?.user) {
        const userData = data.data.user;
        profilePic = userData.profile_pic_url || '';
        bio = userData.biography || '';
        
        const mediaEdges = userData.edge_owner_to_timeline_media?.edges || [];
        mediaEdges.forEach((edge: { node: { id: string; display_url: string; shortcode: string; is_video: boolean } }, idx: number) => {
          posts.push({
            id: edge.node.id || `post-${idx}`,
            media_url: edge.node.display_url || '',
            permalink: `https://www.instagram.com/p/${edge.node.shortcode}/`,
            is_video: edge.node.is_video || false,
            caption: '',
          });
        });
      }

      if (posts.length > 0) {
        console.log(`Successfully fetched ${posts.length} posts from Instagram`);
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
      console.log(`Endpoint error:`, error);
      continue;
    }
  }

  console.error('All Instagram endpoints failed');
  return null;
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

  // Try multiple Instagram endpoints
  const data = await fetchInstagramData(INSTAGRAM_USERNAME);

  if (!data || data.posts.length === 0) {
    return NextResponse.json(
      {
        username: INSTAGRAM_USERNAME,
        profile_picture_url: '',
        bio: '',
        posts: [],
        cached: false,
        lastUpdated: new Date().toISOString(),
        error: 'Could not fetch Instagram data. Instagram blocks automated access without API authentication.',
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
