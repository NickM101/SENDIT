// src/app/dashboard/user/parcels/send-parcel/send-parcel.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SendParcelRoutingModule } from './send-parcel-routing.module';

// Components
import { SendParcelLayoutComponent } from './send-parcel-layout.component';
// import { StepProgressComponent } from './components/step-progress/step-progress.component';
// import { StepNavigationComponent } from './components/step-navigation/step-navigation.component';
// import { PriceCalculatorComponent } from './components/price-calculator/price-calculator.component';
// import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, ReactiveFormsModule, SendParcelRoutingModule],
})
export class SendParcelModule {}
