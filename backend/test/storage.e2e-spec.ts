import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { StorageService } from "../src/storage/storage.service";

const mockSend = jest.fn().mockResolvedValue({});
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ input, name: "DeleteObjectCommand" })),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ input, name: "GetObjectCommand" })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input, name: "PutObjectCommand" })),
}));
jest.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: jest.fn().mockResolvedValue("https://signed.example/file") }));
const mockSignedUrl = jest.requireMock("@aws-sdk/s3-request-presigner").getSignedUrl as jest.Mock;

describe("StorageService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      S3_ENDPOINT: "https://s3.example",
      S3_REGION: "ap-southeast-1",
      S3_BUCKET: "tutorops-test",
      S3_ACCESS_KEY_ID: "access-key",
      S3_SECRET_ACCESS_KEY: "secret-key",
      S3_FORCE_PATH_STYLE: "true",
    };
    mockSend.mockClear();
    mockSignedUrl.mockClear();
    (S3Client as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uploads object with configured bucket and metadata", async () => {
    const service = new StorageService();
    const result = await service.upload({
      body: Buffer.from("file"),
      mimeType: "application/pdf",
      extension: "pdf",
      prefix: "assignments",
    });

    expect(result.bucket).toBe("tutorops-test");
    expect(result.mimeType).toBe("application/pdf");
    expect(result.key).toMatch(/^assignments\/\d{4}-\d{2}-\d{2}\/[\w-]+\.pdf$/);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        Bucket: "tutorops-test",
        Body: Buffer.from("file"),
        ContentType: "application/pdf",
      }),
    }));
  });

  it("creates a presigned download URL", async () => {
    const service = new StorageService();
    await expect(service.getDownloadUrl("assignments/file.pdf", 600)).resolves.toBe("https://signed.example/file");
    expect(mockSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      input: { Bucket: "tutorops-test", Key: "assignments/file.pdf" },
    }), { expiresIn: 600 });
  });

  it("deletes object from configured bucket", async () => {
    const service = new StorageService();
    await service.delete("assignments/file.pdf");
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      input: { Bucket: "tutorops-test", Key: "assignments/file.pdf" },
    }));
  });

  it("fails clearly when required configuration is missing", async () => {
    delete process.env.S3_BUCKET;
    const service = new StorageService();
    await expect(service.delete("file.pdf")).rejects.toThrow("S3_BUCKET is required");
  });
});
