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
