// src/app/dashboard/user/parcels/send-parcel/components/delivery-options/delivery-options.component.ts

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

export interface DeliveryData {
  deliveryType: string;
  pickupDate: string;
  pickupTime: string;
  estimatedDelivery: string;
  deliveryPreferences: {
    signatureRequired: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    contactlessDelivery: boolean;
  };
  backupDeliveryOptions: {
    retryDeliveryNextBusinessDay: boolean;
    leaveWithTrustedNeighbor: boolean;
    holdAtNearestPickupPoint: boolean;
    returnToSender: boolean;
  };
  specialDeliveryInstructions: string;
}

export interface DeliveryOption {
  value: string;
  label: string;
  icon: string;
  description: string;
  estimatedDays: string;
  surcharge: number;
  features: string[];
  availability: string;
  cutoffTime: string;
}

export interface PickupPoint {
  id: string;
  name: string;
  type: string;
  address: string;
  distance: string;
  hours: string;
  services: string[];
  rating: number;
}

@Component({
  selector: 'app-delivery-options',
  templateUrl: './delivery-options.component.html',
  imports: [SharedModule],
})
export class DeliveryOptionsComponent implements OnInit, OnDestroy {
  @Input() parentForm?: FormGroup;
  @Output() stepComplete = new EventEmitter<DeliveryData>();
  @Output() dataChange = new EventEmitter<DeliveryData>();

  private destroy$ = new Subject<void>();

  deliveryForm!: FormGroup;
  isLoading = false;
  showPickupPoints = false;
  showAdvancedOptions = false;
  minPickupDate!: string;
  maxPickupDate!: string;

  // Delivery Type Options based on schema enum
  deliveryOptions: DeliveryOption[] = [
    {
      value: 'STANDARD',
      label: 'Standard Delivery',
      icon: 'truck',
      description: '3-5 business days',
      estimatedDays: '3-5 business days',
      surcharge: 0,
      features: ['Basic tracking', 'Email notifications', 'Standard handling'],
      availability: 'Available for all destinations',
      cutoffTime: '5:00 PM',
    },
    {
      value: 'EXPRESS',
      label: 'Express Delivery',
      icon: 'zap',
      description: '1-2 business days',
      estimatedDays: '1-2 business days',
      surcharge: 0.5, // 50% surcharge
      features: [
        'Priority handling',
        'Real-time tracking',
        'SMS notifications',
        'Signature required',
      ],
      availability: 'Available to major cities',
      cutoffTime: '3:00 PM',
    },
    {
      value: 'SAME_DAY',
      label: 'Same Day Delivery',
      icon: 'clock',
      description: 'Within 4-6 hours',
      estimatedDays: 'Same day',
      surcharge: 1.0, // 100% surcharge
      features: [
        'Immediate pickup',
        'Live tracking',
        'SMS updates',
        'Photo confirmation',
      ],
      availability: 'Available in select cities only',
      cutoffTime: '12:00 PM',
    },
    {
      value: 'OVERNIGHT',
      label: 'Overnight Delivery',
      icon: 'moon',
      description: 'Next business day by 10:30 AM',
      estimatedDays: 'Next business day',
      surcharge: 0.75, // 75% surcharge
      features: [
        'Next-day guarantee',
        'Morning delivery',
        'Signature required',
        'Priority handling',
      ],
      availability: 'Available to most destinations',
      cutoffTime: '2:00 PM',
    },
  ];

  // Time Slots for pickup
  timeSlots = [
    { value: '08:00-10:00', label: '8:00 AM - 10:00 AM' },
    { value: '10:00-12:00', label: '10:00 AM - 12:00 PM' },
    { value: '12:00-14:00', label: '12:00 PM - 2:00 PM' },
    { value: '14:00-16:00', label: '2:00 PM - 4:00 PM' },
    { value: '16:00-18:00', label: '4:00 PM - 6:00 PM' },
    { value: '18:00-20:00', label: '6:00 PM - 8:00 PM' },
  ];

  // Mock pickup points data
  nearestPickupPoints: PickupPoint[] = [
    {
      id: '1',
      name: 'SendIT Hub - Downtown',
      type: 'SendIT Center',
      address: '123 Main St, Downtown',
      distance: '0.8 km',
      hours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM',
      services: ['Package pickup', 'Returns', 'Customer service'],
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Corner Store Plus',
      type: 'Partner Location',
      address: '456 Oak Avenue, Midtown',
      distance: '1.2 km',
      hours: 'Daily: 7AM-11PM',
      services: ['Package pickup', 'Basic packaging supplies'],
      rating: 4.5,
    },
    {
      id: '3',
      name: 'City Mall Pickup Point',
      type: 'Mall Locker',
      address: '789 Shopping Blvd, City Mall',
      distance: '2.1 km',
      hours: 'Mall hours: 10AM-10PM',
      services: ['24/7 locker access', 'Package pickup'],
      rating: 4.3,
    },
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
    this.setDateLimits();
  }

  ngOnInit() {
    this.setupFormWatchers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.deliveryForm = this.fb.group({
      deliveryType: ['STANDARD', Validators.required],
      pickupDate: ['', Validators.required],
      pickupTime: ['', Validators.required],
      estimatedDelivery: [{ value: '', disabled: true }],
      deliveryPreferences: this.fb.group({
        signatureRequired: [false],
        emailNotifications: [true],
        smsNotifications: [false],
        contactlessDelivery: [false],
      }),
      backupDeliveryOptions: this.fb.group({
        retryDeliveryNextBusinessDay: [true],
        leaveWithTrustedNeighbor: [false],
        holdAtNearestPickupPoint: [false],
        returnToSender: [false],
      }),
      specialDeliveryInstructions: [''],
    });
  }

  private setDateLimits() {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30); // 30 days from today

    this.minPickupDate = today.toISOString().split('T')[0];
    this.maxPickupDate = maxDate.toISOString().split('T')[0];

    // Set default pickup date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    this.deliveryForm.patchValue({
      pickupDate: tomorrow.toISOString().split('T')[0],
    });
  }

  private setupFormWatchers() {
    // Watch for form changes and emit data
    this.deliveryForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((formData) => {
        this.dataChange.emit(formData);
      });

    // Watch for delivery type changes to update estimated delivery
    this.deliveryForm
      .get('deliveryType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((deliveryType) => {
        this.updateEstimatedDelivery();
        this.updateDeliveryPreferences(deliveryType);
      });

    // Watch for pickup date changes to update estimated delivery
    this.deliveryForm
      .get('pickupDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateEstimatedDelivery();
      });
  }

  private updateEstimatedDelivery() {
    const deliveryType = this.deliveryForm.get('deliveryType')?.value;
    const pickupDate = this.deliveryForm.get('pickupDate')?.value;

    if (!deliveryType || !pickupDate) return;

    const pickup = new Date(pickupDate);
    let estimatedDelivery = new Date(pickup);

    switch (deliveryType) {
      case 'SAME_DAY':
        estimatedDelivery = new Date(pickup);
        break;
      case 'OVERNIGHT':
        estimatedDelivery.setDate(pickup.getDate() + 1);
        break;
      case 'EXPRESS':
        estimatedDelivery.setDate(pickup.getDate() + 2);
        break;
      case 'STANDARD':
        estimatedDelivery.setDate(pickup.getDate() + 4);
        break;
    }

    // Skip weekends for business days calculation
    while (
      estimatedDelivery.getDay() === 0 ||
      estimatedDelivery.getDay() === 6
    ) {
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
    }

    this.deliveryForm.patchValue(
      {
        estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
      },
      { emitEvent: false }
    );
  }

  private updateDeliveryPreferences(deliveryType: string) {
    const preferences = this.deliveryForm.get(
      'deliveryPreferences'
    ) as FormGroup;

    // Auto-set preferences based on delivery type
    switch (deliveryType) {
      case 'EXPRESS':
      case 'OVERNIGHT':
        preferences.patchValue(
          {
            signatureRequired: true,
            smsNotifications: true,
          },
          { emitEvent: false }
        );
        break;
      case 'SAME_DAY':
        preferences.patchValue(
          {
            signatureRequired: true,
            smsNotifications: true,
            contactlessDelivery: false,
          },
          { emitEvent: false }
        );
        break;
    }
  }

  onSelectDeliveryOption(option: DeliveryOption) {
    this.deliveryForm.patchValue({ deliveryType: option.value });
  }

  togglePickupPoints() {
    this.showPickupPoints = !this.showPickupPoints;
  }

  toggleAdvancedOptions() {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  onSelectPickupPoint(pickupPoint: PickupPoint) {
    // This would typically update the delivery address or add special instructions
    const currentInstructions =
      this.deliveryForm.get('specialDeliveryInstructions')?.value || '';
    const pickupInstruction = `\nAlternative pickup at: ${pickupPoint.name}, ${pickupPoint.address}`;

    this.deliveryForm.patchValue({
      specialDeliveryInstructions: currentInstructions + pickupInstruction,
    });

    this.showPickupPoints = false;
  }

  calculateDeliverySurcharge(): number {
    const deliveryType = this.deliveryForm.get('deliveryType')?.value;
    const selectedOption = this.deliveryOptions.find(
      (opt) => opt.value === deliveryType
    );
    return selectedOption?.surcharge || 0;
  }

  getEstimatedDeliveryDate(): string {
    const estimatedDelivery = this.deliveryForm.get('estimatedDelivery')?.value;
    if (!estimatedDelivery) return '';

    const date = new Date(estimatedDelivery);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  isPickupDateValid(): boolean {
    const pickupDate = this.deliveryForm.get('pickupDate')?.value;
    const deliveryType = this.deliveryForm.get('deliveryType')?.value;

    if (!pickupDate) return false;

    const pickup = new Date(pickupDate);
    const today = new Date();
    const cutoffTime = this.getCutoffTime(deliveryType);
    const currentTime = new Date().getHours();

    // Check if pickup is today and past cutoff time
    if (
      pickup.toDateString() === today.toDateString() &&
      currentTime >= cutoffTime
    ) {
      return false;
    }

    return true;
  }

  private getCutoffTime(deliveryType: string): number {
    const option = this.deliveryOptions.find(
      (opt) => opt.value === deliveryType
    );
    const cutoffStr = option?.cutoffTime || '17:00';
    return parseInt(cutoffStr.split(':')[0]);
  }

  onValidateForm() {
    if (this.deliveryForm.valid && this.isPickupDateValid()) {
      this.stepComplete.emit(this.deliveryForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.deliveryForm.controls).forEach((key) => {
      const control = this.deliveryForm.get(key);
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
      ? this.deliveryForm.get(fieldName)?.get(nestedField)
      : this.deliveryForm.get(fieldName);

    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string, nestedField?: string): string {
    const field = nestedField
      ? this.deliveryForm.get(fieldName)?.get(nestedField)
      : this.deliveryForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName, nestedField)} is required`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string, nestedField?: string): string {
    const labels: { [key: string]: string } = {
      deliveryType: 'Delivery type',
      pickupDate: 'Pickup date',
      pickupTime: 'Pickup time',
    };

    return labels[nestedField || fieldName] || fieldName;
  }

  get isFormValid(): boolean {
    return this.deliveryForm.valid && this.isPickupDateValid();
  }

  get selectedDeliveryOption(): DeliveryOption | undefined {
    const selectedValue = this.deliveryForm.get('deliveryType')?.value;
    return this.deliveryOptions.find((opt) => opt.value === selectedValue);
  }

  get isExpressOrFaster(): boolean {
    const deliveryType = this.deliveryForm.get('deliveryType')?.value;
    return ['EXPRESS', 'SAME_DAY', 'OVERNIGHT'].includes(deliveryType);
  }
}
