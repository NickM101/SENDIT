// src/app/dashboard/user/parcels/send-parcel/components/sender-details/sender-details.component.ts
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
import { MapAddressPickerComponent } from './map-address-picker/map-address-picker.component';

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

export interface SenderData {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  pickupAddress: AddressData;
  pickupInstructions?: string;
  useProfileAddress: boolean;
}

// Kenyan Counties data
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
  selector: 'app-sender-details',
  templateUrl: './sender-details.component.html',
  imports: [SharedModule, MapAddressPickerComponent],
})
export class SenderDetailsComponent implements OnInit, OnDestroy {
  [x: string]: any;
  @Input() parentForm?: FormGroup;
  @Output() stepComplete = new EventEmitter<SenderData>();
  @Output() dataChange = new EventEmitter<SenderData>();
  @ViewChild('mapAddressPicker') mapAddressPicker!: MapAddressPickerComponent;

  private destroy$ = new Subject<void>();

  senderForm!: FormGroup;
  isLoading = false;
  showAddressMap = false;
  kenyanCounties = KENYAN_COUNTIES;

  // Mock user profile data (updated for Kenya)
  userProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+254712345678',
    address: {
      street: 'Kimathi Street',
      area: 'CBD',
      city: 'Nairobi',
      county: 'Nairobi',
      country: 'Kenya',
      state: 'Nairobi',
      zipCode: '00100',
      latitude: -1.2921,
      longitude: 36.8219,
      formattedAddress: 'Kimathi Street, Nairobi CBD, Nairobi, Kenya',
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
        [Validators.required, Validators.pattern(/^\+254[17]\d{8}$/)], // Kenyan phone format
      ],
      company: [''],
      pickupAddress: this.fb.group({
        street: ['', Validators.required],
        area: ['', Validators.required],
        city: ['', Validators.required],
        county: ['', Validators.required],
        country: ['Kenya', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', Validators.required],
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
      pickupInstructions: [''],
      useProfileAddress: [true],
    });
  }

  private setupFormWatchers() {
    // Watch for form changes and emit data
    this.senderForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((formData) => {
        console.log('📝 Form data changed:', formData);
        this.dataChange.emit(formData);
      });

    // Watch for useProfileAddress changes
    this.senderForm
      .get('useProfileAddress')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((useProfile) => {
        console.log('🏠 Use profile address toggled:', useProfile);
        if (useProfile) {
          this.prefillUserData();
        } else {
          this.clearAddressFields();
        }
      });
  }

  private prefillUserData() {
    console.log('👤 Prefilling user data:', this.userProfile);
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
    console.log('🧹 Clearing address fields');
    this.senderForm.get('pickupAddress')?.patchValue({
      street: '',
      area: '',
      city: '',
      county: '',
      country: 'Kenya',
      state: '',
      zipCode: '',
      latitude: null,
      longitude: null,
      formattedAddress: '',
    });
  }

  onUseProfileAddress(event: any) {
    const useProfile = event.target.checked;
    console.log('🔄 Profile address checkbox changed:', useProfile);
    this.senderForm.get('useProfileAddress')?.setValue(useProfile);
  }

  onAddressMapToggle() {
    this.showAddressMap = !this.showAddressMap;
    console.log('🗺️ Map toggle:', this.showAddressMap ? 'Opening' : 'Closing');

    if (this.showAddressMap && this.mapAddressPicker) {
      // Initialize map after view is rendered
      setTimeout(() => {
        this.mapAddressPicker.initializeMap();
      }, 100);
    }
  }

  onAddressSelected(addressData: AddressData) {
    console.log('📍 Address selected from map:', addressData);

    // Update the form with the selected address
    this.senderForm.get('pickupAddress')?.patchValue({
      street: addressData.street,
      area: addressData.area,
      city: addressData.city,
      county: addressData.county,
      country: addressData.country,
      state: addressData.state,
      zipCode: addressData.zipCode,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      formattedAddress: addressData.formattedAddress,
    });

    // Disable use profile address since user selected a custom address
    this.senderForm
      .get('useProfileAddress')
      ?.setValue(false, { emitEvent: false });

    // Optionally close the map after selection
    this.showAddressMap = false;

    console.log('✅ Form updated with selected address');
    console.log(
      '📋 Current pickup address form value:',
      this.senderForm.get('pickupAddress')?.value
    );
  }

  onValidateForm() {
    console.log('🔍 Validating form...');
    console.log('📊 Form valid:', this.senderForm.valid);
    console.log('📄 Complete form data:', this.senderForm.value);
    console.log('❌ Form errors:', this.getFormErrors());

    if (this.senderForm.valid) {
      console.log('✅ Form is valid! Emitting step complete event');
      console.log('📤 Data being emitted:', this.senderForm.value);
      this.stepComplete.emit(this.senderForm.value);
    } else {
      console.log('❌ Form is invalid. Marking all fields as touched');
      this.markFormGroupTouched();
      console.log('🔍 Detailed validation errors:');
      this.logDetailedErrors();
    }
  }

  private getFormErrors(): any {
    let formErrors: any = {};

    Object.keys(this.senderForm.controls).forEach((key) => {
      const control = this.senderForm.get(key);
      if (control && !control.valid && control.touched) {
        formErrors[key] = control.errors;
      }

      // Check nested form group (pickupAddress)
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
    Object.keys(this.senderForm.controls).forEach((key) => {
      const control = this.senderForm.get(key);
      if (control && !control.valid) {
        console.log(`❌ ${key}:`, {
          value: control.value,
          errors: control.errors,
          touched: control.touched,
          dirty: control.dirty,
        });

        // Log nested form errors (pickupAddress)
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
        if (fieldName === 'phone')
          return 'Please enter a valid Kenyan phone number (+254...)';
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
      country: 'Country',
      state: 'State',
      zipCode: 'Zip Code',
      latitude: 'Latitude',
      longitude: 'Longitude',
      formattedAddress: 'Address',
    };

    return labels[nestedField || fieldName] || fieldName;
  }

  get isFormValid(): boolean {
    const isValid = this.senderForm.valid;
    console.log('🎯 Form validity check:', isValid);
    return isValid;
  }

  get currentAddress(): AddressData | null {
    const address = this.senderForm.get('pickupAddress')?.value;
    const hasCoordinates = address?.latitude && address?.longitude;
    console.log('🏠 Current address check:', { address, hasCoordinates });
    return hasCoordinates ? address : null;
  }
}
