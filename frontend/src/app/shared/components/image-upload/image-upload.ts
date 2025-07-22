import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.html',
  styleUrls: ['./image-upload.css'],
  standalone: true,
  imports: [CommonModule],
  providers: [ApiService],
})
export class ImageUploadComponent {
  @Input() imageUrl: string | null = null;
  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() uploadError = new EventEmitter<string>();

  uploadProgress: number = 0;
  uploading: boolean = false;
  private userId: string | null = null;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.userId = params['id'] || null;
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.userId) {
      this.uploadFile(file, this.userId);
    } else {
      this.uploadError.emit('User ID is required for uploading.');
    }
  }

  uploadFile(file: File, userId: string): void {
    this.uploading = true;
    this.uploadProgress = 0;

    this.apiService
      .uploadFile<{ imageUrl: string }>('users/profile-picture', file, {
        id: userId,
      })
      .subscribe({
        next: ({ progress, data }) => {
          this.uploadProgress = progress;

          if (data?.imageUrl) {
            this.imageUrl = data.imageUrl;
            this.imageUrlChange.emit(this.imageUrl);
            this.uploading = false;
            this.uploadProgress = 0;
          }
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.uploadError.emit('Failed to upload image.');
          this.uploading = false;
          this.uploadProgress = 0;
        },
      });
  }
}
