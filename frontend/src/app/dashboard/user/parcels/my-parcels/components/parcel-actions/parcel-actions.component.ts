// src/app/dashboard/user/parcels/my-parcels/components/parcel-actions/parcel-actions.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { SharedModule } from '../../../../../../shared/shared.module';
import { Parcel, ParcelStatus } from '../../../../../../core/models/parcel.model';

@Component({
  selector: 'app-parcel-actions',
  templateUrl: './parcel-actions.component.html',
  imports: [SharedModule],
})
export class ParcelActionsComponent {
  @Input() parcel!: Parcel;
  @Output() actionClick = new EventEmitter<string>();

  @ViewChild('dropdown') dropdown!: ElementRef;

  showDropdown = false;

  onActionClick(action: string): void {
    this.actionClick.emit(action);
    this.closeDropdown();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  getAvailableActions() {
    const actions = [
      {
        label: 'View Details',
        action: 'view',
        icon: 'eye',
        color: 'text-gray-700 dark:text-gray-300',
      },
      {
        label: 'Track Parcel',
        action: 'track',
        icon: 'map-pin',
        color: 'text-blue-600 dark:text-blue-400',
      },
    ];

    // Add conditional actions based on status
    if (
      [ParcelStatus.DRAFT, ParcelStatus.PROCESSING].includes(this.parcel.status)
    ) {
      actions.push({
        label: 'Edit Parcel',
        action: 'edit',
        icon: 'edit',
        color: 'text-green-600 dark:text-green-400',
      });

      actions.push({
        label: 'Cancel Parcel',
        action: 'cancel',
        icon: 'x-circle',
        color: 'text-red-600 dark:text-red-400',
      });
    }

    if (this.parcel.status === ParcelStatus.DELIVERED) {
      actions.push({
        label: 'Download Receipt',
        action: 'receipt',
        icon: 'download',
        color: 'text-purple-600 dark:text-purple-400',
      });

      actions.push({
        label: 'Reorder',
        action: 'reorder',
        icon: 'repeat',
        color: 'text-green-600 dark:text-green-400',
      });
    }

    if (
      [ParcelStatus.IN_TRANSIT, ParcelStatus.OUT_FOR_DELIVERY].includes(
        this.parcel.status
      )
    ) {
      actions.push({
        label: 'Contact Support',
        action: 'support',
        icon: 'help-circle',
        color: 'text-orange-600 dark:text-orange-400',
      });
    }

    return actions;
  }

  // Close dropdown when clicking outside
  onDocumentClick(event: Event): void {
    if (this.dropdown && !this.dropdown.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  shouldShowDelete(): boolean {
    // Implement your logic here, for example:
    // return this.parcel && this.parcel.canDelete;
    // For now, return true as a placeholder
    return true;
  }
}
