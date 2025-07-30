import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  /* ----------  I/O  ---------- */
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Input() dismissible = true; // close on overlay click / ESC
  @Input() showHeader = true; // hide header if you want to project everything
  @Input() showFooter = true; // hide footer if you project your own buttons

  /* Events */
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  /* ----------  helpers  ---------- */
  get widthClass(): string {
    switch (this.size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case 'full':
        return 'max-w-4xl';
      default:
        return 'max-w-md';
    }
  }

  /* ----------  close handlers  ---------- */
  onOverlayClick(e: MouseEvent): void {
    if (this.dismissible && e.target === e.currentTarget) {
      this.onClose();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.dismissible) this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
