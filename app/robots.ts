import type { MetadataRoute } from "next";

// Next.js 14 dynamic robots.txt
// URL: https://kuaileme.superangel527.com/robots.txt
export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kuaileme.superangel527.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API routes 不需要被爬（每次動態、也保護 /api/promo/*）
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
