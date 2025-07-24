// src/app/dashboard/user/parcels/send-parcel/components/review-payment/review-payment.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { SharedModule } from '../../../../../../shared/shared.module';
import { SenderData } from '../sender-details/sender-details.component';
import { RecipientData } from '../recipient-details/recipient-details.component';
import { ParcelData } from '../parcel-details/parcel-details.component';
import { DeliveryData } from '../delivery-options/delivery-options.component';

export interface ReviewPaymentData {
  paymentMethod: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  savePaymentMethod: boolean;
  agreeToTerms: boolean;
  agreeToPrivacyPolicy: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface PaymentMethodOption {
  value: string;
  label: string;
  icon: string;
  description: string;
  processingFee: number;
  features: string[];
}

export interface PricingBreakdown {
  baseRate: number;
  weightSurcharge: number;
  distanceSurcharge: number;
  serviceSurcharge: number;
  specialHandling: number;
  insurance: number;
  deliverySpeed: number;
  processingFee: number;
  subtotal: number;
  tax: number;
  total: number;
}

@Component({
  selector: 'app-review-payment',
  templateUrl: './review-payment.component.html',
  imports: [SharedModule],
})
export class ReviewPaymentComponent implements OnInit, OnDestroy {
  @Input() senderData?: SenderData;
  @Input() recipientData?: RecipientData;
  @Input() parcelData?: ParcelData;
  @Input() deliveryData?: DeliveryData;
  @Output() stepComplete = new EventEmitter<ReviewPaymentData>();
  @Output() dataChange = new EventEmitter<ReviewPaymentData>();

  private destroy$ = new Subject<void>();

  reviewForm!: FormGroup;
  isLoading = false;
  isProcessingPayment = false;
  showEditMode = false;
  activeEditSection: string | null = null;

  // Payment Method Options
  paymentMethods: PaymentMethodOption[] = [
    {
      value: 'CREDIT_CARD',
      label: 'Credit/Debit Card',
      icon: 'credit-card',
      description: 'Visa, MasterCard, American Express',
      processingFee: 0,
      features: ['Instant processing', 'Secure encryption', 'Fraud protection'],
    },
    {
      value: 'PAYPAL',
      label: 'PayPal',
      icon: 'wallet',
      description: 'Pay with your PayPal account',
      processingFee: 0,
      features: [
        'Buyer protection',
        'Quick checkout',
        'No card details needed',
      ],
    },
    {
      value: 'BANK_TRANSFER',
      label: 'Bank Transfer',
      icon: 'building-2',
      description: 'Direct bank transfer',
      processingFee: 2.5,
      features: ['Lower fees', '1-2 business days', 'Secure transfer'],
    },
    {
      value: 'CASH_ON_DELIVERY',
      label: 'Cash on Delivery',
      icon: 'banknote',
      description: 'Pay when package is delivered',
      processingFee: 5.0,
      features: ['Pay on delivery', 'No upfront payment', 'Cash only'],
    },
  ];

  // US States for billing address
  states = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit() {
    this.setupFormWatchers();
    this.prefillBillingAddress();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.reviewForm = this.fb.group({
      paymentMethod: ['CREDIT_CARD', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryDate: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(0[1-9]|1[0-2])\/([0-9]{2})$/),
        ],
      ],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardholderName: ['', [Validators.required, Validators.minLength(2)]],
      billingAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: [
          '',
          [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)],
        ],
        country: ['United States', Validators.required],
      }),
      savePaymentMethod: [false],
      agreeToTerms: [false, Validators.required],
      agreeToPrivacyPolicy: [false, Validators.required],
      emailNotifications: [true],
      smsNotifications: [false],
    });
  }

  private setupFormWatchers() {
    // Watch for form changes and emit data
    this.reviewForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((formData) => {
        this.dataChange.emit(formData);
      });

    // Watch for payment method changes to update form validation
    this.reviewForm
      .get('paymentMethod')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((paymentMethod) => {
        this.updatePaymentValidation(paymentMethod);
      });
  }

  private updatePaymentValidation(paymentMethod: string) {
    const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'];

    if (paymentMethod === 'CREDIT_CARD') {
      // Enable card validation
      cardFields.forEach((field) => {
        this.reviewForm.get(field)?.enable();
      });
    } else {
      // Disable card validation for other payment methods
      cardFields.forEach((field) => {
        this.reviewForm.get(field)?.disable();
        this.reviewForm.get(field)?.clearValidators();
        this.reviewForm.get(field)?.updateValueAndValidity();
      });
    }
  }

  private prefillBillingAddress() {
    if (this.senderData) {
      this.reviewForm.get('billingAddress')?.patchValue({
        street: this.senderData.pickupAddress.street,
        city: this.senderData.pickupAddress.city,
        state: this.senderData.pickupAddress?.state,
        zipCode: this.senderData.pickupAddress?.zipCode,
        country: this.senderData.pickupAddress.country,
      });

      this.reviewForm.patchValue({
        cardholderName: this.senderData.fullName,
      });
    }
  }

  onSelectPaymentMethod(method: PaymentMethodOption) {
    this.reviewForm.patchValue({ paymentMethod: method.value });
  }

  toggleEditSection(section: string) {
    this.activeEditSection =
      this.activeEditSection === section ? null : section;
  }

  // Pricing calculation methods
  calculatePricing(): PricingBreakdown {
    const baseRate = 15.0; // Base shipping rate
    let weightSurcharge = 0;
    let serviceSurcharge = 0;
    let specialHandling = 0;
    let insurance = 0;
    let deliverySpeed = 0;

    // Weight-based pricing
    if (this.parcelData?.weight) {
      const weight = this.parcelData.weight;
      if (weight <= 1) weightSurcharge = 0;
      else if (weight <= 5) weightSurcharge = 10;
      else if (weight <= 20) weightSurcharge = 30;
      else weightSurcharge = 60;
    }

    // Package type surcharges
    if (this.parcelData?.packageType) {
      const surcharges: { [key: string]: number } = {
        FRAGILE: 5,
        LIQUID: 3,
        PERISHABLE: 7,
        ELECTRONICS: 4,
      };
      serviceSurcharge = surcharges[this.parcelData.packageType] || 0;
    }

    // Special handling fees
    if (this.parcelData?.specialHandling) {
      if (this.parcelData.specialHandling.fragile) specialHandling += 5;
      if (this.parcelData.specialHandling.perishable) specialHandling += 10;
      if (this.parcelData.specialHandling.hazardousMaterial)
        specialHandling += 25;
      if (this.parcelData.specialHandling.highValue) specialHandling += 15;
    }

    // Insurance costs
    if (this.parcelData?.insuranceCoverage) {
      const insuranceCosts: { [key: string]: number } = {
        BASIC_COVERAGE: 2.5,
        PREMIUM_COVERAGE: 7.5,
        CUSTOM_COVERAGE: Math.max(
          5,
          (this.parcelData.estimatedValue || 0) * 0.02
        ),
      };
      insurance = insuranceCosts[this.parcelData.insuranceCoverage] || 0;
    }

    // Delivery speed surcharge
    if (this.deliveryData?.deliveryType) {
      const subtotalBeforeSpeed =
        baseRate +
        weightSurcharge +
        serviceSurcharge +
        specialHandling +
        insurance;
      const speedMultipliers: { [key: string]: number } = {
        EXPRESS: 0.5,
        SAME_DAY: 1.0,
        OVERNIGHT: 0.75,
      };
      const multiplier = speedMultipliers[this.deliveryData.deliveryType] || 0;
      deliverySpeed = subtotalBeforeSpeed * multiplier;
    }

    // Payment processing fee
    const paymentMethod = this.reviewForm.get('paymentMethod')?.value;
    const selectedPaymentMethod = this.paymentMethods.find(
      (pm) => pm.value === paymentMethod
    );
    const processingFee = selectedPaymentMethod?.processingFee || 0;

    const subtotal =
      baseRate +
      weightSurcharge +
      serviceSurcharge +
      specialHandling +
      insurance +
      deliverySpeed +
      processingFee;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    return {
      baseRate,
      weightSurcharge,
      distanceSurcharge: 0, // Could be calculated based on distance
      serviceSurcharge,
      specialHandling,
      insurance,
      deliverySpeed,
      processingFee,
      subtotal,
      tax,
      total,
    };
  }

  // Format card number for display
  formatCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  // Mask card number for security
  maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return '';
    return '**** **** **** ' + cardNumber.slice(-4);
  }

  // Generate tracking number
  generateTrackingNumber(): string {
    const prefix = 'ST';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');
    return `${prefix}-${timestamp}${random}`;
  }

  async onCompleteOrder() {
    if (this.reviewForm.valid) {
      this.isProcessingPayment = true;

      try {
        // Simulate payment processing
        await this.processPayment();

        const orderData = {
          ...this.reviewForm.value,
          trackingNumber: this.generateTrackingNumber(),
          senderData: this.senderData,
          recipientData: this.recipientData,
          parcelData: this.parcelData,
          deliveryData: this.deliveryData,
          pricing: this.calculatePricing(),
          orderDate: new Date(),
          status: 'PROCESSING',
        };

        this.stepComplete.emit(orderData);
      } catch (error) {
        console.error('Payment processing failed:', error);
        // Handle payment error
      } finally {
        this.isProcessingPayment = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private async processPayment(): Promise<void> {
    // Simulate API call to payment processor
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.reviewForm.controls).forEach((key) => {
      const control = this.reviewForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach((nestedKey) => {
          control.get(nestedKey)?.markAsTouched();
        });
      }
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string, nestedField?: string): boolean {
    const field = nestedField
      ? this.reviewForm.get(fieldName)?.get(nestedField)
      : this.reviewForm.get(fieldName);

    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string, nestedField?: string): string {
    const field = nestedField
      ? this.reviewForm.get(fieldName)?.get(nestedField)
      : this.reviewForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName, nestedField)} is required`;
      if (field.errors['pattern']) {
        if (fieldName === 'cardNumber')
          return 'Please enter a valid 16-digit card number';
        if (fieldName === 'expiryDate')
          return 'Please enter date in MM/YY format';
        if (fieldName === 'cvv') return 'Please enter a valid CVV';
        if (nestedField === 'zipCode') return 'Please enter a valid ZIP code';
      }
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName, nestedField)} is too short`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string, nestedField?: string): string {
    const labels: { [key: string]: string } = {
      paymentMethod: 'Payment method',
      cardNumber: 'Card number',
      expiryDate: 'Expiry date',
      cvv: 'CVV',
      cardholderName: 'Cardholder name',
      street: 'Street address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP code',
      agreeToTerms: 'Terms acceptance',
      agreeToPrivacyPolicy: 'Privacy policy acceptance',
    };

    return labels[nestedField || fieldName] || fieldName;
  }

  get isFormValid(): boolean {
    return this.reviewForm.valid;
  }

  get selectedPaymentMethod(): PaymentMethodOption | undefined {
    const selectedValue = this.reviewForm.get('paymentMethod')?.value;
    return this.paymentMethods.find((pm) => pm.value === selectedValue);
  }

  get requiresCardDetails(): boolean {
    return this.reviewForm.get('paymentMethod')?.value === 'CREDIT_CARD';
  }

  get totalCost(): number {
    return this.calculatePricing().total;
  }
}
