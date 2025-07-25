// src/app/dashboard/admin/users/users.module.ts
import { NgModule } from '@angular/core';

import { SharedModule } from '../../../shared/shared.module';

// Services
import { AuthGuard } from '../../../core/guards/auth.guard';
import { PickupPointRoutingModule } from './pickup-point-routing.module';

@NgModule({
  declarations: [],
  imports: [SharedModule, PickupPointRoutingModule],
  providers: [AuthGuard],
})
export class PickupPointModule {}
