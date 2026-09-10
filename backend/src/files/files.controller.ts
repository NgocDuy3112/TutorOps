import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiBody, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { FilesService } from "./files.service";

@ApiTags("files")
@Controller("files")
@UseGuards(AuthGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  upload(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.files.upload(request.user.id, file);
  }

  @Delete(":id")
  async softDelete(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.files.softDelete(request.user.id, id);
  }

  @Get(":id/raw")
  async downloadRaw(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.files.downloadRaw(request.user.id, id);
    response.setHeader("Content-Type", file.contentType);
    response.setHeader(
      "Content-Disposition",
      `inline; filename="${file.originalName}"`,
    );
    // Private cache: re-uploads get a new file id, so caching by id is safe
    // and lets the PNG export re-fetch hit the browser cache.
    response.setHeader("Cache-Control", "private, max-age=86400");
    return new StreamableFile(file.stream);
  }
}
