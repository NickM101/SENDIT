// File: src/app/dashboard/dashboard.module.ts
// Dashboard module for SendIT application

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';

// Services
import { DashboardService } from './services/dashboard.service';
import { AuthGuard } from '../core/guards/auth.guard';

// Shared module (if available)
// import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DashboardRoutingModule,
  ],
  providers: [DashboardService, AuthGuard],
})
export class DashboardModule {}
