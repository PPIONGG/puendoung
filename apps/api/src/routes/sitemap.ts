import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

export default async function (app: FastifyInstance) {
  app.get("/sitemap.xml", async (request, reply) => {
    const baseUrl = process.env.WEB_ORIGIN || "https://puendoung.example.com";
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ where: { status: "active" }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

    const urls = [
      { loc: `${baseUrl}/`, lastmod: new Date().toISOString(), priority: "1.0" },
      { loc: `${baseUrl}/products`, lastmod: new Date().toISOString(), priority: "0.9" },
      ...categories.map((c) => ({
        loc: `${baseUrl}/products?category=${c.slug}`,
        lastmod: (c.updatedAt || new Date()).toISOString(),
        priority: "0.7",
      })),
      ...products.map((p) => ({
        loc: `${baseUrl}/products/${p.slug}`,
        lastmod: (p.updatedAt || new Date()).toISOString(),
        priority: "0.8",
      })),
      { loc: `${baseUrl}/privacy`, lastmod: new Date().toISOString(), priority: "0.3" },
      { loc: `${baseUrl}/terms`, lastmod: new Date().toISOString(), priority: "0.3" },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    reply.type("application/xml");
    return xml;
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
