// File: src/app/dashboard/dashboard-routing.module.ts
// Dashboard routing module for SendIT application

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';
import { DashboardLayoutComponent } from './dashboard-layout.component';


const routes: Routes = [
  {
    path: 'admin/users',
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./admin/users/users.module').then((m) => m.UsersModule),
  },





  // USER DASHBOARD

  {
    path: 'user/parcels',
    canActivate: [AuthGuard],
    data: { roles: ['USER'] },
    loadChildren: () =>
      import('./user/parcels/parcels.module').then((m) => m.ParcelsModule),
  },
  {
    path: 'user/pickup-points',
    canActivate: [AuthGuard],
    data: { roles: ['USER'] },
    loadChildren: () =>
      import('./user/pickup-points/pickup-point.module').then((m) => m.PickupPointModule),
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
