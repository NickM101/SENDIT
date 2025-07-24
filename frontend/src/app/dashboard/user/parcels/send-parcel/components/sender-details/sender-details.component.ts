// src/app/dashboard/user/parcels/send-parcel/components/sender-details/sender-details.component.ts
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

export interface SenderData {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  pickupInstructions?: string;
  useProfileAddress: boolean;
}

@Component({
  selector: 'app-sender-details',
  templateUrl: './sender-details.component.html',
  imports: [SharedModule]
})
export class SenderDetailsComponent implements OnInit, OnDestroy {
  @Input() parentForm?: FormGroup;
  @Output() stepComplete = new EventEmitter<SenderData>();
  @Output() dataChange = new EventEmitter<SenderData>();

  private destroy$ = new Subject<void>();

  senderForm!: FormGroup;
  isLoading = false;
  showAddressMap = false;

  // Mock user profile data (this would come from a service)
  userProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: {
      street: '123 Main Street, Suite 400',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
    },
  };

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit() {
    this.setupFormWatchers();
    this.prefillUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.senderForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)],
      ],
      company: [''],
      pickupAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: [
          '',
          [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)],
        ],
        country: ['United States', Validators.required],
      }),
      pickupInstructions: [''],
      useProfileAddress: [true],
    });
  }

  private setupFormWatchers() {
    // Watch for form changes and emit data
    this.senderForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((formData) => {
        this.dataChange.emit(formData);
      });

    // Watch for useProfileAddress changes
    this.senderForm
      .get('useProfileAddress')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((useProfile) => {
        if (useProfile) {
          this.prefillUserData();
        } else {
          this.clearAddressFields();
        }
      });
  }

  private prefillUserData() {
    this.senderForm.patchValue(
      {
        fullName: this.userProfile.name,
        email: this.userProfile.email,
        phone: this.userProfile.phone,
        pickupAddress: this.userProfile.address,
      },
      { emitEvent: false }
    );
  }

  private clearAddressFields() {
    this.senderForm.get('pickupAddress')?.patchValue({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    });
  }

  onUseProfileAddress(event: any) {
    const useProfile = event.target.checked;
    this.senderForm.get('useProfileAddress')?.setValue(useProfile);
  }

  onAddressMapToggle() {
    this.showAddressMap = !this.showAddressMap;
  }

  onValidateForm() {
    if (this.senderForm.valid) {
      this.stepComplete.emit(this.senderForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.senderForm.controls).forEach((key) => {
      const control = this.senderForm.get(key);
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
      ? this.senderForm.get(fieldName)?.get(nestedField)
      : this.senderForm.get(fieldName);

    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string, nestedField?: string): string {
    const field = nestedField
      ? this.senderForm.get(fieldName)?.get(nestedField)
      : this.senderForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName, nestedField)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['pattern']) {
        if (fieldName === 'phone') return 'Please enter a valid phone number';
        if (nestedField === 'zipCode') return 'Please enter a valid ZIP code';
      }
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName, nestedField)} is too short`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string, nestedField?: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      street: 'Street address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP code',
      country: 'Country',
    };

    return labels[nestedField || fieldName] || fieldName;
  }

  get isFormValid(): boolean {
    return this.senderForm.valid;
  }
}
