/**
 * A mesma regra de lib/site-url.ts: só indexável com SITE_INDEXABLE=true e em
 * produção. Até lá, o cabeçalho cobre também o que não é HTML (imagens,
 * sitemap). Os Previews da Vercel já o recebem da própria Vercel.
 */
const indexable =
  process.env.SITE_INDEXABLE === 'true' && process.env.VERCEL_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Fotografias dos produtos geridas no Admin vêm do CDN da loja Hostinger.
    // Endereço visto na loja em 2026-09-24 (diagnóstico): cdn.zyrosite.com/cdn-ecommerce/…
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.zyrosite.com', pathname: '/cdn-ecommerce/**' },
    ],
  },
  experimental: {
    // Envio de imagens pelo painel (/admin): até 4 MB por arquivo, mais a
    // margem do formulário. O site público não usa Server Actions.
    serverActions: { bodySizeLimit: '5mb' },
  },
  async headers() {
    if (indexable) return [];
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
