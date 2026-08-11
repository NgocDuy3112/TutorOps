import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { FilesController } from "./files.controller";
import { FilesRepository } from "./files.repository";
import { FilesService } from "./files.service";

@Module({
  controllers: [FilesController],
  providers: [FilesService, FilesRepository, AuthGuard, AuthRepository],
  exports: [FilesService],
})
export class FilesModule {}
