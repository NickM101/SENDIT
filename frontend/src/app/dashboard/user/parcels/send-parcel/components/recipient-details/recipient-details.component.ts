// src/app/dashboard/user/parcels/send-parcel/components/recipient-details/recipient-details.component.ts

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

export interface RecipientData {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  deliveryInstructions?: string;
  saveRecipient: boolean;
  sendNotifications: boolean;
}

export interface SavedRecipient {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  lastUsed: Date;
}

@Component({
  selector: 'app-recipient-details',
  templateUrl: './recipient-details.component.html',
  imports: [SharedModule],
})
export class RecipientDetailsComponent implements OnInit, OnDestroy {
  @Input() parentForm?: FormGroup;
  @Output() stepComplete = new EventEmitter<RecipientData>();
  @Output() dataChange = new EventEmitter<RecipientData>();

  private destroy$ = new Subject<void>();

  recipientForm!: FormGroup;
  isLoading = false;
  showAddressMap = false;
  showSavedRecipients = false;
  selectedRecipientId: string | null = null;

  // US States for dropdown
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

  // Mock saved recipients data (in real app, this would come from a service)
  savedRecipients: SavedRecipient[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 (555) 987-6543',
      company: 'ABC Corporation',
      address: {
        street: '456 Oak Avenue, Suite 200',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        country: 'United States',
      },
      lastUsed: new Date('2025-07-20'),
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@techcorp.com',
      phone: '+1 (555) 123-9876',
      company: 'TechCorp Solutions',
      address: {
        street: '789 Business Drive',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'United States',
      },
      lastUsed: new Date('2025-07-15'),
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      email: 'emma.rodriguez@gmail.com',
      phone: '+1 (555) 456-7890',
      address: {
        street: '321 Residential Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'United States',
      },
      lastUsed: new Date('2025-07-10'),
    },
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit() {
    this.setupFormWatchers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.recipientForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)],
      ],
      company: [''],
      deliveryAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: [
          '',
          [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)],
        ],
        country: ['United States', Validators.required],
      }),
      deliveryInstructions: [''],
      saveRecipient: [false],
      sendNotifications: [true],
    });
  }

  private setupFormWatchers() {
    // Watch for form changes and emit data
    this.recipientForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((formData) => {
        this.dataChange.emit(formData);
      });
  }

  onAddressMapToggle() {
    this.showAddressMap = !this.showAddressMap;
  }

  onValidateForm() {
    if (this.recipientForm.valid) {
      this.stepComplete.emit(this.recipientForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.recipientForm.controls).forEach((key) => {
      const control = this.recipientForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach((nestedKey) => {
          control.get(nestedKey)?.markAsTouched();
        });
      }
    });
  }

  // Saved recipients functionality
  onUseSavedRecipient(recipient: SavedRecipient) {
    this.selectedRecipientId = recipient.id;
    this.recipientForm.patchValue({
      fullName: recipient.name,
      email: recipient.email,
      phone: recipient.phone,
      company: recipient.company || '',
      deliveryAddress: recipient.address,
    });
    this.showSavedRecipients = false;
  }

  toggleSavedRecipients() {
    this.showSavedRecipients = !this.showSavedRecipients;
  }

  clearRecipientForm() {
    this.selectedRecipientId = null;
    this.recipientForm.reset({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      deliveryAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
      },
      deliveryInstructions: '',
      saveRecipient: false,
      sendNotifications: true,
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string, nestedField?: string): boolean {
    const field = nestedField
      ? this.recipientForm.get(fieldName)?.get(nestedField)
      : this.recipientForm.get(fieldName);

    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string, nestedField?: string): string {
    const field = nestedField
      ? this.recipientForm.get(fieldName)?.get(nestedField)
      : this.recipientForm.get(fieldName);

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
    return this.recipientForm.valid;
  }

  get recentRecipients(): SavedRecipient[] {
    return this.savedRecipients
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, 3);
  }

  formatLastUsed(date: Date): string {
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }
}
