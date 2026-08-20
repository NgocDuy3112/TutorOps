import { Injectable, Logger } from "@nestjs/common";

type LogMetadata = Record<string, unknown>;

@Injectable()
export class AppLogger {
  private readonly logger = new Logger();

  log(event: string, metadata: LogMetadata = {}, context?: string) {
    this.logger.log(this.format(event, metadata), context);
  }

  warn(event: string, metadata: LogMetadata = {}, context?: string) {
    this.logger.warn(this.format(event, metadata), context);
  }

  error(event: string, metadata: LogMetadata = {}, trace?: string, context?: string) {
    this.logger.error(this.format(event, metadata), trace, context);
  }

  private format(event: string, metadata: LogMetadata) {
    return JSON.stringify({ event, ...metadata });
  }
}
