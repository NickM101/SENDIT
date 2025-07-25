import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PickupPointListComponent } from './pickup-point-list.component';

const routes: Routes = [
  {
    path: '',
    component: PickupPointListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PickupPointRoutingModule {}