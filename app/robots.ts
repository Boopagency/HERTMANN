import type { MetadataRoute } from "next";
import { siteIndexable, siteUrl } from "@/lib/site-url";

/**
 * Os robôs podem ler tudo: é assim que encontram o `noindex` das páginas
 * enquanto a indexação está desligada — bloquear aqui impediria que o vissem.
 * O sitemap só é anunciado quando o site é indexável (lib/site-url.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(siteIndexable ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
