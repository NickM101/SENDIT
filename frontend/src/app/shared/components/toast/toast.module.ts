// src/app/shared/toast/toast.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastComponent } from './toast.component';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../../core/services/toast.service';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ToastComponent,
    ToastContainerComponent,
  ],
  providers: [ToastService],
  exports: [ToastContainerComponent],
})
export class ToastModule {}
