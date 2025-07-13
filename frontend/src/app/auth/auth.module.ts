// File: src/app/auth/auth.module.ts
// Authentication module for SendIT application

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AuthRoutingModule } from './auth-routing.module';

// Components

// Services
import { AuthService } from './services/auth.service';
import { AuthGuard, GuestGuard } from './services/auth.guard';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    AuthRoutingModule,
  ],
  providers: [AuthService, AuthGuard, GuestGuard],
})
export class AuthModule {}
