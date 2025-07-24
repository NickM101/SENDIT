// src/app/dashboard/user/parcels/send-parcel/components/price-calculator/price-calculator.component.ts
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SenderData } from '../sender-details/sender-details.component';
import { SharedModule } from '../../../../../../shared/shared.module';

interface PricingData {
  baseRate: number;
  weightSurcharge: number;
  distanceSurcharge: number;
  serviceSurcharge: number;
  totalPrice: number;
}

@Component({
  selector: 'app-price-calculator',
  templateUrl: './price-calculator.component.html',
  imports: [SharedModule]
})
export class PriceCalculatorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() senderData: SenderData | null = null;
  @Input() currentStep: number = 1;

  private destroy$ = new Subject<void>();

  pricing: PricingData = {
    baseRate: 8.5,
    weightSurcharge: 0,
    distanceSurcharge: 0,
    serviceSurcharge: 0,
    totalPrice: 8.5,
  };

  // Display data
  weight = 0;
  distance = 0;
  serviceType = 'Not selected';

  // Step completion status
  stepStatus = {
    sender: false,
    recipient: false,
    parcel: false,
    delivery: false,
  };

  ngOnInit() {
    this.updatePricing();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['senderData'] || changes['currentStep']) {
      this.updateStepStatus();
      this.updatePricing();
    }
  }

  private updateStepStatus() {
    this.stepStatus.sender = !!this.senderData;
    // Add other step status updates as we implement them
  }

  private updatePricing() {
    // Basic pricing calculation
    let total = this.pricing.baseRate;

    // Add weight-based pricing when parcel data is available
    if (this.weight > 0) {
      if (this.weight <= 1) {
        this.pricing.weightSurcharge = 0;
      } else if (this.weight <= 5) {
        this.pricing.weightSurcharge = 5.0;
      } else if (this.weight <= 20) {
        this.pricing.weightSurcharge = 15.0;
      } else {
        this.pricing.weightSurcharge = 30.0;
      }
      total += this.pricing.weightSurcharge;
    }

    // Add distance-based pricing when addresses are available
    if (this.distance > 0) {
      if (this.distance <= 10) {
        this.pricing.distanceSurcharge = 0;
      } else if (this.distance <= 50) {
        this.pricing.distanceSurcharge = 3.0;
      } else if (this.distance <= 100) {
        this.pricing.distanceSurcharge = 8.0;
      } else {
        this.pricing.distanceSurcharge = 15.0;
      }
      total += this.pricing.distanceSurcharge;
    }

    // Add service-based pricing
    if (this.serviceType === 'EXPRESS') {
      this.pricing.serviceSurcharge = total * 0.5; // 50% surcharge
      total += this.pricing.serviceSurcharge;
    } else if (this.serviceType === 'SAME_DAY') {
      this.pricing.serviceSurcharge = total * 1.0; // 100% surcharge
      total += this.pricing.serviceSurcharge;
    }

    this.pricing.totalPrice = Math.round(total * 100) / 100;
  }

  getCompletionPercentage(): number {
    const completed = Object.values(this.stepStatus).filter(
      (status) => status
    ).length;
    const total = Object.keys(this.stepStatus).length;
    return Math.round((completed / total) * 100);
  }

  getStepStatusIcon(stepName: keyof typeof this.stepStatus): string {
    return this.stepStatus[stepName] ? 'check-circle' : 'circle';
  }

  getStepStatusClass(stepName: keyof typeof this.stepStatus): string {
    return this.stepStatus[stepName]
      ? 'text-green-500 dark:text-green-400'
      : 'text-gray-400 dark:text-gray-500';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
