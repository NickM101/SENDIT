// src/app/dashboard/admin/pickup-point/pickup-point-list/pickup-point-list.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SharedModule } from '../../../shared/shared.module';
import {
  PickupPointType,
  KenyanCounty,
  PickupPoint,
} from '../../../core/models/pickup-point.model';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { PickupPointService } from './services/pickup-point.service';

@Component({
  selector: 'app-pickup-point-list',
  templateUrl: './pickup-point-list.component.html',
  standalone: true,
  imports: [SharedModule],
})
export class PickupPointListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private pickupPointService = inject(PickupPointService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);

  pickupPoints: PickupPoint[] = [];
  filteredPoints: PickupPoint[] = [];
  selectedPoints: Set<string> = new Set();

  Math: Math = Math;

  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  filtersForm!: FormGroup;
  searchForm!: FormGroup;
  isLoading = false;
  showFilters = false;
  viewMode: 'grid' | 'table' = 'table';
  sortBy: 'name' | 'city' | 'county' | 'rating' | 'createdAt' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  pickupPointTypes = Object.values(PickupPointType);
  kenyanCounties = Object.values(KenyanCounty);
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.fetchPickupPoints();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      city: [''],
      county: [''],
      type: [''],
      isActive: [''],
    });

    this.searchForm = this.fb.group({
      query: [''],
    });

    // Listen for search changes
    this.searchForm
      .get('query')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((query) => this.filterPoints(query));
  }

  fetchPickupPoints(): void {
    this.isLoading = true;

    const params = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      ...this.filtersForm.value,
    };

    // Remove empty values
    Object.keys(params).forEach((key) => {
      if (
        params[key] === '' ||
        params[key] === null ||
        params[key] === undefined
      ) {
        delete params[key];
      }
    });

    this.pickupPointService
      .getPickupPoints(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.pickupPoints = res?.items || [];
          this.filteredPoints = [...this.pickupPoints];
          this.pagination = { ...this.pagination, ...res.pagination };
          this.filterPoints(this.searchForm.get('query')?.value || '');
        },
        error: (err) => {
          console.error('Failed to fetch pickup points', err);
          this.toastService.error('Failed to load pickup points', 'Error');
        },
        complete: () => (this.isLoading = false),
      });
  }

  private filterPoints(query: string): void {
    if (!query) {
      this.filteredPoints = [...this.pickupPoints];
      return;
    }

    const searchTerm = query.toLowerCase();
    this.filteredPoints = this.pickupPoints.filter(
      (point) =>
        point.name.toLowerCase().includes(searchTerm) ||
        point.city.toLowerCase().includes(searchTerm) ||
        point.address.toLowerCase().includes(searchTerm) ||
        point.county.toLowerCase().includes(searchTerm)
    );
  }

  onFilterSubmit(): void {
    this.pagination.page = 1;
    this.fetchPickupPoints();
  }

  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field as any;
      this.sortOrder = 'asc';
    }
    this.fetchPickupPoints();
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.searchForm.reset();
    this.pagination.page = 1;
    this.fetchPickupPoints();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.pagination.page = page;
    this.fetchPickupPoints();
  }

  togglePointSelection(pointId: string): void {
    if (this.selectedPoints.has(pointId)) {
      this.selectedPoints.delete(pointId);
    } else {
      this.selectedPoints.add(pointId);
    }
  }

  selectAllPoints(): void {
    if (this.selectedPoints.size === this.filteredPoints.length) {
      this.selectedPoints.clear();
    } else {
      this.filteredPoints.forEach((point) => this.selectedPoints.add(point.id));
    }
  }

  createPickupPoint(): void {
    this.router.navigate(['/dashboard/admin/pickup-point/create']);
  }

  editPickupPoint(id: string): void {
    this.router.navigate(['/dashboard/admin/pickup-point', id, 'edit']);
  }

  viewPickupPoint(id: string): void {
    this.router.navigate(['/dashboard/admin/pickup-point', id]);
  }

  trackByPointId(index: number, point: PickupPoint): string {
    return point.id;
  }

  getPageNumbers(): number[] {
    const pages = [];
    const totalPages = this.pagination.totalPages;

    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return pages;
  }

  deletePickupPoint(point: PickupPoint): void {
    if (confirm(`Are you sure you want to delete "${point.name}"?`)) {
      this.pickupPointService
        .deletePickupPoint(point.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success(
              'Pickup point deleted successfully',
              'Success'
            );
            this.fetchPickupPoints();
          },
          error: (err) => {
            console.error('Failed to delete pickup point', err);
            this.toastService.error('Failed to delete pickup point', 'Error');
          },
        });
    }
  }

  toggleStatus(point: PickupPoint): void {
    const updatedPoint = { ...point, isActive: !point.isActive };

    this.pickupPointService
      .updatePickupPoint(point.id, { isActive: updatedPoint.isActive })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const status = updatedPoint.isActive ? 'activated' : 'deactivated';
          this.toastService.success(
            `Pickup point ${status} successfully`,
            'Success'
          );
          this.fetchPickupPoints();
        },
        error: (err) => {
          console.error('Failed to update pickup point status', err);
          this.toastService.error('Failed to update status', 'Error');
        },
      });
  }

  bulkDelete(): void {
    if (this.selectedPoints.size === 0) return;

    const count = this.selectedPoints.size;
    if (confirm(`Are you sure you want to delete ${count} pickup point(s)?`)) {
      const deletePromises = Array.from(this.selectedPoints).map((id) =>
        this.pickupPointService.deletePickupPoint(id).toPromise()
      );

      Promise.all(deletePromises)
        .then(() => {
          this.toastService.success(
            `${count} pickup points deleted successfully`,
            'Success'
          );
          this.selectedPoints.clear();
          this.fetchPickupPoints();
        })
        .catch((err) => {
          console.error('Failed to delete pickup points', err);
          this.toastService.error(
            'Failed to delete some pickup points',
            'Error'
          );
        });
    }
  }

  exportData(): void {
    // Implementation for data export
    this.toastService.info('Export functionality coming soon', 'Info');
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }

    if (hasHalfStar) {
      stars.push('half');
    }

    while (stars.length < 5) {
      stars.push('empty');
    }

    return stars;
  }
}
