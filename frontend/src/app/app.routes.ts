import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
    data: {
      preload: true,
    },
  },
  // {
  //   path: '/dashboard',
  //   loadChildren: () =>
  //     import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
  //   canActivate: [AuthGuard],
  //   data: {
  //     title: 'Dashboard - SendIT',
  //   },
  // },
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