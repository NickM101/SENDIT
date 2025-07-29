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
import { AddressData, MapAddressPickerComponent } from './map-address-picker/map-address-picker.component';
import { AuthService } from '../../../../../../auth/services/auth.service';
import { KenyanCounty } from '../../../../../../core/models/pickup-point.model';


export interface SenderData {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  pickupAddress: AddressData;
  pickupInstructions?: string;
  useProfileAddress: boolean;
  useProfileDetails: boolean;
}

@Component({
  selector: 'app-sender-details',
  templateUrl: './sender-details.component.html',
  standalone: true,
  imports: [SharedModule, MapAddressPickerComponent],
})
export class SenderDetailsComponent implements OnInit, OnDestroy {
  @Input() parentForm?: FormGroup;
  @Input() initialData?: SenderData;
  @Output() stepComplete = new EventEmitter<SenderData>();
  @Output() dataChange = new EventEmitter<SenderData>();
  @ViewChild('mapAddressPicker') mapAddressPicker!: MapAddressPickerComponent;

  private destroy$ = new Subject<void>();

  senderForm!: FormGroup;
  currentUser: any = null;
  hasUserProfileAddress = false;
  kenyanCounties = KenyanCounty;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.setupFormWatchers();

    if (this.initialData) {
      this.patchFormWithData(this.initialData);
    }
  }

  private patchFormWithData(data: SenderData) {
    this.senderForm.patchValue(
      {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        company: data.company || '',
        pickupAddress: data.pickupAddress,
        pickupInstructions: data.pickupInstructions || '',
        useProfileAddress: data.useProfileAddress,
        useProfileDetails: data.useProfileDetails,
      },
      { emitEvent: false }
    );
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
        [Validators.required, Validators.pattern(/^(\+254|0)[17]\d{8}$/)],
      ],
      company: [''],
      pickupAddress: this.fb.group({
        street: ['', Validators.required],
        area: ['', Validators.required],
        city: ['', Validators.required],
        county: ['', Validators.required],
        country: ['Kenya', Validators.required],
        postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        latitude: [
          null,
          [Validators.required, Validators.min(-4.89), Validators.max(5.89)],
        ],
        longitude: [
          null,
          [Validators.required, Validators.min(33.89), Validators.max(41.89)],
        ],
        formattedAddress: ['', Validators.required],
      }),
      pickupInstructions: [''],
      useProfileAddress: [false],
      useProfileDetails: [true],
    });
  }

  private loadCurrentUser() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;

        // Check if user has a complete address
        const userAddress = user?.address as Partial<AddressData> | undefined;
        this.hasUserProfileAddress = !!(
          userAddress &&
          typeof userAddress === 'object' &&
          'street' in userAddress &&
          userAddress.street &&
          'latitude' in userAddress &&
          typeof userAddress.latitude === 'number' &&
          userAddress.latitude !== null &&
          'longitude' in userAddress &&
          typeof userAddress.longitude === 'number' &&
          userAddress.longitude !== null &&
          'city' in userAddress &&
          userAddress.city &&
          'county' in userAddress &&
          userAddress.county
        );

        // Set initial values based on user profile
        if (user) {
          if (this.senderForm.get('useProfileDetails')?.value) {
            this.senderForm.patchValue({
              fullName: user.name || '',
              email: user.email || '',
              phone: user.phone || '',
            });
          }

          this.senderForm.patchValue({
            useProfileAddress: this.hasUserProfileAddress,
          });

          if (
            this.hasUserProfileAddress &&
            this.senderForm.get('useProfileAddress')?.value
          ) {
            this.setProfileAddress();
          }
        }
      });
  }

  private setupFormWatchers() {
    // Watch useProfileAddress changes
    this.senderForm
      .get('useProfileAddress')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((useProfile) => {
        if (useProfile && this.hasUserProfileAddress) {
          this.setProfileAddress();
        } else {
          this.clearAddressFields();
        }
      });

    // Watch useProfileDetails changes
    this.senderForm
      .get('useProfileDetails')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((useProfile) => {
        if (useProfile && this.currentUser) {
          this.senderForm.patchValue({
            fullName: this.currentUser.name || '',
            email: this.currentUser.email || '',
            phone: this.currentUser.phone || '',
          });
        }
      });

    // Watch form changes and emit data
    this.senderForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((formData) => {
        this.dataChange.emit(formData);
      });
  }

  private setProfileAddress() {
    if (
      this.currentUser?.address &&
      typeof this.currentUser.address === 'object'
    ) {
      this.senderForm.get('pickupAddress')?.patchValue({
        ...this.currentUser.address,
        country: 'Kenya',
      });
    }
  }

  private clearAddressFields() {
    this.senderForm.get('pickupAddress')?.patchValue({
      street: '',
      area: '',
      city: '',
      county: '',
      country: 'Kenya',
      postalCode: '',
      latitude: null,
      longitude: null,
      formattedAddress: '',
    });
  }

  onAddressSelected(addressData: AddressData) {
    this.senderForm.get('pickupAddress')?.patchValue(addressData);
    this.senderForm
      .get('useProfileAddress')
      ?.setValue(false, { emitEvent: false });
  }

  onValidateForm() {
    const pickupAddressGroup = this.senderForm.get(
      'pickupAddress'
    ) as FormGroup;
    pickupAddressGroup.updateValueAndValidity({
      onlySelf: false,
      emitEvent: false,
    });

    if (this.senderForm.valid) {
      console.log('📤 Submitting sender data:', this.senderForm.value);
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
      if (field.errors['pattern'] && fieldName === 'phone')
        return 'Please enter a valid Kenyan phone number (+254... or 07...)';
      if (field.errors['pattern'] && nestedField === 'postalCode')
        return 'Please enter a valid 5-digit postal code';
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName, nestedField)} is too short`;
      if (field.errors['min'] || field.errors['max'])
        return 'Location must be within Kenya';
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
      postalCode: 'Postal code',
      latitude: 'Latitude',
      longitude: 'Longitude',
      formattedAddress: 'Address',
    };
    return labels[nestedField || fieldName] || fieldName;
  }

  get isFormValid(): boolean {
    return this.senderForm.valid;
  }

  get currentAddress(): AddressData | null {
    const address = this.senderForm.get('pickupAddress')?.value;
    const hasCoordinates =
      address?.latitude != null && address?.longitude != null;
    return hasCoordinates ? address : null;
  }

  get shouldShowMap(): boolean {
    const useProfileAddress = this.senderForm.get('useProfileAddress')?.value;
    const hasValidAddress = this.currentAddress !== null;

    return (
      !useProfileAddress || !this.hasUserProfileAddress || !hasValidAddress
    );
  }

  get showProfileAddressToggle(): boolean {
    return this.hasUserProfileAddress;
  }

  formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    // Format Kenyan phone numbers
    if (phone.startsWith('+254')) {
      return phone.replace(/(\+254)(\d{1})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    } else if (phone.startsWith('0')) {
      return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  }
}
