import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma.js";

export default async function (app: FastifyInstance) {
  app.get("/categories", async () => {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { data: categories };
  });
}
