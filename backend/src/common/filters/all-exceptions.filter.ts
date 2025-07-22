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
import { ConfigService } from '@nestjs/config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
  ) {}

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

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    let apiMessage: string;
    let apiError: any;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      // Check if it's a validation error from ValidationPipe
      if (typeof response === 'object' && response !== null && 'message' in response) {
        // If message is an array (from ValidationPipe), join it
        const message = (response as { message: string | string[] }).message;
        apiMessage = Array.isArray(message)
          ? message.join(', ')
          : message;
        apiError = isProduction ? null : exception.name;
      } else {
        // For other HttpException types, use the exception's message
        apiMessage = exception.message;
        apiError = isProduction ? null : exception.name;
      }
    } else if (exception instanceof Error) {
      // For generic Error instances
      apiMessage = exception.message;
      apiError = isProduction ? null : exception.name;
    } else {
      // For unknown exceptions
      apiMessage = 'Internal server error';
      apiError = isProduction ? null : String(exception);
    }

    // In production, always show a generic message for internal server errors
    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR && isProduction) {
      apiMessage = 'Internal server error';
      apiError = null;
    }

    const responseBody = ApiResponse.error(
      apiMessage,
      apiError,
      httpStatus,
    );

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
