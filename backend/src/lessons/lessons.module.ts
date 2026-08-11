import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { LessonsController } from "./lessons.controller";
import { LessonsRepository } from "./lessons.repository";
import { LessonsService } from "./lessons.service";

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, LessonsRepository, AuthGuard, AuthRepository],
})
export class LessonsModule {}
