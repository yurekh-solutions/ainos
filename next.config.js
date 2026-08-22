/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('mongoose');
    }
    return config;
  },
};

module.exports = nextConfig;
