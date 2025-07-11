import { HttpStatus } from '@nestjs/common';

export class ApiResponse<T> {
  success: boolean;
  statusCode: HttpStatus;
  message: string;
  data?: T | null;
  error?: any;

  constructor(
    success: boolean,
    statusCode: HttpStatus,
    message: string,
    data?: T,
    error?: unknown,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.error = error;
  }

  static success<T>(
    data: T,
    message = 'Success',
    statusCode = HttpStatus.OK,
  ): ApiResponse<T> {
    return new ApiResponse(true, statusCode, message, data);
  }

  static error(
    message: string = 'Error',
    error?: unknown,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
  ): ApiResponse<any> {
    return new ApiResponse<any>(false, statusCode, message, null, error);
  }
}
