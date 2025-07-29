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
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { Subject } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs/operators';
import { SharedModule } from '../../../../../../shared/shared.module';
import { AddressData, MapAddressPickerComponent } from '../sender-details/map-address-picker/map-address-picker.component';
import { KenyanCounty } from '../../../../../../core/models/pickup-point.model';


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
  recipientSearchControl = new FormControl('');
  isLoading = false;
  selectedRecipientId: string | null = null;
  kenyanCounties = KenyanCounty;

  // Search and filter
  filteredRecipients: SavedRecipient[] = [];
  showRecipientDropdown = false;
  isNewRecipient = true;

  // Mock saved recipients data
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
        county: KenyanCounty.NAIROBI,
        zipCode: '00100',
        postalCode: '00100',
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
        county: KenyanCounty.NAIROBI,
        postalCode: '00200',
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
        county: KenyanCounty.NAIROBI,
        postalCode: '00600',
        zipCode: '00200',
        country: 'Kenya',
        latitude: -1.263,
        longitude: 36.8063,
        formattedAddress: 'Kenyatta Avenue, Westlands, Nairobi, Kenya',
      },
      lastUsed: new Date('2025-07-10'),
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david.wilson@email.com',
      phone: '+254755111222',
      company: 'Wilson Industries',
      address: {
        street: 'Uhuru Highway',
        area: 'Kilimani',
        city: 'Nairobi',
        county: KenyanCounty.NAIROBI,
        postalCode: '00800',
        zipCode: '00800',
        country: 'Kenya',
        latitude: -1.303,
        longitude: 36.807,
        formattedAddress: 'Uhuru Highway, Kilimani, Nairobi, Kenya',
      },
      lastUsed: new Date('2025-07-05'),
    },
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit() {
    this.setupFormWatchers();
    this.setupRecipientSearch();
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
        [Validators.required, Validators.pattern(/^\+254[17]\d{8}$/)],
      ],
      company: [''],
      deliveryAddress: this.fb.group({
        street: ['', Validators.required],
        area: ['', Validators.required],
        city: ['', Validators.required],
        county: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', Validators.required],
        postalCode: ['', Validators.required],
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
    this.recipientForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((formData) => {
        this.dataChange.emit(formData);
      });
  }

  private setupRecipientSearch() {
    this.recipientSearchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.filterRecipients(searchTerm || '');
        this.showRecipientDropdown = !!(searchTerm && searchTerm.length > 0);

        // If search is cleared, reset to new recipient mode
        if (!searchTerm) {
          this.clearRecipientForm();
        }
      });
  }

  private filterRecipients(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredRecipients = [];
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredRecipients = this.savedRecipients.filter(
      (recipient) =>
        recipient.name.toLowerCase().includes(term) ||
        recipient.email.toLowerCase().includes(term) ||
        recipient.phone.includes(term) ||
        (recipient.company && recipient.company.toLowerCase().includes(term))
    );
  }

  onRecipientSelected(recipient: SavedRecipient) {
    this.selectedRecipientId = recipient.id;
    this.isNewRecipient = false;
    this.showRecipientDropdown = false;

    // Set the search control value to the selected recipient's name
    this.recipientSearchControl.setValue(recipient.name, { emitEvent: false });

    // Fill the form with recipient data
    this.recipientForm.patchValue({
      fullName: recipient.name,
      email: recipient.email,
      phone: recipient.phone,
      company: recipient.company || '',
      deliveryAddress: recipient.address,
    });
  }

  clearRecipientForm() {
    this.selectedRecipientId = null;
    this.isNewRecipient = true;
    this.showRecipientDropdown = false;

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

  onNewRecipient() {
    this.clearRecipientForm();
    this.recipientSearchControl.setValue('', { emitEvent: false });
  }

  onAddressSelected(addressData: AddressData) {
    this.recipientForm.get('deliveryAddress')?.patchValue(addressData);
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
    return this.recipientForm.valid;
  }

  get currentDeliveryAddress(): AddressData | null {
    const address = this.recipientForm.get('deliveryAddress')?.value;
    const hasCoordinates =
      address?.latitude != null && address?.longitude != null;
    return hasCoordinates ? address : null;
  }

  get shouldShowMap(): boolean {
    return !this.currentDeliveryAddress || this.isNewRecipient;
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

  trackByRecipient(index: number, recipient: SavedRecipient): string {
    return recipient.id;
  }
}
