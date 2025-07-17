// src/app/shared/toast/toast.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  animations: [
    trigger('slideIn', [
      state('in', style({ transform: 'translateX(0)' })),
      transition('void => *', [
        style({ transform: 'translateX(100%)' }),
        animate(300),
      ]),
      transition('* => void', [
        animate(300, style({ transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class ToastComponent implements OnInit {
  @Input() toast!: Toast;
  @Output() close = new EventEmitter<void>();

  animationState = 'in';
  progressWidth = 100;

  ngOnInit() {
    if (!this.toast.persistent && this.toast.duration) {
      this.startProgressBar();
    }
  }

  onClose() {
    this.close.emit();
  }

  getToastClasses(): string {
    const baseClasses = 'border-l-4';
    const typeClasses = {
      success: 'border-l-green-500',
      error: 'border-l-red-500',
      warning: 'border-l-yellow-500',
      info: 'border-l-blue-500',
    };

    return `${baseClasses} ${typeClasses[this.toast.type]}`;
  }

  getIconClasses(): string {
    const typeClasses = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500',
    };

    return `${typeClasses[this.toast.type]}`;
  }

  getProgressBarClasses(): string {
    const typeClasses = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
    };

    return `${typeClasses[this.toast.type]}`;
  }

  private startProgressBar() {
    if (!this.toast.duration) return;

    const interval = 75;
    const steps = this.toast.duration / interval;
    const decrement = 100 / steps;

    const timer = setInterval(() => {
      this.progressWidth -= decrement;
      if (this.progressWidth <= 0) {
        clearInterval(timer);
      }
    }, interval);
  }
}
