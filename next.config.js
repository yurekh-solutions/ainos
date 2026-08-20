/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/ainos',
  trailingSlash: true,
  output: 'standalone',
  // Pages fetch '/api/...' (without the /ainos basePath) — route those to the real API.
  // Destination must be absolute when it lives outside the basePath, otherwise `next build` fails
  // (this exact error blocked every Render deploy). RENDER_EXTERNAL_URL is set automatically on Render.
  async rewrites() {
    const self = process.env.RENDER_EXTERNAL_URL || process.env.NEXTAUTH_URL?.replace(/\/ainos.*$/, '') || 'http://localhost:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${self}/ainos/api/:path*`,
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
