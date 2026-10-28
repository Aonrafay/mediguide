import "dotenv/config";
import path from "node:path";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },
  datasource: {
    // Resolved relative to the project root — same file the runtime adapter
    // opens (see src/lib/db.ts). Switch to a Postgres URL for Neon later.
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
