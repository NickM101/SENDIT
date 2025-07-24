// src/app/dashboard/user/parcels/send-parcel/components/parcel-details/parcel-details.component.ts

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

export interface ParcelData {
  packageType: string;
  description: string;
  estimatedValue: number;
  weight: number;
  weightUnit: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  specialHandling: {
    fragile: boolean;
    perishable: boolean;
    hazardousMaterial: boolean;
    highValue: boolean;
  };
  insuranceCoverage: string;
  packagingInstructions?: string;
}

export interface PackageTypeOption {
  value: string;
  label: string;
  icon: string;
  description: string;
  maxWeight?: number;
  suggestedUse: string;
}

export interface InsuranceOption {
  value: string;
  label: string;
  coverage: string;
  cost: string;
  description: string;
}

@Component({
  selector: 'app-parcel-details',
  templateUrl: './parcel-details.component.html',
  imports: [SharedModule],
})
export class ParcelDetailsComponent implements OnInit, OnDestroy {
  @Input() parentForm?: FormGroup;
  @Output() stepComplete = new EventEmitter<ParcelData>();
  @Output() dataChange = new EventEmitter<ParcelData>();

  private destroy$ = new Subject<void>();

  parcelForm!: FormGroup;
  isLoading = false;
  showAdvancedOptions = false;

  // Package Type Options based on schema enum
  packageTypes: PackageTypeOption[] = [
    {
      value: 'STANDARD_BOX',
      label: 'Standard Box',
      icon: 'package',
      description: 'Regular packages and boxes',
      maxWeight: 50,
      suggestedUse: 'General items, books, clothing',
    },
    {
      value: 'DOCUMENT',
      label: 'Document',
      icon: 'file-text',
      description: 'Important papers and documents',
      maxWeight: 2,
      suggestedUse: 'Letters, contracts, certificates',
    },
    {
      value: 'CLOTHING',
      label: 'Clothing',
      icon: 'shirt',
      description: 'Apparel and textiles',
      maxWeight: 20,
      suggestedUse: 'Clothes, shoes, accessories',
    },
    {
      value: 'ELECTRONICS',
      label: 'Electronics',
      icon: 'smartphone',
      description: 'Electronic devices and gadgets',
      maxWeight: 30,
      suggestedUse: 'Phones, laptops, accessories',
    },
    {
      value: 'FRAGILE',
      label: 'Fragile Items',
      icon: 'shield-alert',
      description: 'Delicate items requiring special care',
      maxWeight: 25,
      suggestedUse: 'Glass, ceramics, artwork',
    },
    {
      value: 'LIQUID',
      label: 'Liquid',
      icon: 'droplets',
      description: 'Liquid products (restrictions apply)',
      maxWeight: 10,
      suggestedUse: 'Cosmetics, sealed containers',
    },
    {
      value: 'PERISHABLE',
      label: 'Perishable',
      icon: 'thermometer',
      description: 'Items requiring temperature control',
      maxWeight: 15,
      suggestedUse: 'Food, flowers, pharmaceuticals',
    },
  ];

  // Insurance Options based on schema enum
  insuranceOptions: InsuranceOption[] = [
    {
      value: 'NO_INSURANCE',
      label: 'No Insurance',
      coverage: 'KES 0',
      cost: 'Free',
      description: 'No coverage - use at your own risk',
    },
    {
      value: 'BASIC_COVERAGE',
      label: 'Basic Coverage',
      coverage: 'Up to KES 10,000',
      cost: '+KES 250',
      description: 'Basic protection for standard items',
    },
    {
      value: 'PREMIUM_COVERAGE',
      label: 'Premium Coverage',
      coverage: 'Up to KES 50,000',
      cost: '+KES 750',
      description: 'Enhanced protection for valuable items',
    },
    {
      value: 'CUSTOM_COVERAGE',
      label: 'Custom Coverage',
      coverage: 'Custom Amount',
      cost: 'Calculated',
      description: 'Tailored coverage based on declared value',
    },
  ];

  // Weight and dimension units
  weightUnits = [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'lb', label: 'Pounds (lb)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'oz', label: 'Ounces (oz)' },
  ];

  dimensionUnits = [
    { value: 'cm', label: 'Centimeters (cm)' },
    { value: 'in', label: 'Inches (in)' },
    { value: 'm', label: 'Meters (m)' },
    { value: 'ft', label: 'Feet (ft)' },
  ];

  // Prohibited items list for reference
  prohibitedItems = [
    'Weapons and ammunition',
    'Illegal drugs and substances',
    'Explosives and flammable items',
    'Live animals',
    'Perishable food items (without proper packaging)',
    'Hazardous chemicals',
    'Cash and negotiable instruments',
    'Personal identification documents',
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
    this.parcelForm = this.fb.group({
      packageType: ['', Validators.required],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500),
        ],
      ],
      estimatedValue: [
        0,
        [Validators.required, Validators.min(1), Validators.max(50000)],
      ],
      weight: [
        0,
        [Validators.required, Validators.min(0.1), Validators.max(50)],
      ],
      weightUnit: ['kg', Validators.required],
      dimensions: this.fb.group({
        length: [
          0,
          [Validators.required, Validators.min(1), Validators.max(200)],
        ],
        width: [
          0,
          [Validators.required, Validators.min(1), Validators.max(200)],
        ],
        height: [
          0,
          [Validators.required, Validators.min(1), Validators.max(200)],
        ],
        unit: ['cm', Validators.required],
      }),
      specialHandling: this.fb.group({
        fragile: [false],
        perishable: [false],
        hazardousMaterial: [false],
        highValue: [false],
      }),
      insuranceCoverage: ['NO_INSURANCE', Validators.required],
      packagingInstructions: [''],
    });
  }

  private setupFormWatchers() {
    // Watch for form changes and emit data
    this.parcelForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((formData) => {
        this.dataChange.emit(formData);
        this.updateSpecialHandlingBasedOnPackageType();
      });

    // Watch for package type changes to auto-set special handling
    this.parcelForm
      .get('packageType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((packageType) => {
        this.updateSpecialHandlingBasedOnPackageType();
        this.updateWeightLimitsBasedOnPackageType(packageType);
      });

    // Watch for estimated value changes to suggest insurance
    this.parcelForm
      .get('estimatedValue')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.suggestInsuranceBasedOnValue(value);
      });
  }

  private updateSpecialHandlingBasedOnPackageType() {
    const packageType = this.parcelForm.get('packageType')?.value;
    const specialHandling = this.parcelForm.get('specialHandling') as FormGroup;

    // Auto-set special handling based on package type
    switch (packageType) {
      case 'FRAGILE':
        specialHandling.patchValue({ fragile: true }, { emitEvent: false });
        break;
      case 'PERISHABLE':
        specialHandling.patchValue({ perishable: true }, { emitEvent: false });
        break;
      case 'ELECTRONICS':
        specialHandling.patchValue({ fragile: true }, { emitEvent: false });
        break;
    }
  }

  private updateWeightLimitsBasedOnPackageType(packageType: string) {
    const weightControl = this.parcelForm.get('weight');
    const packageTypeOption = this.packageTypes.find(
      (pt) => pt.value === packageType
    );

    if (packageTypeOption?.maxWeight && weightControl) {
      weightControl.setValidators([
        Validators.required,
        Validators.min(0.1),
        Validators.max(packageTypeOption.maxWeight),
      ]);
      weightControl.updateValueAndValidity();
    }
  }

  private suggestInsuranceBasedOnValue(value: number) {
    const insuranceControl = this.parcelForm.get('insuranceCoverage');
    const currentInsurance = insuranceControl?.value;

    // Only auto-suggest if currently no insurance
    if (currentInsurance === 'NO_INSURANCE') {
      if (value > 500) {
        insuranceControl?.setValue('CUSTOM_COVERAGE');
      } else if (value > 100) {
        insuranceControl?.setValue('PREMIUM_COVERAGE');
      } else if (value > 25) {
        insuranceControl?.setValue('BASIC_COVERAGE');
      }
    }

    // Auto-set high value flag
    const specialHandling = this.parcelForm.get('specialHandling') as FormGroup;
    if (value > 1000) {
      specialHandling.patchValue({ highValue: true }, { emitEvent: false });
    }
  }

  onSelectPackageType(packageType: PackageTypeOption) {
    this.parcelForm.patchValue({ packageType: packageType.value });
  }

  onSelectInsurance(insurance: InsuranceOption) {
    this.parcelForm.patchValue({ insuranceCoverage: insurance.value });
  }

  toggleAdvancedOptions() {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  calculateVolumetricWeight(): number {
    const dimensions = this.parcelForm.get('dimensions')?.value;
    if (dimensions.length && dimensions.width && dimensions.height) {
      const volumeInCm3 =
        dimensions.length * dimensions.width * dimensions.height;
      // Volumetric weight = Volume (cm³) / 5000 (standard divisor)
      return Math.round((volumeInCm3 / 5000) * 100) / 100;
    }
    return 0;
  }

  getEstimatedShippingCost(): string {
    const weight = this.parcelForm.get('weight')?.value || 0;
    const packageType = this.parcelForm.get('packageType')?.value;
    const insurance = this.parcelForm.get('insuranceCoverage')?.value;
    let baseCost = 850; // Base rate in KES

    // Weight-based pricing in KES
    if (weight <= 1) baseCost = 1500;
    else if (weight <= 5) baseCost = 2500;
    else if (weight <= 20) baseCost = 4500;
    else baseCost = 7500;

    // Package type surcharges in KES
    const surcharges: { [key: string]: number } = {
      FRAGILE: 500,
      LIQUID: 300,
      PERISHABLE: 700,
      ELECTRONICS: 400,
    };

    if (surcharges[packageType]) {
      baseCost += surcharges[packageType];
    }

    // Insurance costs in KES
    const insuranceCosts: { [key: string]: number } = {
      BASIC_COVERAGE: 250,
      PREMIUM_COVERAGE: 750,
      CUSTOM_COVERAGE: 0, // Would be calculated based on value
    };

    if (insuranceCosts[insurance]) {
      baseCost += insuranceCosts[insurance];
    }

    return (Math.round(baseCost * 100) / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  onValidateForm() {
    if (this.parcelForm.valid) {
      this.stepComplete.emit(this.parcelForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.parcelForm.controls).forEach((key) => {
      const control = this.parcelForm.get(key);
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
      ? this.parcelForm.get(fieldName)?.get(nestedField)
      : this.parcelForm.get(fieldName);

    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string, nestedField?: string): string {
    const field = nestedField
      ? this.parcelForm.get(fieldName)?.get(nestedField)
      : this.parcelForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName, nestedField)} is required`;
      if (field.errors['min'])
        return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max'])
        return `Maximum value is ${field.errors['max'].max}`;
      if (field.errors['minlength'])
        return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
      if (field.errors['maxlength'])
        return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string, nestedField?: string): string {
    const labels: { [key: string]: string } = {
      packageType: 'Package type',
      description: 'Description',
      estimatedValue: 'Estimated value',
      weight: 'Weight',
      length: 'Length',
      width: 'Width',
      height: 'Height',
      insuranceCoverage: 'Insurance coverage',
    };

    return labels[nestedField || fieldName] || fieldName;
  }

  get isFormValid(): boolean {
    return this.parcelForm.valid;
  }

  get selectedPackageType(): PackageTypeOption | undefined {
    const selectedValue = this.parcelForm.get('packageType')?.value;
    return this.packageTypes.find((pt) => pt.value === selectedValue);
  }

  get selectedInsurance(): InsuranceOption | undefined {
    const selectedValue = this.parcelForm.get('insuranceCoverage')?.value;
    return this.insuranceOptions.find((ins) => ins.value === selectedValue);
  }
}
