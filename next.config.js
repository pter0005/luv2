/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ignora erros de Typescript pra economizar memória
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignora erros de Lint pra economizar memória
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Desativa mapas pesados pra economizar memória
  productionBrowserSourceMaps: false,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: "camera=('self'), microphone=('self'), geolocation=()",
          },
        ],
      },
    ];
  },

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'imgur.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
};

module.exports = nextConfig;
