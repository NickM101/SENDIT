// src/app/shared/components/photo-capture/photo-capture.component.ts

import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-photo-capture',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './photo-capture.component.html',
})
export class PhotoCaptureComponent {
  @Input() required: boolean = false;
  @Input() maxSize: number = 5 * 1024 * 1024; // 5MB default
  @Input() quality: number = 0.8;

  @Output() photoCapture = new EventEmitter<File>();
  @Output() photoRemove = new EventEmitter<void>();

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  showCamera = false;
  capturedPhoto: File | null = null;
  photoPreview: string | null = null;
  stream: MediaStream | null = null;
  isFrontCamera = false;

  private facingMode: 'user' | 'environment' = 'environment';

  async startCamera(): Promise<void> {
    try {
      // Stop any existing stream
      this.stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.showCamera = true;

      // Wait for the video element to be available
      setTimeout(() => {
        if (this.videoElement && this.stream) {
          this.videoElement.nativeElement.srcObject = this.stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.handleCameraError(error);
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.showCamera = false;
  }

  async switchCamera(): Promise<void> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.isFrontCamera = this.facingMode === 'user';
    await this.startCamera();
  }

  capturePhoto(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Handle front camera mirroring
    if (this.isFrontCamera) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const timestamp = new Date().getTime();
          const file = new File([blob], `delivery-photo-${timestamp}.jpg`, {
            type: 'image/jpeg',
          });

          this.processPhoto(file);
        }
      },
      'image/jpeg',
      this.quality
    );

    this.stopCamera();
  }

  selectFromGallery(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      if (this.validateFile(file)) {
        this.processPhoto(file);
      }
    }

    // Reset input value
    input.value = '';
  }

  private validateFile(file: File): boolean {
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return false;
    }

    // Check file size
    if (file.size > this.maxSize) {
      const maxSizeMB = this.maxSize / (1024 * 1024);
      alert(`File size must be less than ${maxSizeMB}MB.`);
      return false;
    }

    return true;
  }

  private processPhoto(file: File): void {
    this.capturedPhoto = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  retakePhoto(): void {
    this.capturedPhoto = null;
    this.photoPreview = null;
    this.photoRemove.emit();
  }

  confirmPhoto(): void {
    if (this.capturedPhoto) {
      this.photoCapture.emit(this.capturedPhoto);
    }
  }

  private handleCameraError(error: any): void {
    let message = 'Camera access failed. ';

    if (error.name === 'NotAllowedError') {
      message += 'Please allow camera access and try again.';
    } else if (error.name === 'NotFoundError') {
      message += 'No camera found on this device.';
    } else if (error.name === 'NotSupportedError') {
      message += 'Camera not supported on this browser.';
    } else {
      message += 'Please try again or select a photo from gallery.';
    }

    alert(message);
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
