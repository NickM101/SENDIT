import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DashboardLayoutComponent } from '../layouts/dashboard-layout/dashboard-layout.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
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
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminDashboardRoutingModule {}
