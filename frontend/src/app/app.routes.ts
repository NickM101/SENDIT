import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
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
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
    data: {
      preload: true,
    },
  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'user-dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
        data: {
          title: 'User Dashboard - SendIT',
          roles: ['USER', 'ADMIN'],
        },
      },
      {
        path: 'admin-dashboard',
        loadChildren: () =>
          import('./admin/admin.module').then((m) => m.AdminDashboardModule),
        data: {
          title: 'Admin Dashboard - SendIT',
          roles: ['ADMIN'],
        },
      },

      // Add other routes that should use the dashboard layout here
      // For example, if you uncomment the parcel and profile routes, they should go here
      // {
      //   path: 'parcels',
      //   loadChildren: () =>
      //     import('./features/parcels/parcels.module').then((m) => m.ParcelsModule),
      //   data: {
      //     title: 'My Parcels - SendIT',
      //     roles: ['USER', 'ADMIN'],
      //   },
      // },
      // {
      //   path: 'profile',
      //   loadChildren: () =>
      //     import('./features/profile/profile.module').then((m) => m.ProfileModule),
      //   data: {
      //     title: 'Profile - SendIT',
      //     roles: ['USER', 'ADMIN'],
      //   },
      // },
      // {
      //   path: 'track',
      //   loadChildren: () =>
      //     import('./features/tracking/tracking.module').then((m) => m.TrackingModule),
      //   data: {
      //     title: 'Track Parcel - SendIT',
      //   },
      // },
    ],
  },
  // {
  //   path: '/parcels',
  //   loadChildren: () =>
  //     import('./features/parcels/parcels.module').then((m) => m.ParcelsModule),
  //   canActivate: [AuthGuard],
  //   data: {
  //     title: 'My Parcels - SendIT',
  //   },
  // },
  // {
  //   path: '/profile',
  //   loadChildren: () =>
  //     import('./features/profile/profile.module').then((m) => m.ProfileModule),
  //   canActivate: [AuthGuard],
  //   data: {
  //     title: 'Profile - SendIT',
  //   },
  // },
  // {
  //   path: '/admin',
  //   loadChildren: () =>
  //     import('./features/admin/admin.module').then((m) => m.AdminModule),
  //   canActivate: [AuthGuard],
  //   data: {
  //     roles: ['ADMIN'],
  //     title: 'Admin Dashboard - SendIT',
  //   },
  // },
  // {
  //   path: '/track',
  //   loadChildren: () =>
  //     import('./features/tracking/tracking.module').then((m) => m.TrackingModule),
  //   data: {
  //     title: 'Track Parcel - SendIT',
  //   },
  // },
  {
    path: '**',
    redirectTo: '/auth/login',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: false, // Set to true for debugging
      preloadingStrategy: undefined, // You can add custom preloading strategy
      scrollPositionRestoration: 'top',
      urlUpdateStrategy: 'eager',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
