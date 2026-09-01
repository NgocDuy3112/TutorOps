import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import argon2 from "argon2";
import crypto from "node:crypto";
import { redis } from "../db/client";
import { AuthRepository } from "./auth.repository";
import type { AuthUser } from "./http.types";
import { OAuth2Client } from "google-auth-library";

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository) {}
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
      throw new UnauthorizedException("invalid_credentials");
    try {
      const user = await this.repository.createUser(
        email.toLowerCase(),
        await argon2.hash(password),
      );
      return this.createSession(user);
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error && error.code === "23505")
        throw new ConflictException("email_already_exists");
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
      throw new UnauthorizedException("invalid_oauth_state");
    await redis.del(stateKey);
    const { tokens } = await this.google.getToken(code);
    if (!tokens.id_token)
      throw new UnauthorizedException("missing_google_id_token");
    const ticket = await this.google.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true)
      throw new UnauthorizedException("invalid_google_identity");
    const user = await this.repository.findOrCreateGoogleUser(
      payload.email.toLowerCase(),
      payload.sub,
      payload.name ?? payload.given_name ?? undefined,
    );
    return this.createSession(user);
  }

  async profile(userId: string) {
    return this.repository.findProfile(userId);
  }
  async updateProfile(
    userId: string,
    input: import("./profile.dto").UpdateProfileDto,
  ) {
    return this.repository.updateProfile(userId, input.fullName, input.phone);
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
      throw new UnauthorizedException("invalid_password");
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
      throw new UnauthorizedException("invalid_credentials");
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
