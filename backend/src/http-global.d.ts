import type { Request, Response } from "express";
import type { AuthUser } from "./auth/http.types";

declare global {
  type AuthenticatedRequest = Request & { user: AuthUser };
  type HttpResponse = Response;
}

export {};
