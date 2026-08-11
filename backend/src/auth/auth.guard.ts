import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import crypto from "node:crypto";
import { redis } from "../db/client";
import { AuthRepository } from "./auth.repository";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly repository: AuthRepository) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ")
      ? header.slice(7)
      : request.cookies?.tutorops_session;
    if (!token) throw new UnauthorizedException();

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const cached = await redis.get(`session:${tokenHash}`);
    const user = cached
      ? JSON.parse(cached)
      : await this.repository.findActiveSession(tokenHash);

    if (!user) throw new UnauthorizedException();
    request.user = user;
    return true;
  }
}
