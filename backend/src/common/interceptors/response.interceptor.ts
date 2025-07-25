import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@common/dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => {
        // If already wrapped in ApiResponse, return as is
        if (data instanceof ApiResponse) {
          return data;
        }

        // Check if it's a raw response that should be wrapped
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        // If data has a specific structure we expect, handle it
        if (data && typeof data === 'object' && 'data' in data) {
          return data as unknown as ApiResponse<T>;
        }

        // Otherwise wrap it
        return ApiResponse.success<T>(data, 'Success', statusCode);
      }),
    );
  }
}
