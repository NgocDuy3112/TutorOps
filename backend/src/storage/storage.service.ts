import { Injectable } from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

@Injectable()
export class StorageService {
  private get bucket() {
    return this.required("S3_BUCKET");
  }

  private get client() {
    return new S3Client({
      region: process.env.S3_REGION ?? "us-east-1",
      endpoint: this.required("S3_ENDPOINT"),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: this.required("S3_ACCESS_KEY_ID"),
        secretAccessKey: this.required("S3_SECRET_ACCESS_KEY"),
      },
    });
  }

  async upload(input: {
    body: Buffer;
    mimeType: string;
    extension?: string;
    prefix: string;
  }) {
    const safeExtension = input.extension
      ? `.${input.extension.replace(/[^a-zA-Z0-9]/g, "")}`
      : "";
    const key = `${input.prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${safeExtension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.mimeType,
      }),
    );
    return { key, bucket: this.bucket, mimeType: input.mimeType };
  }

  getDownloadUrl(key: string, expiresIn = 300) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  private required(name: string) {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required`);
    return value;
  }
}
