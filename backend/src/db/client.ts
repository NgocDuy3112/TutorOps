import { config } from "dotenv";
import { Pool } from "pg";

config({ path: process.env.ENV_FILE ?? "../configs/.env" });
import { createClient } from "redis";
import { databaseUrlFromEnv } from "./connection";

export const pool = new Pool({ connectionString: databaseUrlFromEnv() });
export const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (error) => console.error("Redis error", error));
