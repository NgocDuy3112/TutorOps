import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AppException } from "./app-exception";
import { ErrorCodes } from "./error-codes";
import { AppLogger } from "./app-logger";

/** Logs every thrown exception as `{event, code, status, method, path}`. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const base = { method: request.method, path: request.url };

    if (exception instanceof AppException) {
      const status = exception.getStatus();
      this.logger.warn("http_exception", {
        ...base,
        code: exception.code,
        status,
      });
      response
        .status(status)
        .json({ statusCode: status, message: exception.code });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      this.logger.warn("http_exception", {
        ...base,
        code: exception.message,
        status,
      });
      response.status(status).json(exception.getResponse());
      return;
    }

    const message =
      exception instanceof Error ? exception.message : ErrorCodes.INTERNAL_ERROR;
    const trace = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      "unhandled_exception",
      { ...base, code: ErrorCodes.INTERNAL_ERROR, message },
      trace,
    );
    response
      .status(500)
      .json({ statusCode: 500, message: ErrorCodes.INTERNAL_ERROR });
  }
}
