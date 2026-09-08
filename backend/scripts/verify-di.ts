/* Boot only the DI container (no redis, no listen) to verify module graph. */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module";

async function main() {
  await NestFactory.create(AppModule, { logger: ["log"] });
  console.log("DI_GRAPH_OK: all modules resolved");
  process.exit(0);
}

main().catch((error) => {
  console.error("DI_GRAPH_FAIL", error?.message);
  process.exit(1);
});
