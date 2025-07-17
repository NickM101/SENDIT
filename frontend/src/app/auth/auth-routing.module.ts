// File: src/app/auth/auth-routing.module.ts
// Authentication routing module for SendIT application

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { EmailVerificationComponent } from './components/email-verification/email-verification.component';
import { AuthLayoutComponent } from '../layouts/auth-layout/auth-layout.component'; // Import the new layout component

const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent, // Use AuthLayoutComponent as the parent
    children: [
      {
        path: 'login',
        component: LoginComponent,
        // canActivate: [GuestGuard],
        data: {
          title: 'Login - SendIT',
          description: 'Sign in to your SendIT account',
        },
      },
      {
        path: 'register',
        component: RegisterComponent,
        // canActivate: [GuestGuard],
        data: {
          title: 'Create Account - SendIT',
          description: 'Join SendIT and start shipping with confidence',
        },
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        // canActivate: [GuestGuard],
        data: {
          title: 'Reset Password - SendIT',
          description: 'Reset your SendIT account password',
        },
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        // canActivate: [GuestGuard],
        data: {
          title: 'Create New Password - SendIT',
          description: 'Create a new password for your SendIT account',
        },
      },
      {
        path: 'verify-email',
        component: EmailVerificationComponent,
        data: {
          title: 'Email Verification - SendIT',
          description: 'Verify your email address to complete registration',
        },
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
