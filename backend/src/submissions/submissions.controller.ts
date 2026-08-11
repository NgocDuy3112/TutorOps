import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { FilesService } from "../files/files.service";
import { AccessService } from "../access/access.service";
import { SubmissionsService } from "./submissions.service";
import { pool } from "../db/client";

@Controller("public/submissions")
export class SubmissionsController {
  constructor(
    private readonly submissions: SubmissionsService,
    private readonly files: FilesService,
    private readonly access: AccessService,
  ) {}
  @Post("dropbox")
  @UseInterceptors(FilesInterceptor("files", 10, { limits: { fileSize: 20 * 1024 * 1024 } }))
  async createDropbox(@Query("token") token: string, @UploadedFiles() uploadedFiles: Express.Multer.File[]) {
    if (!token || !uploadedFiles?.length) throw new BadRequestException("files_required");
    const link = await this.access.authenticateAssignmentLink(token);
    const files = await Promise.all(uploadedFiles.map((file) => this.files.upload(null, file, "submissions")));
    const submission = (await pool.query(`INSERT INTO assignment_dropbox_submissions (assignment_id) VALUES ($1) RETURNING id`, [link.assignmentId])).rows[0];
    await Promise.all(files.map((file) => pool.query(`INSERT INTO assignment_dropbox_submission_files (submission_id, file_id) VALUES ($1, $2)`, [submission.id, file.id])));
    return { ok: true };
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor("files", 10, { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async create(
    @Query("token") token: string,
    @Query("assignmentId") assignmentId: string,
    @UploadedFiles() uploadedFiles: Express.Multer.File[],
  ) {
    if (!token || !assignmentId || !uploadedFiles?.length)
      throw new BadRequestException("files_required");
    await this.access.authenticate(token, "student");
    const files = await Promise.all(
      uploadedFiles.map((file) => this.files.upload(null, file, "submissions")),
    );
    return this.submissions.create(token, assignmentId, {
      fileIds: files.map((file) => file.id),
    });
  }
}
