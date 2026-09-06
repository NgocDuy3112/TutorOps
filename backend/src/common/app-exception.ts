import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Base app exception carrying a machine-readable `code` (see `error-codes.ts`).
 * Extends `HttpException` so Nest handles the response natively even if the
 * logging filter is bypassed; the filter only adds structured logging.
 */
export class AppException extends HttpException {
  readonly code: string;

  constructor(code: string, status: HttpStatus) {
    super(code, status);
    this.code = code;
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppException {
  constructor(code: string) {
    super(code, HttpStatus.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppException {
  constructor(code: string) {
    super(code, HttpStatus.UNAUTHORIZED);
  }
}

export class NotFoundError extends AppException {
  constructor(code: string) {
    super(code, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends AppException {
  constructor(code: string) {
    super(code, HttpStatus.CONFLICT);
  }
}
