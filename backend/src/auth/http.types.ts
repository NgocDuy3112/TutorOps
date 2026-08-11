import type { Request } from "express";

export interface AuthUser {
  id: string;
  email: string;
  role: "teacher" | "admin";
}

export type AuthenticatedRequest = Request & { user: AuthUser };
