import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../core/guards/auth.guard';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    data: {
      title: 'Admin Dashboard - SendIT',
      description: 'Your SendIT admin dashboard overview',
    },
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'], title: 'User Management - SendIT' },
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./components/user-details/user-details').then(m => m.UserDetailsComponent),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'], title: 'User Details - SendIT' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminDashboardRoutingModule {}
