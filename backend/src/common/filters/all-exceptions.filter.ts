import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiResponse } from '@common/dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      `Exception: ${String(exception)}, Status: ${httpStatus}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const responseBody = ApiResponse.error(
      exception instanceof Error ? exception.message : 'Internal server error',
      exception,
      httpStatus,
    );

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
