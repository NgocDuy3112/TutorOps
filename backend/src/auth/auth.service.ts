import { Injectable } from "@nestjs/common";
import {
  ConflictError,
  UnauthorizedError,
} from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import argon2 from "argon2";
import crypto from "node:crypto";
import { redis } from "../db/client";
import { AuthRepository } from "./auth.repository";
import { FilesService } from "../files/files.service";
import { StorageService } from "../storage/storage.service";
import type { AuthUser } from "./http.types";
import { OAuth2Client } from "google-auth-library";

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly files: FilesService,
    private readonly storage: StorageService,
  ) {}
  private google = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  private hash(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
  }
  async register(email: string, password: string) {
    if (!email || !password || password.length < 8)
      throw new UnauthorizedError(ErrorCodes.INVALID_CREDENTIALS);
    try {
      const user = await this.repository.createUser(
        email.toLowerCase(),
        await argon2.hash(password),
      );
      return this.createSession(user);
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error && error.code === "23505")
        throw new ConflictError(ErrorCodes.EMAIL_ALREADY_EXISTS);
      throw error;
    }
  }
  async getGoogleUrl() {
    const state = crypto.randomBytes(32).toString("base64url");
    await redis.set(`oauth:google:state:${state}`, "1", { EX: 600 });
    return {
      url: this.google.generateAuthUrl({
        access_type: "online",
        scope: ["openid", "email", "profile"],
        state,
        prompt: "select_account",
      }),
    };
  }

  async googleCallback(code: string, state: string) {
    const stateKey = `oauth:google:state:${state}`;
    if (!state || !(await redis.get(stateKey)))
      throw new UnauthorizedError(ErrorCodes.INVALID_OAUTH_STATE);
    await redis.del(stateKey);
    const { tokens } = await this.google.getToken(code);
    if (!tokens.id_token)
      throw new UnauthorizedError(ErrorCodes.MISSING_GOOGLE_ID_TOKEN);
    const ticket = await this.google.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true)
      throw new UnauthorizedError(ErrorCodes.INVALID_GOOGLE_IDENTITY);
    const user = await this.repository.findOrCreateGoogleUser(
      payload.email.toLowerCase(),
      payload.sub,
      payload.name ?? payload.given_name ?? undefined,
    );
    return this.createSession(user);
  }

  async profile(userId: string) {
    const profile = await this.repository.findProfile(userId);
    return {
      ...profile,
      // Same-origin URL — presigned S3 URLs expire after 300s and are
      // cross-origin, which breaks the PNG export of the monthly slip.
      paymentQrUrl: profile?.paymentQrFileId
        ? `/files/${profile.paymentQrFileId}/raw`
        : null,
      paymentQrFileId: undefined,
    };
  }
  async updateProfile(
    userId: string,
    input: import("./profile.dto").UpdateProfileDto,
  ) {
    return this.repository.updateProfile(userId, input.fullName, input.phone);
  }
  async updatePaymentQr(userId: string, file: Express.Multer.File) {
    const previous = (await this.repository.findProfile(userId))
      ?.paymentQrFileId;
    const stored = await this.files.upload(userId, file, "payment-qr");
    await this.repository.setPaymentQrFile(userId, stored.id);
    // Clean up the replaced QR file so orphan rows don't accumulate.
    if (previous) await this.files.softDelete(userId, previous).catch(() => {});
    return { paymentQrUrl: `/files/${stored.id}/raw` };
  }
  async changePassword(
    userId: string,
    input: import("./profile.dto").ChangePasswordDto,
  ) {
    const record = await this.repository.findPasswordHash(userId);
    if (
      !record?.passwordHash ||
      !(await argon2.verify(record.passwordHash, input.currentPassword))
    )
      throw new UnauthorizedError(ErrorCodes.INVALID_PASSWORD);
    await this.repository.updatePassword(
      userId,
      await argon2.hash(input.newPassword),
    );
    return { ok: true };
  }

  async logout(token?: string) {
    if (!token) return;
    const tokenHash = this.hash(token);
    await this.repository.revokeSession(tokenHash);
    await redis.del(`session:${tokenHash}`);
  }

  async login(email: string, password: string) {
    const user = await this.repository.findByEmail(email?.toLowerCase());
    if (
      !user?.password_hash ||
      !(await argon2.verify(user.password_hash, password))
    )
      throw new UnauthorizedError(ErrorCodes.INVALID_CREDENTIALS);
    return this.createSession(user);
  }
  private async createSession(user: AuthUser) {
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = this.hash(token);
    const ttl = 86400;
    await this.repository.createSession(user.id, tokenHash, ttl);
    await redis.set(
      `session:${tokenHash}`,
      JSON.stringify({ id: user.id, email: user.email, role: user.role }),
      { EX: ttl },
    );
    return { token, user };
  }
}
