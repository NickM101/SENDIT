import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// src/app/dashboard/user/parcels/parcels-routing.module.ts
const routes: Routes = [
  // ... existing routes
  {
    path: 'send-parcel',
    loadChildren: () =>
      import('./send-parcel/send-parcel.module').then(
        (m) => m.SendParcelModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParcelsRoutingModule {}