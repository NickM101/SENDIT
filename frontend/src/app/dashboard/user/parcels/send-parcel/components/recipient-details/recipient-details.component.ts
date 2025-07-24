// src/app/dashboard/user/parcels/send-parcel/components/recipient-details/recipient-details.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { SharedModule } from '../../../../../../shared/shared.module';
import { MapAddressPickerComponent } from '../sender-details/map-address-picker/map-address-picker.component';

export interface AddressData {
  state: string;
  zipCode: string;
  street: string;
  area: string;
  city: string;
  county: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface RecipientData {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  deliveryAddress: AddressData;
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
  address: AddressData;
  lastUsed: Date;
}

// Kenyan Counties data (reusing from sender component)
const KENYAN_COUNTIES = [
  'Baringo',
  'Bomet',
  'Bungoma',
  'Busia',
  'Elgeyo-Marakwet',
  'Embu',
  'Garissa',
  'Homa Bay',
  'Isiolo',
  'Kajiado',
  'Kakamega',
  'Kericho',
  'Kiambu',
  'Kilifi',
  'Kirinyaga',
  'Kisii',
  'Kisumu',
  'Kitui',
  'Kwale',
  'Laikipia',
  'Lamu',
  'Machakos',
  'Makueni',
  'Mandera',
  'Marsabit',
  'Meru',
  'Migori',
  'Mombasa',
  'Muranga',
  'Nairobi',
  'Nakuru',
  'Nandi',
  'Narok',
  'Nyamira',
  'Nyandarua',
  'Nyeri',
  'Samburu',
  'Siaya',
  'Taita-Taveta',
  'Tana River',
  'Tharaka-Nithi',
  'Trans Nzoia',
  'Turkana',
  'Uasin Gishu',
  'Vihiga',
  'Wajir',
  'West Pokot',
];

@Component({
  selector: 'app-recipient-details',
  templateUrl: './recipient-details.component.html',
  imports: [SharedModule, MapAddressPickerComponent],
})
export class RecipientDetailsComponent implements OnInit, OnDestroy {
  @Input() parentForm?: FormGroup;
  @Output() stepComplete = new EventEmitter<RecipientData>();
  @Output() dataChange = new EventEmitter<RecipientData>();
  @ViewChild('mapAddressPicker') mapAddressPicker!: MapAddressPickerComponent;

  private destroy$ = new Subject<void>();

  recipientForm!: FormGroup;
  isLoading = false;
  showAddressMap = false;
  showSavedRecipients = false;
  selectedRecipientId: string | null = null;
  kenyanCounties = KENYAN_COUNTIES;

  // Mock saved recipients data (updated for Kenya)
  savedRecipients: SavedRecipient[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+254722123456',
      company: 'ABC Corporation',
      address: {
        street: 'Moi Avenue',
        area: 'CBD',
        city: 'Nairobi',
        county: 'Nairobi',
        state: 'Nairobi',
        zipCode: '00100',
        country: 'Kenya',
        latitude: -1.2864,
        longitude: 36.8172,
        formattedAddress: 'Moi Avenue, CBD, Nairobi, Kenya',
      },
      lastUsed: new Date('2025-07-20'),
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@techcorp.com',
      phone: '+254733987654',
      company: 'TechCorp Solutions',
      address: {
        street: 'Tom Mboya Street',
        area: 'City Center',
        city: 'Nairobi',
        county: 'Nairobi',
        state: 'Nairobi',
        zipCode: '00200',
        country: 'Kenya',
        latitude: -1.2833,
        longitude: 36.8167,
        formattedAddress: 'Tom Mboya Street, City Center, Nairobi, Kenya',
      },
      lastUsed: new Date('2025-07-15'),
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      email: 'emma.rodriguez@gmail.com',
      phone: '+254744567890',
      address: {
        street: 'Kenyatta Avenue',
        area: 'Westlands',
        city: 'Nairobi',
        county: 'Nairobi',
        state: 'Nairobi',
        zipCode: '00600',
        country: 'Kenya',
        latitude: -1.263,
        longitude: 36.8063,
        formattedAddress: 'Kenyatta Avenue, Westlands, Nairobi, Kenya',
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
        [Validators.required, Validators.pattern(/^\+254[17]\d{8}$/)], // Kenyan phone format
      ],
      company: [''],
      deliveryAddress: this.fb.group({
        street: ['', Validators.required],
        area: ['', Validators.required],
        city: ['', Validators.required],
        county: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', Validators.required],
        country: ['Kenya', Validators.required],
        latitude: [
          null,
          [Validators.required, Validators.min(-90), Validators.max(90)],
        ],
        longitude: [
          null,
          [Validators.required, Validators.min(-180), Validators.max(180)],
        ],
        formattedAddress: ['', Validators.required],
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
        console.log('📝 Recipient form data changed:', formData);
        this.dataChange.emit(formData);
      });
  }

  onAddressMapToggle() {
    this.showAddressMap = !this.showAddressMap;
    console.log(
      '🗺️ Recipient map toggle:',
      this.showAddressMap ? 'Opening' : 'Closing'
    );

    if (this.showAddressMap && this.mapAddressPicker) {
      // Initialize map after view is rendered
      setTimeout(() => {
        this.mapAddressPicker.initializeMap();
      }, 100);
    }
  }

  onAddressSelected(addressData: AddressData) {
    console.log('📍 Delivery address selected from map:', addressData);

    // Update the form with the selected address
    this.recipientForm.get('deliveryAddress')?.patchValue({
      street: addressData.street,
      area: addressData.area,
      city: addressData.city,
      county: addressData.county,
      state: addressData.state,
      zipCode: addressData.zipCode,
      country: addressData.country,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      formattedAddress: addressData.formattedAddress,
    });

    // Optionally close the map after selection
    this.showAddressMap = false;

    console.log('✅ Recipient form updated with selected address');
    console.log(
      '📋 Current delivery address form value:',
      this.recipientForm.get('deliveryAddress')?.value
    );
  }

  onValidateForm() {
    console.log('🔍 Validating recipient form...');
    console.log('📊 Form valid:', this.recipientForm.valid);
    console.log('📄 Complete recipient form data:', this.recipientForm.value);
    console.log('❌ Form errors:', this.getFormErrors());

    if (this.recipientForm.valid) {
      console.log('✅ Recipient form is valid! Emitting step complete event');
      console.log('📤 Recipient data being emitted:', this.recipientForm.value);
      this.stepComplete.emit(this.recipientForm.value);
    } else {
      console.log(
        '❌ Recipient form is invalid. Marking all fields as touched'
      );
      this.markFormGroupTouched();
      console.log('🔍 Detailed recipient validation errors:');
      this.logDetailedErrors();
    }
  }

  private getFormErrors(): any {
    let formErrors: any = {};

    Object.keys(this.recipientForm.controls).forEach((key) => {
      const control = this.recipientForm.get(key);
      if (control && !control.valid && control.touched) {
        formErrors[key] = control.errors;
      }

      // Check nested form group (deliveryAddress)
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach((nestedKey) => {
          const nestedControl = control.get(nestedKey);
          if (nestedControl && !nestedControl.valid && nestedControl.touched) {
            if (!formErrors[key]) formErrors[key] = {};
            formErrors[key][nestedKey] = nestedControl.errors;
          }
        });
      }
    });

    return formErrors;
  }

  private logDetailedErrors() {
    Object.keys(this.recipientForm.controls).forEach((key) => {
      const control = this.recipientForm.get(key);
      if (control && !control.valid) {
        console.log(`❌ ${key}:`, {
          value: control.value,
          errors: control.errors,
          touched: control.touched,
          dirty: control.dirty,
        });

        // Log nested form errors (deliveryAddress)
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach((nestedKey) => {
            const nestedControl = control.get(nestedKey);
            if (nestedControl && !nestedControl.valid) {
              console.log(`  ❌ ${key}.${nestedKey}:`, {
                value: nestedControl.value,
                errors: nestedControl.errors,
                touched: nestedControl.touched,
                dirty: nestedControl.dirty,
              });
            }
          });
        }
      }
    });
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
    console.log('👤 Using saved recipient:', recipient);
    this.selectedRecipientId = recipient.id;
    this.recipientForm.patchValue({
      fullName: recipient.name,
      email: recipient.email,
      phone: recipient.phone,
      company: recipient.company || '',
      deliveryAddress: recipient.address,
    });
    this.showSavedRecipients = false;
    console.log('✅ Recipient form updated with saved recipient data');
  }

  toggleSavedRecipients() {
    this.showSavedRecipients = !this.showSavedRecipients;
    console.log(
      '📚 Saved recipients toggle:',
      this.showSavedRecipients ? 'Showing' : 'Hiding'
    );
  }

  clearRecipientForm() {
    console.log('🧹 Clearing recipient form');
    this.selectedRecipientId = null;
    this.recipientForm.reset({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      deliveryAddress: {
        street: '',
        area: '',
        city: '',
        county: '',
        state: '',
        zipCode: '',
        country: 'Kenya',
        latitude: null,
        longitude: null,
        formattedAddress: '',
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
        if (fieldName === 'phone')
          return 'Please enter a valid Kenyan phone number (+254...)';
        if (nestedField === 'zipCode')
          return 'Please enter a valid postal code';
      }
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName, nestedField)} is too short`;
      if (field.errors['min'] || field.errors['max'])
        return `Invalid ${this.getFieldLabel(fieldName, nestedField)} value`;
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
      area: 'Area/Estate',
      city: 'City',
      county: 'County',
      state: 'State',
      zipCode: 'Postal code',
      country: 'Country',
      latitude: 'Latitude',
      longitude: 'Longitude',
      formattedAddress: 'Address',
    };

    return labels[nestedField || fieldName] || fieldName;
  }

  get isFormValid(): boolean {
    const isValid = this.recipientForm.valid;
    console.log('🎯 Recipient form validity check:', isValid);
    return isValid;
  }

  get currentDeliveryAddress(): AddressData | null {
    const address = this.recipientForm.get('deliveryAddress')?.value;
    const hasCoordinates = address?.latitude && address?.longitude;
    console.log('🏠 Current delivery address check:', {
      address,
      hasCoordinates,
    });
    return hasCoordinates ? address : null;
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
