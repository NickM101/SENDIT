// src/app/dashboard/admin/users/users.module.ts
import { NgModule } from '@angular/core';

import { SharedModule } from '../../../shared/shared.module';

// Services
import { AuthGuard } from '../../../core/guards/auth.guard';
import { ParcelsRoutingModule } from './parcels-routing.module';

@NgModule({
  declarations: [],
  imports: [SharedModule, ParcelsRoutingModule],
  providers: [AuthGuard],
})
export class ParcelsModule {}
