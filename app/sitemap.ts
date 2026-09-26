import type { MetadataRoute } from "next";
import { categories, collections, pieces } from "@/lib/data/catalogue";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const statics = ["", "/joias", "/colecoes", "/sobre", "/atelie", "/contato", "/termos", "/privacidade"];

  return [
    ...statics.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...categories.map((c) => ({
      url: `${siteUrl}/joias/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...collections.map((c) => ({
      url: `${siteUrl}/colecoes/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...pieces.map((p) => ({
      url: `${siteUrl}/produto/${encodeURIComponent(p.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
