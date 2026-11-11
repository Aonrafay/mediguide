import "dotenv/config";
import path from "node:path";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },
  datasource: {
    // Postgres (Neon) — same URL the runtime adapter opens (see src/lib/db.ts)
    // and that Vercel injects from the connected marketplace database.
    url: process.env.DATABASE_URL ?? "",
  },
});
