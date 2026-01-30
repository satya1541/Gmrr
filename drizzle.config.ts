import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts", // Path to your Drizzle schema
  dialect: "mysql",
  dbCredentials: {
    host: "40.192.42.60",
    user: "testing",
    password: "testing@2025",
    database: "gmr_db",
    port: 3306,
  },
});
