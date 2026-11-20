/** @type {import('next').NextConfig} */

// Baseline response headers. Applied to every route, including the public
// marketing pages that search engines crawl - nothing here hides content, it
// only stops clickjacking, MIME sniffing and information leaks.
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only this site may frame our pages. The blog embed widget is a script plus
  // JSON API, so it keeps working for clients on their own domains.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // The whole product runs over TLS and the alternate hosts redirect to it, so
  // remembering the https version cannot lock anyone out.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()' },
  // A full script-src policy would break Next.js inline bootstrapping and the
  // embed widget, so only the directives that close real holes are declared.
  // No trusted-types directive: React 19 creates its own Trusted Types policy
  // for rich HTML rendering, and forbidding that would break blog content.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
];

const nextConfig = {
  // Leaks the exact Next.js version to every scanner that asks for it.
  poweredByHeader: false,
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
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
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
    // Remote SVGs stay allowed because blog artwork comes from arbitrary hosts,
    // but optimizer responses are forced to download and carry their own CSP,
    // which is what Next.js recommends for SVG-based script injection.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'none'; script-src 'none'; style-src 'none'; object-src 'none'; form-action 'none'",
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
