// src/app/dashboard/user/tracking/components/quick-actions/quick-actions.component.ts
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  imports: [SharedModule],
})
export class QuickActionsComponent {
  @Input() trackingNumber?: string;

  constructor(private router: Router, private toastService: ToastService) {}

  /**
   * Download receipt/shipping label
   */
  onDownloadReceipt(): void {
    if (!this.trackingNumber) {
      this.toastService.error('No tracking number available');
      return;
    }

    // TODO: Implement actual download functionality
    console.log('Downloading receipt for:', this.trackingNumber);
    this.toastService.info('Receipt download will be available soon');
  }

  /**
   * Share tracking information
   */
  onShareTracking(): void {
    if (!this.trackingNumber) {
      this.toastService.error('No tracking number available');
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          title: 'SendIT Package Tracking',
          text: `Track your package: ${this.trackingNumber}`,
          url: `${window.location.origin}/track?tracking=${this.trackingNumber}`,
        })
        .then(() => {
          this.toastService.success('Tracking information shared successfully');
        })
        .catch((error) => {
          console.error('Error sharing:', error);
          this.fallbackShare();
        });
    } else {
      this.fallbackShare();
    }
  }

  /**
   * Fallback share method using clipboard
   */
  private fallbackShare(): void {
    const trackingUrl = `${window.location.origin}/track?tracking=${this.trackingNumber}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(trackingUrl)
        .then(() => {
          this.toastService.success('Tracking link copied to clipboard');
        })
        .catch(() => {
          this.toastService.error('Failed to copy tracking link');
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = trackingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.toastService.success('Tracking link copied to clipboard');
    }
  }

  /**
   * Print shipping label
   */
  onPrintLabel(): void {
    if (!this.trackingNumber) {
      this.toastService.error('No tracking number available');
      return;
    }

    // TODO: Implement actual print functionality
    console.log('Printing label for:', this.trackingNumber);
    this.toastService.info('Print functionality will be available soon');
  }

  /**
   * Contact support
   */
  onContactSupport(): void {
    // Navigate to support or open support modal
    this.router.navigate(['/support'], {
      queryParams: { tracking: this.trackingNumber },
    });
  }

  /**
   * Send new parcel
   */
  onSendNewParcel(): void {
    this.router.navigate(['/dashboard/send-parcel']);
  }

  /**
   * Find delivery points
   */
  onFindDeliveryPoints(): void {
    this.router.navigate(['/dashboard/delivery-points']);
  }
}
