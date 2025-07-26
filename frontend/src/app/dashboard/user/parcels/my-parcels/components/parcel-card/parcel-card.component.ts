// src/app/dashboard/user/parcels/my-parcels/components/parcel-card/parcel-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SharedModule } from '../../../../../../shared/shared.module';
import { Parcel, StatusConfig } from '../../../../../../core/models/parcel.model';
import { ParcelActionsComponent } from "../parcel-actions/parcel-actions.component";

@Component({
  selector: 'app-parcel-card',
  templateUrl: './parcel-card.component.html',
  imports: [SharedModule, ParcelActionsComponent]
})
export class ParcelCardComponent {
  @Input() parcel!: Parcel;
  @Input() showActions = true;
  @Output() actionClick = new EventEmitter<string>();

  statusConfig = StatusConfig;

  onActionClick(action: string): void {
    this.actionClick.emit(action);
  }

  getStatusConfig(status: string) {
    return (
      this.statusConfig[status as keyof typeof StatusConfig] || {
        label: status,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: 'help-circle',
      }
    );
  }

  getDeliveryProgress(): number {
    const status = this.parcel.status;
    const progressMap: { [key: string]: number } = {
      DRAFT: 0,
      PROCESSING: 20,
      PAYMENT_PENDING: 30,
      PAYMENT_CONFIRMED: 40,
      PICKED_UP: 60,
      IN_TRANSIT: 80,
      OUT_FOR_DELIVERY: 90,
      DELIVERED: 100,
      DELAYED: 70,
      RETURNED: 0,
      CANCELLED: 0,
    };
    return progressMap[status] || 0;
  }

  getEstimatedDeliveryText(): string {
    if (!this.parcel.estimatedDelivery) {
      return 'Delivery date TBD';
    }

    const now = new Date();
    const delivery = new Date(this.parcel.estimatedDelivery);
    const diffTime = delivery.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (this.parcel.status === 'DELIVERED') {
      return `Delivered on ${delivery.toLocaleDateString()}`;
    }

    if (diffDays < 0) {
      return 'Delivery overdue';
    } else if (diffDays === 0) {
      return 'Delivering today';
    } else if (diffDays === 1) {
      return 'Delivering tomorrow';
    } else {
      return `Delivering in ${diffDays} days`;
    }
  }

  formatCurrency(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
}
