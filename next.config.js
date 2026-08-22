/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/ainos',
  // trailingSlash removed — it caused 308 redirects on /api/auth/* routes
  // that Chrome cached aggressively (disk cache), breaking session fetches.
  // Rewrites removed — the '/api/*' rewrite with absolute URL destination caused
  // the server to fetch itself in a loop (ERR_TOO_MANY_REDIRECTS on session endpoint).
  // basePath: '/ainos' already routes all /ainos/api/* requests correctly.
  async headers() {
    return [
      {
        // Prevent any caching on auth endpoints.
        source: '/api/auth/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  serverExternalPackages: ['mongoose'],
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  // Disable Turbopack for production builds to avoid memory issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('mongoose');
    }
    return config;
  },
};

module.exports = nextConfig;
