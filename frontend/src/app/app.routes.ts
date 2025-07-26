import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { DashboardLayoutComponent } from './dashboard/dashboard-layout.component';
import { UserListComponent } from './dashboard/admin/users/components/user-list/user-list.component';
import { LandingPageComponent } from './layouts/landing-page/landing-page.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { EmailVerificationComponent } from './auth/components/email-verification/email-verification.component';
import { ForgotPasswordComponent } from './auth/components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/components/reset-password/reset-password.component';
import { SendParcelLayoutComponent } from './dashboard/user/parcels/send-parcel/send-parcel-layout.component';
import { PickupPointModule } from './dashboard/admin/pickup-points/pickup-point.module';
import { MyParcelsComponent } from './dashboard/user/parcels/my-parcels/my-parcels.component';
import { TrackParcelComponent } from './dashboard/user/tracking/track-parcel.component';

export const routes: Routes = [
  // Public landing page
  {
    path: '',
    component: LandingPageComponent,
    data: {
      title: 'Landing Page - SendIT',
      description: 'Welcome to SendIT, your reliable parcel delivery service',
    },
  },

  // Auth pages (login, register, etc.)
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [GuestGuard],
    children: [
      {
        path: 'login',
        component: LoginComponent,
        data: {
          title: 'Login - SendIT',
          description: 'Sign in to your SendIT account',
        },
      },
      {
        path: 'register',
        component: RegisterComponent,
        data: {
          title: 'Create Account - SendIT',
          description: 'Join SendIT and start shipping with confidence',
        },
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        data: {
          title: 'Reset Password - SendIT',
          description: 'Reset your SendIT account password',
        },
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        data: {
          title: 'Create New Password - SendIT',
          description: 'Create a new password for your SendIT account',
        },
      },
      {
        path: 'verify-email/:token',
        component: EmailVerificationComponent,
        data: {
          title: 'Email Verification - SendIT',
          description: 'Verify your email address to complete registration',
        },
      },
    ],
  },
  {
    path: 'dashboard/admin',
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    component: DashboardLayoutComponent,
    children: [
      {
        path: 'users',
        component: UserListComponent,
      },
      {
        path: 'pickup-point',
        component: PickupPointModule,
      },
    ],
  },
  {
    path: 'dashboard/user',
    canActivate: [AuthGuard],
    data: { roles: ['USER'] },
    component: DashboardLayoutComponent,
    children: [
      {
        path: 'send-parcel',
        component: SendParcelLayoutComponent,
      },
      {
        path: 'my-parcels',
        component: MyParcelsComponent,
      },
      {
        path: 'track-parcel',
        component: TrackParcelComponent,
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
