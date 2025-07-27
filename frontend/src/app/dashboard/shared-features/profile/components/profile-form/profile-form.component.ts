// src/app/dashboard/shared-features/profile/components/profile-form/profile-form.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { User as UserModel } from '../../../../../auth/models/auth.models';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './profile-form.component.html',
})
export class ProfileFormComponent implements OnInit, OnChanges {
  @Input() user: UserModel | null = null;
  @Input() isLoading = false;
  @Output() onProfileUpdate = new EventEmitter<Partial<UserModel>>();

  profileForm: FormGroup;
  isEditing = false;
  originalFormValue: any = {};

  constructor(private fb: FormBuilder) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.user) {
      this.updateFormWithUserData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.updateFormWithUserData();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      dateOfBirth: [''],
      address: ['']
    });
  }

  private updateFormWithUserData(): void {
    if (!this.user) return;

    const formValue = {
      name: this.user.name || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      dateOfBirth: this.user.dateOfBirth ? this.formatDateForInput(this.user.dateOfBirth) : '',
      address: this.user.address || ''
    };

    this.profileForm.patchValue(formValue);
    this.originalFormValue = { ...formValue };
  }

  private formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  startEditing(): void {
    this.isEditing = true;
    this.originalFormValue = { ...this.profileForm.value };
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.profileForm.patchValue(this.originalFormValue);
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.isEditing) {
      const formValue = this.profileForm.value;
      const updateData: Partial<UserModel> = {
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : undefined,
        address: formValue.address
      };

      this.onProfileUpdate.emit(updateData);
      this.isEditing = false;
    }
  }
}