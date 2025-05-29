import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api", "/login", "/register", "/shopping-list", "/planner"] }],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
