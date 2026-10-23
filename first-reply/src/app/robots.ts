import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public marketing pages are open to everyone, including AI search crawlers
// (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.). Private areas
// (the app, APIs, and each agent's lead form) stay out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/l/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
