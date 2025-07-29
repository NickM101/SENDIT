// src/app/admin/pickup-points/pickup-point-create/pickup-point-create.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PickupPointType, KenyanCounty } from '../../../../../core/models/pickup-point.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { SharedModule } from '../../../../../shared/shared.module';
import { PickupPointService } from '../../services/pickup-point.service';

@Component({
  selector: 'app-pickup-point-create',
  templateUrl: './pickup-point-create.component.html',
  imports: [SharedModule],
})
export class PickupPointCreateComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private pickupPointService = inject(PickupPointService);
  private toastr = inject(ToastService);

  pickupPointForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  pickupPointId: string | null = null;

  pickupPointTypes = Object.values(PickupPointType);
  kenyanCounties = Object.values(KenyanCounty);
  availableServices = [
    'Drop-off',
    'Pickup',
    '24/7 Access',
    'Fragile Items',
    'Large Packages',
    'Express Service',
    'Returns Processing',
    'Storage Service',
  ];

  // Map integration
  selectedLocation: { lat: number; lng: number } | null = null;
  mapCenter = { lat: -1.2921, lng: 36.8219 }; // Nairobi coordinates

  ngOnInit(): void {
    this.checkEditMode();
    this.initializeForm();

    if (this.isEditMode && this.pickupPointId) {
      this.loadPickupPoint();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkEditMode(): void {
    this.pickupPointId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.pickupPointId;
  }

  private initializeForm(): void {
    this.pickupPointForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      type: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      county: ['', Validators.required],
      latitude: [
        '',
        [Validators.required, Validators.min(-90), Validators.max(90)],
      ],
      longitude: [
        '',
        [Validators.required, Validators.min(-180), Validators.max(180)],
      ],
      hours: ['', [Validators.required, Validators.minLength(5)]],
      phone: ['', [Validators.pattern(/^\+254[0-9]{9}$/)]],
      email: ['', [Validators.email]],
      services: this.fb.array([], Validators.required),
      rating: ['', [Validators.min(0), Validators.max(5)]],
      isActive: [true],
    });

    // Initialize services FormArray
    this.initializeServices();
  }

  private initializeServices(): void {
    const servicesArray = this.pickupPointForm.get('services') as FormArray;
    this.availableServices.forEach(() => {
      servicesArray.push(this.fb.control(false));
    });
  }

  private loadPickupPoint(): void {
    if (!this.pickupPointId) return;

    this.isLoading = true;
    this.pickupPointService
      .getPickupPointById(this.pickupPointId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pickupPoint) => {
          this.populateForm(pickupPoint);
          this.selectedLocation = {
            lat: pickupPoint.latitude,
            lng: pickupPoint.longitude,
          };
        },
        error: (error) => {
          console.error('Error loading pickup point:', error);
          this.toastr.error('Failed to load pickup point details', 'Error');
          this.router.navigate(['/dashboard/admin/pickup-point']);
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  private populateForm(pickupPoint: any): void {
    this.pickupPointForm.patchValue({
      name: pickupPoint.name,
      type: pickupPoint.type,
      address: pickupPoint.address,
      city: pickupPoint.city,
      county: pickupPoint.county,
      latitude: pickupPoint.latitude,
      longitude: pickupPoint.longitude,
      hours: pickupPoint.hours,
      phone: pickupPoint.phone,
      email: pickupPoint.email,
      rating: pickupPoint.rating,
      isActive: pickupPoint.isActive,
    });

    // Update services checkboxes
    const servicesArray = this.pickupPointForm.get('services') as FormArray;
    this.availableServices.forEach((service, index) => {
      const isSelected = pickupPoint.services.includes(service);
      servicesArray.at(index).setValue(isSelected);
    });
  }

  get servicesFormArray(): FormArray {
    return this.pickupPointForm.get('services') as FormArray;
  }

  onServiceChange(index: number, event: any): void {
    const servicesArray = this.servicesFormArray;
    servicesArray.at(index).setValue(event.target.checked);
  }

  onLocationSelected(location: { lat: number; lng: number }): void {
    this.selectedLocation = location;
    this.pickupPointForm.patchValue({
      latitude: location.lat,
      longitude: location.lng,
    });
  }

  onAddressChange(): void {
    const address = this.pickupPointForm.get('address')?.value;
    const city = this.pickupPointForm.get('city')?.value;

    if (address && city) {
      // In a real app, you'd geocode the address
      // For now, we'll just update the map center
      this.geocodeAddress(`${address}, ${city}`);
    }
  }

  private geocodeAddress(address: string): void {
    // Mock geocoding - in real app, use Google Maps Geocoding API
    // This is just for demonstration
    console.log('Geocoding address:', address);

    // For Kenya, you might use a service like:
    // this.geocodeService.geocode(address).subscribe(result => {
    //   if (result.length > 0) {
    //     this.selectedLocation = {
    //       lat: result[0].geometry.location.lat(),
    //       lng: result[0].geometry.location.lng()
    //     };
    //     this.pickupPointForm.patchValue({
    //       latitude: this.selectedLocation.lat,
    //       longitude: this.selectedLocation.lng
    //     });
    //   }
    // });
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.onLocationSelected(location);
          this.toastr.success('Location updated successfully', 'Success');
        },
        (error) => {
          console.error('Error getting location:', error);
          this.toastr.error('Failed to get current location', 'Error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      this.toastr.error(
        'Geolocation is not supported by this browser',
        'Error'
      );
    }
  }

  onSubmit(): void {
    if (this.pickupPointForm.invalid) {
      this.markFormGroupTouched();
      this.toastr.warning(
        'Please fill in all required fields correctly',
        'Form Invalid'
      );
      return;
    }

    this.isSubmitting = true;
    const formData = this.prepareFormData();

    const operation = this.isEditMode
      ? this.pickupPointService.updatePickupPoint(this.pickupPointId!, formData)
      : this.pickupPointService.createPickupPoint(formData);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        const action = this.isEditMode ? 'updated' : 'created';
        this.toastr.success(`Pickup point ${action} successfully`, 'Success');
        this.router.navigate(['/dashboard/admin/pickup-point']);
      },
      error: (error) => {
        console.error(
          `Error ${this.isEditMode ? 'updating' : 'creating'} pickup point:`,
          error
        );
        this.toastr.error(
          `Failed to ${this.isEditMode ? 'update' : 'create'} pickup point`,
          'Error'
        );
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  private prepareFormData(): any {
    const formValue = this.pickupPointForm.value;

    // Convert services array to string array
    const selectedServices = this.availableServices.filter(
      (_, index) => formValue.services[index]
    );

    return {
      ...formValue,
      services: selectedServices,
      latitude: parseFloat(formValue.latitude),
      longitude: parseFloat(formValue.longitude),
      rating: formValue.rating ? parseFloat(formValue.rating) : undefined,
    };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.pickupPointForm.controls).forEach((key) => {
      const control = this.pickupPointForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach((c) => c.markAsTouched());
      }
    });
  }

  onCancel(): void {
    if (this.pickupPointForm.dirty) {
      const confirmLeave = confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmLeave) return;
    }

    this.router.navigate(['/dashboard/admin/pickup-point']);
  }

  // Validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.pickupPointForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.pickupPointForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;

    if (errors['required']) return `${fieldName} is required`;
    if (errors['minlength'])
      return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength'])
      return `${fieldName} must not exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['pattern'])
      return 'Please enter a valid phone number (+254XXXXXXXXX)';
    if (errors['min'])
      return `${fieldName} must be at least ${errors['min'].min}`;
    if (errors['max'])
      return `${fieldName} must not exceed ${errors['max'].max}`;

    return 'This field is invalid';
  }

  // Utility methods
  trackByIndex(index: number): number {
    return index;
  }
}
