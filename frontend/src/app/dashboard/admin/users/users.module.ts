// src/app/dashboard/admin/users/users.module.ts
import { NgModule } from '@angular/core';

import { SharedModule } from '../../../shared/shared.module';

// Services
import { UserService } from './services/user.service';
import { UsersRoutingModule } from './users-routing.module';
import { AuthGuard } from '../../../core/guards/auth.guard';

@NgModule({
  declarations: [],
  imports: [SharedModule, UsersRoutingModule],
  providers: [UserService, AuthGuard],
})
export class UsersModule {}
