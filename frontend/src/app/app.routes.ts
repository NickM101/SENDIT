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
import { MyParcelsComponent } from './dashboard/user/parcels/my-parcels/my-parcels.component';
import { TrackParcelComponent } from './dashboard/user/tracking/track-parcel.component';
import { ProfilePageComponent } from './dashboard/shared-features/profile/profile-page.component';
import { SettingsComponent } from './dashboard/shared-features/settings/settings.component';
import { AccountSettingsComponent } from './dashboard/shared-features/profile/components/account-settings/account-settings.component';
import { NotificationPreferencesComponent } from './dashboard/shared-features/settings/components/notification-preferences/notification-preferences.component';
import { PreferencesComponent } from './dashboard/shared-features/settings/components/preferences/preferences.component';
import { SecuritySettingsComponent } from './dashboard/shared-features/settings/components/security-settings/security-settings.component';
import { UserCreateComponent } from './dashboard/admin/users/components/user-create/user-create.component';
import { UserDetailsComponent } from './dashboard/admin/users/components/user-details/user-details.component';
import { UserEditComponent } from './dashboard/admin/users/components/user-edit/user-edit.component';
import { PickupPointListComponent } from './dashboard/admin/pickup-points/pickup-point-list.component';
import { PickupPointCreateComponent } from './dashboard/admin/pickup-points/components/pickup-point-create/pickup-point-create.component';
import { PickupPointViewComponent } from './dashboard/admin/pickup-points/components/pickup-point-view/pickup-point-view.component';

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
        path: 'users/create',
        component: UserCreateComponent,
      },
      {
        path: 'users/:id',
        component: UserDetailsComponent,
      },
      {
        path: 'users/:id/edit',
        component: UserEditComponent,
      },

      {
        path: 'pickup-point',
        component: PickupPointListComponent,
      },
      {
        path: 'pickup-point/create',
        component: PickupPointCreateComponent,
      },
      {
        path: 'pickup-point/:id/edit',
        component: PickupPointCreateComponent,
      },
      {
        path: 'pickup-point/:id',
        component: PickupPointViewComponent,
      },
      {
        path: 'profile',
        component: ProfilePageComponent,
      },
      {
        path: 'track-parcel',
        component: TrackParcelComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
        children: [
          { path: '', redirectTo: 'account', pathMatch: 'full' },
          { path: 'account', component: AccountSettingsComponent },
          {
            path: 'notifications',
            component: NotificationPreferencesComponent,
          },
          // { path: 'privacy', component: PrivacySettingsComponent },
          { path: 'security', component: SecuritySettingsComponent },
          // { path: 'billing', component: BillingSettingsComponent },
          { path: 'preferences', component: PreferencesComponent },
        ],
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
      {
        path: 'pickup-point',
        component: PickupPointListComponent,
      },
      {
        path: 'profile',
        component: ProfilePageComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
        children: [
          { path: '', redirectTo: 'account', pathMatch: 'full' },
          { path: 'account', component: AccountSettingsComponent },
          {
            path: 'notifications',
            component: NotificationPreferencesComponent,
          },
          // { path: 'privacy', component: PrivacySettingsComponent },
          { path: 'security', component: SecuritySettingsComponent },
          // { path: 'billing', component: BillingSettingsComponent },
          { path: 'preferences', component: PreferencesComponent },
        ],
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
