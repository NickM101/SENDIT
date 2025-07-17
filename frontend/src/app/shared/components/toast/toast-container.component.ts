// src/app/shared/toast/toast-container.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastComponent } from './toast.component';
import { Toast } from '../../../core/services/toast.service';
import { ToastService } from '../../../core/services/toast.service';
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
      @for (toast of toasts$ | async; track toast.id) {
      <app-toast [toast]="toast" (close)="removeToast(toast.id)"></app-toast>
      }
    </div>
  `,
})
export class ToastContainerComponent implements OnInit {
  toasts$: Observable<Toast[]>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts;
  }

  ngOnInit() {}

  removeToast(id: string) {
    this.toastService.remove(id);
  }
}
