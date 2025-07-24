// src/app/dashboard/user/parcels/send-parcel/send-parcel-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SendParcelLayoutComponent } from './send-parcel-layout.component';

const routes: Routes = [
  {
    path: '',
    component: SendParcelLayoutComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SendParcelRoutingModule {}
