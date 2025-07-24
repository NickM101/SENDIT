// src/app/dashboard/user/parcels/send-parcel/send-parcel-layout/send-parcel-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { SenderData, SenderDetailsComponent } from './components/sender-details/sender-details.component';
import { SharedModule } from '../../../../shared/shared.module';
import { StepProgressComponent } from "./components/step-progress/step-progress.component";
import { RecipientDetailsComponent } from "./components/recipient-details/recipient-details.component";

import { RecipientData } from './components/recipient-details/recipient-details.component';
import { ParcelData, ParcelDetailsComponent } from './components/parcel-details/parcel-details.component';
import { DeliveryData, DeliveryOptionsComponent } from './components/delivery-options/delivery-options.component';
import { ReviewPaymentData, ReviewPaymentComponent } from './components/review-payment/review-payment.component';

export interface Step {
  id: number;
  label: string;
  icon: string;
  completed: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-send-parcel-layout',
  templateUrl: './send-parcel-layout.component.html',
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

  steps: Step[] = [
    { id: 1, label: 'Sender Details', icon: 'user', completed: false },
    { id: 2, label: 'Recipient Details', icon: 'map-pin', completed: false },
    { id: 3, label: 'Parcel Details', icon: 'package', completed: false },
    { id: 4, label: 'Delivery Options', icon: 'truck', completed: false },
    { id: 5, label: 'Review & Payment', icon: 'credit-card', completed: false },
  ];

  // Main form
  mainForm!: FormGroup;

  constructor(private fb: FormBuilder) {
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
    console.log('Navigating to step:', stepNumber);
    this.currentStep$.next(stepNumber);
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

    switch (current) {
      case 1:
        return !!this.senderData;
      case 2:
        return !!this.recipientData;
      case 3:
        return !!this.parcelData;
      case 4:
        return !!this.deliveryData;
      case 5:
        return !!this.reviewPaymentData || this.orderCompleted; // Add this validation
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
    console.log('Sender step completed:', senderData);
    this.senderData = senderData;
    this.markStepComplete(1);
    // Auto-advance to next step
    this.nextStep();
  }

  onSenderDataChange(senderData: SenderData) {
    console.log('Sender data changed:', senderData);
    this.senderData = senderData;
  }

  // Step 2 event handlers
  onRecipientStepComplete(recipientData: RecipientData) {
    console.log('Recipient step completed:', recipientData);
    this.recipientData = recipientData;
    this.markStepComplete(2);
    // Auto-advance to next step
    this.nextStep();
  }

  onRecipientDataChange(recipientData: RecipientData) {
    console.log('Recipient data changed:', recipientData);
    this.recipientData = recipientData;
  }

  // Step 3 event handlers
  onParcelStepComplete(parcelData: ParcelData) {
    console.log('Parcel step completed:', parcelData);
    this.parcelData = parcelData;
    this.markStepComplete(3);
    // Auto-advance to next step
    this.nextStep();
  }

  onParcelDataChange(parcelData: ParcelData) {
    console.log('Parcel data changed:', parcelData);
    this.parcelData = parcelData;
  }

  // Step 4 event handlers
  onDeliveryStepComplete(deliveryData: DeliveryData) {
    console.log('Delivery step completed:', deliveryData);
    this.deliveryData = deliveryData;
    this.markStepComplete(4);
    // Auto-advance to next step
    this.nextStep();
  }

  onDeliveryDataChange(deliveryData: DeliveryData) {
    console.log('Delivery data changed:', deliveryData);
    this.deliveryData = deliveryData;
  }

  // Step 5 event handlers
  onReviewPaymentStepComplete(reviewPaymentData: any) {
    console.log('Order completed:', reviewPaymentData);
    this.reviewPaymentData = reviewPaymentData;
    this.orderCompleted = true;
    this.generatedTrackingNumber = reviewPaymentData.trackingNumber;
    this.markStepComplete(5);

    // Show success message or redirect to confirmation page
    this.showOrderConfirmation();
  }

  onReviewPaymentDataChange(reviewPaymentData: ReviewPaymentData) {
    console.log('Payment data changed:', reviewPaymentData);
    this.reviewPaymentData = reviewPaymentData;
  }

  private showOrderConfirmation() {
    // You can implement order confirmation logic here
    console.log('Order completed successfully!');
    console.log('Tracking Number:', this.generatedTrackingNumber);

    // Option 1: Show success modal
    // this.showSuccessModal();

    // Option 2: Navigate to confirmation page
    // this.router.navigate(['/dashboard/user/parcels/confirmation'], {
    //   queryParams: { trackingNumber: this.generatedTrackingNumber }
    // });

    // Option 3: Reset form for new order
    // this.resetFormAfterDelay();
  }

  private resetFormAfterDelay() {
    // Reset form after showing success for a few seconds
    setTimeout(() => {
      this.resetToFirstStep();
    }, 3000);
  }

  // Price calculation methods for sidebar
  getWeightSurcharge(): string {
    if (!this.parcelData?.weight) return '0.00';
    const weight = this.parcelData.weight;
    if (weight <= 1) return '0.00';
    if (weight <= 5) return '10.00';
    if (weight <= 20) return '30.00';
    return '60.00';
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

  getInsuranceCost(): string {
    if (!this.parcelData?.insuranceCoverage) return '0.00';
    const costs: { [key: string]: number } = {
      BASIC_COVERAGE: 2.5,
      PREMIUM_COVERAGE: 7.5,
      CUSTOM_COVERAGE: Math.max(
        5,
        (this.parcelData.estimatedValue || 0) * 0.02
      ),
    };
    return (costs[this.parcelData.insuranceCoverage] || 0).toFixed(2);
  }

  getTotalEstimate(): string {
    let total = 15.0; // Base rate

    if (this.parcelData?.weight) {
      total += parseFloat(this.getWeightSurcharge());
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
      total += parseFloat(this.getInsuranceCost());
    }

    return total.toFixed(2);
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
    };
  }
}
