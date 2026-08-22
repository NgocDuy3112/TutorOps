import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { redis } from "./db/client";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle("TutorOps API")
    .setDescription("Tutor management API")
    .setVersion("1.0")
    .addCookieAuth("tutorops_session")
    .build();
  SwaggerModule.setup("api", app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  });
  await redis.connect();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
