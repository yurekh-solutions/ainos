/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/ainos',
  trailingSlash: true,
  output: 'standalone',
  // Pages fetch '/api/...' (without the /ainos basePath) — route those to the real API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/ainos/api/:path*',
        basePath: false,
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
    root: '.',
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
