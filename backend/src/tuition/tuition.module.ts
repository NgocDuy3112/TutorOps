import { Module } from "@nestjs/common";
import { TuitionController } from "./tuition.controller";
import { TuitionService } from "./tuition.service";
import { TuitionRepository } from "./tuition.repository";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";

@Module({
  controllers: [TuitionController],
  providers: [TuitionService, TuitionRepository, AuthGuard, AuthRepository],
})
export class TuitionModule {}
