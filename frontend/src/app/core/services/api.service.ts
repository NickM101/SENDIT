import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpHeaders,
  HttpEvent,
  HttpEventType,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  QueryParams,
} from '../../shared/models/api.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Utility to build HttpParams from QueryParams */
  private buildHttpParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(
            (v) => (httpParams = httpParams.append(key, v.toString()))
          );
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });

    return httpParams;
  }

  /** GET full response (useful when data structure varies) */
  getRaw<T>(
    endpoint: string,
    params?: QueryParams
  ): Observable<ApiResponse<T>> {
    const httpParams = this.buildHttpParams(params);

    return this.http
      .get<ApiResponse<T>>(`${this.API_URL}${endpoint}`, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        params: httpParams,
      })
      .pipe(catchError(this.handleError));
  }

  /** GET request with default mapping to `data` (use when structure is known) */
  get<T>(endpoint: string, params?: QueryParams): Observable<T> {
    return this.getRaw<T>(endpoint, params).pipe(
      map((res) => {
        if (res.data === null || res.data === undefined) {
          throw new Error('API response data is null or undefined');
        }
        return res.data;
      })
    );
  }

  /** GET paginated response with specified item key */
  getPaginated<T>(
    endpoint: string,
    itemKey: string,
    params?: QueryParams
  ): Observable<PaginatedResponse<T>> {
    const httpParams = this.buildHttpParams(params);

    return this.getRaw<any>(endpoint, params).pipe(
      map((response: ApiResponse<any>) => {
        // The actual data payload is in response.data
        const payload = response.data;

        // Validate the structure of the payload
        if (!payload || typeof payload !== 'object') {
          throw new Error(
            'Invalid response format: expected object in `data`.'
          );
        }

        // Extract pagination metadata from payload.pagination
        const pagination = payload.pagination as PaginationMeta | undefined;
        if (!pagination) {
          console.warn(
            'Pagination metadata not found in response.data.pagination'
          );
          // Or throw an error if pagination is strictly required
          throw new Error('Pagination metadata not found in response.data.pagination');
        }

        // Extract items array using the provided itemKey from the payload
        const items = payload[itemKey];

        // Validate that the extracted items is an array
        if (!Array.isArray(items)) {
          throw new Error(
            `Expected an array under "data.${itemKey}" in the API response.`
          );
        }

        // Construct and return the standardized PaginatedResponse
        // Ensure pagination object has required fields or defaults
        const standardizedPagination: PaginationMeta = {
          page: pagination?.page ?? 1,
          limit: pagination?.limit ?? 0,
          total: pagination?.total ?? items.length, // Fallback if total not provided
          totalPages: pagination?.totalPages,
          lastPage: pagination?.lastPage,
        };

        return { items, pagination: standardizedPagination };
      }),
      catchError(this.handleError) // Handle errors appropriately
    );
  }

  /** POST request */
  post<T>(endpoint: string, data?: any): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.API_URL}${endpoint}`, data, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(
        map((res) => {
          if (res.data === null || res.data === undefined) {
            throw new Error('API response data is null or undefined');
          }
          return res.data;
        }),
        catchError(this.handleError)
      );
  }

  /** PUT request */
  put<T>(endpoint: string, data?: any): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.API_URL}${endpoint}`, data, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(
        map((res) => {
          if (res.data === null || res.data === undefined) {
            throw new Error('API response data is null or undefined');
          }
          return res.data;
        }),
        catchError(this.handleError)
      );
  }

  /** PATCH request */
  patch<T>(endpoint: string, data?: any): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.API_URL}${endpoint}`, data, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(
        map((res) => {
          if (res.data === null || res.data === undefined) {
            throw new Error('API response data is null or undefined');
          }
          return res.data;
        }),
        catchError(this.handleError)
      );
  }

  /** DELETE request */
  delete<T>(endpoint: string, params?: any): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.API_URL}${endpoint}`, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        params,
      })
      .pipe(
        map((res) => {
          if (res.data === null || res.data === undefined) {
            throw new Error('API response data is null or undefined');
          }
          return res.data;
        }),
        catchError(this.handleError)
      );
  }

  uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Observable<{ progress: number; data?: T }> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    const req = new HttpRequest(
      'POST',
      `${this.API_URL}${endpoint}`,
      formData,
      {
        reportProgress: true,
      }
    );

    return this.http.request<ApiResponse<T>>(req).pipe(
      map((event: HttpEvent<ApiResponse<T>>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress: {
            const progress = event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            return { progress };
          }

          case HttpEventType.Response: {
            const data = event.body?.data;
            if (data === null || data === undefined) {
              throw new Error('API response data is null or undefined');
            }
            return { progress: 100, data };
          }

          default:
            return { progress: 0 };
        }
      }),
      catchError(this.handleError)
    );
  }

  /** Upload multiple files */
  uploadFiles<T>(
    endpoint: string,
    files: File[],
    additionalData?: any
  ): Observable<T> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http
      .post<ApiResponse<T>>(`${this.API_URL}${endpoint}`, formData, {})
      .pipe(
        map((res) => {
          if (res.data === null || res.data === undefined) {
            throw new Error('API response data is null or undefined');
          }
          return res.data;
        }),
        catchError(this.handleError)
      );
  }

  /** Error handler */
  private handleError(error: any): Observable<never> {
    let errMsg = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errMsg = `Client-side error: ${error.error.message}`;
    } else if (error.status) {
      // Server-side error
      errMsg = `Server returned code ${error.status}, message: ${error.message}`;
    }

    console.error('API Service Error:', errMsg, error);
    return throwError(() => new Error(errMsg));
  }
}
