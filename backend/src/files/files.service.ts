import { Injectable } from "@nestjs/common";
import { BadRequestError, NotFoundError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { StorageService } from "../storage/storage.service";
import { FilesRepository } from "./files.repository";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
]);
const maxFileSize = 20 * 1024 * 1024;

@Injectable()
export class FilesService {
  constructor(
    private readonly storage: StorageService,
    private readonly repository: FilesRepository,
  ) {}

  async upload(
    userId: string | null,
    file: Express.Multer.File,
    prefix = "assignments",
  ) {
    if (
      !file ||
      !allowedMimeTypes.has(file.mimetype) ||
      file.size <= 0 ||
      file.size > maxFileSize ||
      !this.matchesContent(file)
    )
      throw new BadRequestError(ErrorCodes.INVALID_FILE);
    const extension = file.originalname.includes(".")
      ? (file.originalname.split(".").pop() ?? null)
      : null;
    const stored = await this.storage.upload({
      body: file.buffer,
      mimeType: file.mimetype,
      extension: extension ?? undefined,
      prefix,
    });
    return this.repository.create({
      storageKey: stored.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      extension,
      sizeBytes: file.size,
      createdBy: userId,
    });
  }

  /** Raw object stream for same-origin serving. Only the uploader may read
   *  their own file — everything else is indistinguishable from missing. */
  async downloadRaw(userId: string, fileId: string) {
    const file = await this.repository.findById(fileId);
    if (!file || file.createdBy !== userId)
      throw new NotFoundError(ErrorCodes.FILE_NOT_FOUND);
    const object = await this.storage.download(file.storageKey);
    return { ...object, originalName: file.originalName };
  }

  /** Deletes the uploader's file. Unreferenced files are removed for real
   *  (row + S3 object); files still attached to assignments/submissions are
   *  only hidden (soft delete) so past history keeps working. */
  async softDelete(userId: string, fileId: string) {
    const file = await this.repository.findById(fileId);
    if (!file || file.createdBy !== userId)
      throw new NotFoundError(ErrorCodes.FILE_NOT_FOUND);
    if ((await this.repository.countReferences(fileId)) === 0) {
      await this.repository.hardDelete(fileId);
      await this.storage.delete(file.storageKey).catch(() => {});
      return { ok: true, mode: "deleted" as const };
    }
    await this.repository.softDelete(fileId);
    return { ok: true, mode: "hidden" as const };
  }

  private matchesContent(file: Express.Multer.File) {
    const bytes = file.buffer;
    if (file.mimetype === "image/jpeg")
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (file.mimetype === "image/png")
      return bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (file.mimetype === "application/pdf")
      return bytes.subarray(0, 4).toString() === "%PDF";
    return file.mimetype === "image/heic";
  }
}
