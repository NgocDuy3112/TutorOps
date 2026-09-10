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
import { GoogleCalendarRepository } from "../google-calendar/google-calendar.repository";
import { GoogleCalendarService } from "../google-calendar/google-calendar.service";
import type { AuthUser } from "./http.types";
import { OAuth2Client } from "google-auth-library";

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly files: FilesService,
    private readonly storage: StorageService,
    private readonly calendarTokens: GoogleCalendarRepository,
    private readonly googleCalendar: GoogleCalendarService,
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

  /** Calendar connect: offline access + events scope so we can push
   *  recurring schedule events. State is prefixed `cal:` so the shared
   *  callback route can branch between login and calendar flows. */
  async getCalendarConnectUrl(userId: string) {
    const state = crypto.randomBytes(32).toString("base64url");
    await redis.set(`oauth:cal:${state}`, userId, { EX: 600 });
    return {
      url: this.google.generateAuthUrl({
        access_type: "offline",
        scope: [
          "openid",
          "email",
          "profile",
          "https://www.googleapis.com/auth/calendar.events",
        ],
        state: `cal:${state}`,
        prompt: "consent", // refresh_token is only issued on first consent
      }),
    };
  }

  async googleCallback(code: string, state: string) {
    if (state?.startsWith("cal:")) return this.calendarCallback(code, state);
    const stateKey = `oauth:google:state:${state}`;
    if (!state || !(await redis.get(stateKey)))
      throw new UnauthorizedError(ErrorCodes.INVALID_OAUTH_STATE);
    await redis.del(stateKey);
    const { tokens } = await this.google.getToken(code);
    if (!tokens.id_token)
      throw new UnauthorizedError(ErrorCodes.MISSING_GOOGLE_ID_TOKEN);
    const payload = await this.verifyGoogleIdentity(tokens.id_token);
    const user = await this.repository.findOrCreateGoogleUser(
      payload.email.toLowerCase(),
      payload.sub,
      payload.name ?? payload.given_name ?? undefined,
    );
    return this.createSession(user);
  }

  /** One Tap / GIS: the browser hands us a signed ID token directly —
   *  no code exchange needed. Same identity checks as the redirect flow. */
  async googleOneTap(credential: string) {
    const payload = await this.verifyGoogleIdentity(credential);
    const user = await this.repository.findOrCreateGoogleUser(
      payload.email.toLowerCase(),
      payload.sub,
      payload.name ?? payload.given_name ?? undefined,
    );
    return this.createSession(user);
  }

  private async verifyGoogleIdentity(idToken: string) {
    const ticket = await this.google.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true)
      throw new UnauthorizedError(ErrorCodes.INVALID_GOOGLE_IDENTITY);
    return payload;
  }

  /** Exchanges the calendar-flow code for tokens and stores them.
   *  Returns connected=true on success so the redirect can inform the UI. */
  private async calendarCallback(code: string, state: string) {
    const stateKey = `oauth:cal:${state.slice("cal:".length)}`;
    const userId = await redis.get(stateKey);
    if (!userId) throw new UnauthorizedError(ErrorCodes.INVALID_OAUTH_STATE);
    await redis.del(stateKey);
    const { tokens } = await this.google.getToken(code);
    if (!tokens.refresh_token)
      throw new UnauthorizedError(ErrorCodes.INVALID_OAUTH_STATE);
    await this.calendarTokens.upsertTokens(userId, {
      refreshToken: tokens.refresh_token!,
      accessToken: tokens.access_token ?? null,
      tokenExpiry:
        tokens.expiry_date != null
          ? new Date(tokens.expiry_date)
          : null,
    });
    // Connected: push the teacher's existing schedules right away, so the
    // toggle flipping on means the calendar is actually populated.
    await this.googleCalendar.syncTeacher(userId).catch(() => undefined);
    return { mode: "calendar" as const, userId };
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
