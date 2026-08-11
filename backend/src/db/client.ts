import { config } from "dotenv";
import { Pool } from "pg";

config({ path: process.env.ENV_FILE ?? "../configs/.env" });
import { createClient } from "redis";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (error) => console.error("Redis error", error));
