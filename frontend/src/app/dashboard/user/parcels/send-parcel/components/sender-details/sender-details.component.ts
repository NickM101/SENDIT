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
import { AuthService } from '../../../../../../auth/services/auth.service';
import { SendParcelService } from '../../services/send-parcel.service';

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
  useProfileDetails: boolean;
}

@Component({
  selector: 'app-sender-details',
  templateUrl: './sender-details.component.html',
  imports: [SharedModule, MapAddressPickerComponent],
})
export class SenderDetailsComponent implements OnInit, OnDestroy {
  @Input() parentForm?: FormGroup;
  @Output() stepComplete = new EventEmitter<SenderData>();
  @Output() dataChange = new EventEmitter<SenderData>();
  @ViewChild('mapAddressPicker') mapAddressPicker!: MapAddressPickerComponent;

  private destroy$ = new Subject<void>();

  senderForm!: FormGroup;
  showAddressMap = false;

  userProfile = {
    fullName: '',
    email: '',
    phone: '',
    address: {
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
    },
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private sendParcelService: SendParcelService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadDraft();
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
        [Validators.required, Validators.pattern(/^\+254[17]\d{8}$/)],
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
      useProfileDetails: [true],
    });
  }

  private loadDraft() {
    this.sendParcelService
      .getCurrentDraft()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (draft) => {
          if (draft && draft.stepData?.step1) {
            this.senderForm.patchValue(draft.stepData.step1);
          }
        },
        error: () => {
          // Silent fail is fine for drafts.
        },
      });
  }

  private prefillUserData() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (this.senderForm.get('useProfileAddress')?.value) {
          this.senderForm.patchValue({
            fullName: profile?.name || '',
            email: profile?.email || '',
            phone: profile?.phone || '',
            pickupAddress: {
              ...this.senderForm.get('pickupAddress')?.value,
              ...((typeof profile?.address === 'object' && profile?.address !== null) ? profile.address : {}),
            },
          });
        }
      });
  }

  private setupFormWatchers() {
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

  saveDraft() {
    if (this.senderForm.valid) {
      const draftData = {
        stepData: {
          step1: this.senderForm.value,
        },
      };
      this.sendParcelService
        .saveDraft(draftData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Draft saved successfully');
          },
          error: (error) => {
            console.error('Error saving draft:', error);
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private clearAddressFields() {
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

  onAddressMapToggle() {
    this.showAddressMap = !this.showAddressMap;
    if (this.showAddressMap && this.mapAddressPicker) {
      setTimeout(() => {
        this.mapAddressPicker.initializeMap();
      }, 100);
    }
  }

  onAddressSelected(addressData: AddressData) {
    this.senderForm.get('pickupAddress')?.patchValue(addressData);
    this.senderForm
      .get('useProfileAddress')
      ?.setValue(false, { emitEvent: false });
    this.showAddressMap = false;
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
      console.log('📤 Submitting form data:', this.senderForm.value);
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
        return 'Please enter a valid Kenyan phone number (+254...)';
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
    return this.senderForm.valid;
  }

  get currentAddress(): AddressData | null {
    const address = this.senderForm.get('pickupAddress')?.value;
    const hasCoordinates =
      address?.latitude != null && address?.longitude != null;
    return hasCoordinates ? address : null;
  }
}
