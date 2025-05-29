import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/utils";
import { PAGES } from "./(content)/content";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recipes, categories] = await Promise.all([
    db.recipe.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
  ]);
  return [
    { url: siteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/recipes"), changeFrequency: "daily", priority: 0.9 },
    { url: siteUrl("/pantry"), changeFrequency: "weekly", priority: 0.8 },
    ...categories.map((c) => ({ url: siteUrl(`/recipes?category=${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...recipes.map((r) => ({ url: siteUrl(`/recipes/${r.slug}`), lastModified: r.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...Object.keys(PAGES).map((p) => ({ url: siteUrl(`/${p}`), changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
