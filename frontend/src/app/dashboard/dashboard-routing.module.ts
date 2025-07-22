// File: src/app/dashboard/dashboard-routing.module.ts
// Dashboard routing module for SendIT application

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardLayoutComponent } from '../layouts/dashboard-layout/dashboard-layout.component';
const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: {
      title: 'Dashboard - SendIT',
      description: 'Your SendIT dashboard overview',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
