import { HttpException, HttpStatus } from "@nestjs/common";

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
