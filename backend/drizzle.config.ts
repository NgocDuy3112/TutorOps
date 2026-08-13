import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { databaseUrlFromEnv } from "./src/db/connection";

config({ path: process.env.ENV_FILE ?? "../configs/.env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrlFromEnv(),
  },
});
