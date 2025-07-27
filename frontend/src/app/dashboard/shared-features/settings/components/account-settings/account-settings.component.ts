// src/app/dashboard/shared-features/settings/components/account-settings/account-settings.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  imports: [SharedModule]
})
export class AccountSettingsComponent implements OnInit {
  profileForm: FormGroup;
  addressForm: FormGroup;
  isEditingProfile = false;
  isEditingAddress = false;
  selectedFile: File | null = null;
  avatarPreview: string | null = null;

  user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '01/15/1990',
    address: '123 Main Street, Apartment 4B, New York, NY 10001',
    avatarUrl: null,
    role: 'Premium User',
    memberSince: 'January 2023',
    totalParcels: 42,
    successfulDeliveries: 38,
  };

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: [this.user.name, [Validators.required, Validators.minLength(2)]],
      email: [this.user.email, [Validators.required, Validators.email]],
      phone: [this.user.phone, [Validators.required]],
      dateOfBirth: [this.user.dateOfBirth],
    });

    this.addressForm = this.fb.group({
      address: [this.user.address, [Validators.required]],
    });
  }

  ngOnInit(): void {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar(): void {
    if (this.selectedFile) {
      // Implement file upload logic
      console.log('Uploading avatar:', this.selectedFile);
      // After successful upload, update user.avatarUrl
    }
  }

  toggleProfileEdit(): void {
    this.isEditingProfile = !this.isEditingProfile;
    if (!this.isEditingProfile) {
      // Reset form if canceling
      this.profileForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone,
        dateOfBirth: this.user.dateOfBirth,
      });
    }
  }

  toggleAddressEdit(): void {
    this.isEditingAddress = !this.isEditingAddress;
    if (!this.isEditingAddress) {
      this.addressForm.patchValue({
        address: this.user.address,
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const formData = this.profileForm.value;
      // Update user object
      this.user = { ...this.user, ...formData };
      this.isEditingProfile = false;
      console.log('Profile updated:', formData);
    }
  }

  saveAddress(): void {
    if (this.addressForm.valid) {
      const formData = this.addressForm.value;
      this.user.address = formData.address;
      this.isEditingAddress = false;
      console.log('Address updated:', formData);
    }
  }

  deleteAccount(): void {
    const confirmation = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (confirmation) {
      console.log('Account deletion requested');
    }
  }
}
