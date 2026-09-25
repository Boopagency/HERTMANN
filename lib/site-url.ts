/* ============================================================================
   Origem pública do site e política de indexação
   ----------------------------------------------------------------------------
   Enquanto a casa não tiver domínio definitivo, nada aponta para um endereço
   que ela não possui. A origem resolve-se por esta ordem:

   1. NEXT_PUBLIC_SITE_URL — o domínio definitivo, quando existir (Config).
   2. Na Vercel, variáveis de sistema: o domínio de produção do projecto em
      produção (VERCEL_PROJECT_PRODUCTION_URL — acompanha sozinho o domínio
      que vier a ser ligado) ou o endereço do próprio Preview (VERCEL_URL).
   3. Localmente: http://localhost.

   Canónicos, Open Graph, sitemap e JSON-LD usam esta origem. O retorno do
   checkout usa a origem do navegador (lib/hostinger/client.ts).

   Indexação: desligada por omissão. Só com SITE_INDEXABLE=true e em
   produção — nunca num Preview, nem que a variável lá esteja.

   Lido no servidor: as variáveis VERCEL_* não chegam ao navegador.
   ========================================================================== */

function withProtocol(host: string): string {
  const value = host.trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return withProtocol(explicit);

  const host =
    process.env.VERCEL_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : process.env.VERCEL_URL;
  if (host) return withProtocol(host);

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const siteUrl = resolveSiteUrl();

export const siteIndexable =
  process.env.SITE_INDEXABLE === "true" &&
  process.env.VERCEL_ENV === "production";
