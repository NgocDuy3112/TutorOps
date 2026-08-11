import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { ClassesController } from "./classes.controller";
import { ClassesRepository } from "./classes.repository";
import { ClassesService } from "./classes.service";

@Module({
  controllers: [ClassesController],
  providers: [ClassesService, ClassesRepository, AuthGuard, AuthRepository],
})
export class ClassesModule {}
