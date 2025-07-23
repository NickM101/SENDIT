import { DashboardModule } from './dashboard/dashboard.module';
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DashboardLayoutComponent } from './dashboard/dashboard-layout.component';
import { GuestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Public landing page
  {
    path: '',
    loadChildren: () =>
      import('./layouts/landing-page/landing-page.module').then(
        (m) => m.LandingPageModule
      ),
    data: {
      title: 'Landing Page - SendIT',
      description: 'Welcome to SendIT, your reliable parcel delivery service',
    },
  },

  // Auth pages (login, register, etc.)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
    canActivate: [GuestGuard],
    data: {
      preload: true,
    },
  },

  // Authenticated user section with layout
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivateChild: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
    ],
  },

  // Wildcard redirect for unknown routes
  {
    path: '**',
    redirectTo: '/auth/login',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: true,
      preloadingStrategy: undefined,
      scrollPositionRestoration: 'top',
      urlUpdateStrategy: 'eager',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
