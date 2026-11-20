/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // ainossuite.com is the canonical origin. The Render app URL and the www
    // subdomain both serve the same HTML, so search engines were indexing the
    // Render subdomain instead. Send every alternate host to the real domain.
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '.*\\.onrender\\.com' }],
        destination: 'https://ainossuite.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www\\.ainossuite\\.com' }],
        destination: 'https://ainossuite.com/:path*',
        permanent: true,
      },
    ];
  },
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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('mongoose');
    }
    return config;
  },
  turbopack: {},
};

module.exports = nextConfig;
