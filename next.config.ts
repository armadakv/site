import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Images from docs static assets served from /public
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/docs-static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
