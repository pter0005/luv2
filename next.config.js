const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desativa mapas pesados pra economizar memória
  productionBrowserSourceMaps: false,
  
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' https: data: blob:;
      font-src 'self' https:;
      connect-src 'self' https://firebasestorage.googleapis.com https://storage.googleapis.com https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com;
      media-src 'self' https: blob:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      frame-src https://www.youtube.com https://player.vimeo.com;
      report-uri /api/csp-report;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          // Anti-clickjacking (impede que o site seja embedado em iframes
          // de terceiros — bloqueia ataque tipo "phishing por iframe").
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Anti MIME-sniffing (browser não tenta adivinhar tipo, evita
          // executar arquivo malicioso como script).
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referer policy — não vaza URL completa em links externos.
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy — restringe APIs sensíveis. Nego tudo que
          // o site não usa (USB, MIDI, magnetómetro, etc) pra reduzir
          // superfície de ataque.
          {
            key: 'Permissions-Policy',
            value: "camera=(self), microphone=(self), geolocation=(), accelerometer=(), autoplay=(self), gyroscope=(), magnetometer=(), midi=(), payment=(self), picture-in-picture=(), usb=(), xr-spatial-tracking=()",
          },
          // HSTS — força HTTPS por 2 anos, inclui subdomínios, marca pra
          // pre-load list dos browsers (impossibilita downgrade attacks).
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // CSP em ENFORCE mode (era Report-Only — agora bloqueia injeções
          // XSS de verdade, não só reporta).
          {
            key: 'Content-Security-Policy',
            value: cspHeader
          },
          // COOP — isolamento contra Spectre/Meltdown e cross-origin abuse.
          // 'same-origin' = só janelas do mesmo origin compartilham contexto.
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          // Privacy: desabilita prefetch de DNS (browser não dispara
          // requests preditivos pra domínios em hyperlinks da página).
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off'
          }
        ],
      },
    ];
  },

  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
