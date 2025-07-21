// src/app/shared/toast/toast.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ToastService } from '../../../core/services/toast.service';
import { ToastContainerComponent } from './toast-container.component';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ToastContainerComponent,
  ],
  providers: [ToastService],
  exports: [ToastContainerComponent],
})
export class ToastModule {}
