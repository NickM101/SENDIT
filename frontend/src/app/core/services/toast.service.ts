// src/app/shared/toast/toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);

  get toasts() {
    return this.toasts$.asObservable();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  show(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      duration: toast.duration ?? 5000,
    };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, newToast]);

    if (!toast.persistent && (newToast.duration ?? 0) > 0) {
      setTimeout(() => {
        this.remove(newToast.id);
      }, newToast.duration ?? 0);
    }
  }

  success(title: string, message?: string, options?: Partial<Toast>): void {
    this.show({
      type: 'success',
      title,
      message,
      ...options,
    });
  }

  error(title: string, message?: string, options?: Partial<Toast>): void {
    this.show({
      type: 'error',
      title,
      message,
      ...options,
    });
  }

  warning(title: string, message?: string, options?: Partial<Toast>): void {
    this.show({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }

  info(title: string, message?: string, options?: Partial<Toast>): void {
    this.show({
      type: 'info',
      title,
      message,
      ...options,
    });
  }

  remove(id: string): void {
    const currentToasts = this.toasts$.value;
    this.toasts$.next(currentToasts.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.toasts$.next([]);
  }
}
