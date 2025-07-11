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
        const response: { statusCode: number } = context
          .switchToHttp()
          .getResponse();
        const statusCode: number = response.statusCode;

        if (data instanceof ApiResponse) {
          return data as ApiResponse<T>;
        }

        return ApiResponse.success<T>(data, 'Success', statusCode);
      }),
    );
  }
}
