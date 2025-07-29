// src/app/dashboard/user/parcels/send-parcel/send-parcel-layout/send-parcel-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  SenderData,
  SenderDetailsComponent,
} from './components/sender-details/sender-details.component';
import { SharedModule } from '../../../../shared/shared.module';
import { StepProgressComponent } from './components/step-progress/step-progress.component';
import { RecipientDetailsComponent } from './components/recipient-details/recipient-details.component';
import { RecipientData } from './components/recipient-details/recipient-details.component';
import {
  ParcelData,
  ParcelDetailsComponent,
} from './components/parcel-details/parcel-details.component';
import {
  DeliveryData,
  DeliveryOptionsComponent,
} from './components/delivery-options/delivery-options.component';
import {
  ReviewPaymentData,
  ReviewPaymentComponent,
} from './components/review-payment/review-payment.component';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';

export interface Step {
  id: number;
  label: string;
  icon: string;
  completed: boolean;
  disabled?: boolean;
}

export interface CompleteOrderData {
  trackingNumber: string;
  senderData: SenderData;
  recipientData: RecipientData;
  parcelData: ParcelData;
  deliveryData: DeliveryData;
  paymentData: ReviewPaymentData;
  pricing: any;
  orderDate: Date;
  status: string;
}

@Component({
  selector: 'app-send-parcel-layout',
  templateUrl: './send-parcel-layout.component.html',
  standalone: true,
  imports: [
    SharedModule,
    StepProgressComponent,
    SenderDetailsComponent,
    RecipientDetailsComponent,
    ParcelDetailsComponent,
    DeliveryOptionsComponent,
    ReviewPaymentComponent,
  ],
})
export class SendParcelLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentStep$ = new BehaviorSubject<number>(1);

  // Form data storage
  senderData: SenderData | null = null;
  recipientData: RecipientData | null = null;
  parcelData: ParcelData | null = null;
  deliveryData: DeliveryData | null = null;
  reviewPaymentData: ReviewPaymentData | null = null;
  orderCompleted = false;
  generatedTrackingNumber: string | null = null;
  completeOrderData: CompleteOrderData | null = null;

  steps: Step[] = [
    { id: 1, label: 'Sender Details', icon: 'user', completed: false },
    { id: 2, label: 'Recipient Details', icon: 'map-pin', completed: false },
    { id: 3, label: 'Parcel Details', icon: 'package', completed: false },
    { id: 4, label: 'Delivery Options', icon: 'truck', completed: false },
    { id: 5, label: 'Review & Payment', icon: 'credit-card', completed: false },
  ];

  // Main form
  mainForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService
  ) {
    this.initializeMainForm();
  }

  ngOnInit() {
    // Component initialization
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeMainForm() {
    this.mainForm = this.fb.group({
      sender: this.fb.group({}),
      recipient: this.fb.group({}),
      parcel: this.fb.group({}),
      delivery: this.fb.group({}),
      payment: this.fb.group({}),
    });
  }

  onStepChange(stepNumber: number) {
    if (this.canNavigateToStep(stepNumber)) {
      console.log('Navigating to step:', stepNumber);
      this.saveCurrentStepData();

      this.currentStep$.next(stepNumber);
    }
  }

  private saveCurrentStepData() {
    const currentStep = this.currentStep$.value;

    // The data is already being saved through the dataChange event handlers,
    // but we can add additional validation here if needed
    switch (currentStep) {
      case 1:
        // Ensure sender data is saved
        if (!this.senderData) {
          console.warn('No sender data to save');
        }
        break;
      case 2:
        // Ensure recipient data is saved
        if (!this.recipientData) {
          console.warn('No recipient data to save');
        }
        break;
      // Add similar checks for other steps if needed
    }
  }

  private canNavigateToStep(stepNumber: number): boolean {
    // Allow navigation to previous completed steps or next logical step
    const currentStep = this.currentStep$.value;

    if (stepNumber <= currentStep) return true;
    if (stepNumber === currentStep + 1 && this.canProceedFromStep(currentStep))
      return true;

    return false;
  }

  nextStep() {
    const current = this.currentStep$.value;
    if (current < 5 && this.canProceedFromCurrentStep()) {
      this.markStepComplete(current);
      this.currentStep$.next(current + 1);
    }
  }

  previousStep() {
    const current = this.currentStep$.value;
    if (current > 1) {
      this.currentStep$.next(current - 1);
    }
  }

  private canProceedFromCurrentStep(): boolean {
    const current = this.currentStep$.value;
    return this.canProceedFromStep(current);
  }

  private canProceedFromStep(stepNumber: number): boolean {
    switch (stepNumber) {
      case 1:
        return !!this.senderData;
      case 2:
        return !!this.recipientData;
      case 3:
        return !!this.parcelData;
      case 4:
        return !!this.deliveryData;
      case 5:
        return !!this.reviewPaymentData || this.orderCompleted;
      default:
        return true;
    }
  }

  markStepComplete(stepId: number) {
    const step = this.steps.find((s) => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }

  // Step 1 event handlers
  onSenderStepComplete(senderData: SenderData) {
    console.log('✅ Sender step completed:', senderData);
    this.senderData = senderData;
    this.markStepComplete(1);
    this.nextStep();
  }

  onSenderDataChange(senderData: SenderData) {
    console.log('📝 Sender data changed:', senderData);
    this.senderData = senderData;
  }

  // Step 2 event handlers
  onRecipientStepComplete(recipientData: RecipientData) {
    console.log('✅ Recipient step completed:', recipientData);
    this.recipientData = recipientData;
    this.markStepComplete(2);
    this.nextStep();
  }

  onRecipientDataChange(recipientData: RecipientData) {
    console.log('📝 Recipient data changed:', recipientData);
    this.recipientData = recipientData;
  }

  // Step 3 event handlers
  onParcelStepComplete(parcelData: ParcelData) {
    console.log('✅ Parcel step completed:', parcelData);
    this.parcelData = parcelData;
    this.markStepComplete(3);
    this.nextStep();
  }

  onParcelDataChange(parcelData: ParcelData) {
    console.log('📝 Parcel data changed:', parcelData);
    this.parcelData = parcelData;
  }

  // Step 4 event handlers
  onDeliveryStepComplete(deliveryData: DeliveryData) {
    console.log('✅ Delivery step completed:', deliveryData);
    this.deliveryData = deliveryData;
    this.markStepComplete(4);
    this.nextStep();
  }

  onDeliveryDataChange(deliveryData: DeliveryData) {
    console.log('📝 Delivery data changed:', deliveryData);
    this.deliveryData = deliveryData;
  }

  // Step 5 event handlers
  onReviewPaymentStepComplete(reviewPaymentData: any) {
    console.log('🎉 Order completed:', reviewPaymentData);
    this.reviewPaymentData = reviewPaymentData;
    this.orderCompleted = true;
    this.generatedTrackingNumber = reviewPaymentData.trackingNumber;
    this.markStepComplete(5);

    // Create complete order data for API
    this.completeOrderData = {
      trackingNumber: this.generatedTrackingNumber!,
      senderData: this.senderData!,
      recipientData: this.recipientData!,
      parcelData: this.parcelData!,
      deliveryData: this.deliveryData!,
      paymentData: reviewPaymentData,
      pricing: reviewPaymentData.pricing,
      orderDate: new Date(),
      status: 'PROCESSING',
    };

    this.showOrderConfirmation();
  }

  onReviewPaymentDataChange(reviewPaymentData: ReviewPaymentData) {
    console.log('📝 Payment data changed:', reviewPaymentData);
    this.reviewPaymentData = reviewPaymentData;
  }

  private showOrderConfirmation() {
    this.toastService.success('Order completed successfully!');
    console.log('🚀 Final API Data:', this.completeOrderData);
  }

  // Price calculation methods for sidebar
  getWeightSurcharge(): number {
    if (!this.parcelData?.weight) return 0;
    const weight = this.parcelData.weight;
    if (weight <= 1) return 0;
    if (weight <= 5) return 250; // KES 250
    if (weight <= 20) return 750; // KES 750
    return 1500; // KES 1500
  }

  getDeliverySpeedSurcharge(): number {
    if (!this.deliveryData?.deliveryType) return 0;
    const surcharges: { [key: string]: number } = {
      EXPRESS: 50,
      SAME_DAY: 100,
      OVERNIGHT: 75,
    };
    return surcharges[this.deliveryData.deliveryType] || 0;
  }

  getInsuranceCost(): number {
    if (!this.parcelData?.insuranceCoverage) return 0;
    const costs: { [key: string]: number } = {
      BASIC_COVERAGE: 125, // KES 125
      PREMIUM_COVERAGE: 375, // KES 375
      CUSTOM_COVERAGE: Math.max(
        250,
        (this.parcelData.estimatedValue || 0) * 0.02
      ),
    };
    return costs[this.parcelData.insuranceCoverage] || 0;
  }

  getTotalEstimate(): number {
    let total = 750; // Base rate KES 750

    if (this.parcelData?.weight) {
      total += this.getWeightSurcharge();
    }

    if (
      this.deliveryData?.deliveryType &&
      this.deliveryData.deliveryType !== 'STANDARD'
    ) {
      total += (total * this.getDeliverySpeedSurcharge()) / 100;
    }

    if (
      this.parcelData?.insuranceCoverage &&
      this.parcelData.insuranceCoverage !== 'NO_INSURANCE'
    ) {
      total += this.getInsuranceCost();
    }

    return Math.round(total);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  resetToFirstStep() {
    // Reset all data
    this.senderData = null;
    this.recipientData = null;
    this.parcelData = null;
    this.deliveryData = null;
    this.reviewPaymentData = null;
    this.orderCompleted = false;
    this.generatedTrackingNumber = null;
    this.completeOrderData = null;

    // Reset steps
    this.steps.forEach((step) => (step.completed = false));
    this.currentStep$.next(1);

    // Reset main form
    this.initializeMainForm();
  }

  getCurrentStepTitle(): string {
    const currentStep = this.currentStep$.value;
    const step = this.steps.find((s) => s.id === currentStep);
    return step?.label || '';
  }

  getCurrentStepDescription(): string {
    const descriptions = {
      1: 'Enter your contact information and pickup address',
      2: 'Specify delivery address and recipient details',
      3: 'Describe your package for accurate pricing',
      4: 'Select delivery speed and special options',
      5: 'Review details and complete payment',
    };

    return (
      descriptions[this.currentStep$.value as keyof typeof descriptions] || ''
    );
  }

  getProgressText(): string {
    const current = this.currentStep$.value;
    const total = this.steps.length;
    const completedSteps = this.steps.filter((s) => s.completed).length;

    return `${completedSteps} of ${total} steps completed`;
  }

  get isCurrentStepValid(): boolean {
    return this.canProceedFromCurrentStep();
  }

  getAllFormData() {
    return {
      sender: this.senderData,
      recipient: this.recipientData,
      parcel: this.parcelData,
      delivery: this.deliveryData,
      payment: this.reviewPaymentData,
    };
  }

  // Navigation methods
  navigateToTrackParcel() {
    if (this.generatedTrackingNumber) {
      this.router.navigate(['/dashboard/user/track-parcel'], {
        queryParams: { tracking: this.generatedTrackingNumber },
      });
    }
  }

  navigateToMyParcels() {
    this.router.navigate(['/dashboard/user/my-parcels']);
  }

  downloadReceipt() {
    // Implementation for downloading receipt
    console.log('Downloading receipt for:', this.generatedTrackingNumber);
    this.toastService.success('Receipt download started');
  }
}
