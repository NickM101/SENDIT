import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { PickupPointType, KenyanCounty, PickupPoint } from '../../../core/models/pickup-point.model';
import { PickupPointService } from './services/pickup-point.service';

@Component({
  selector: 'app-pickup-point-list',
  templateUrl: './pickup-point-list.component.html',
  imports: [SharedModule]
})
export class PickupPointListComponent implements OnInit {
  pickupPoints: PickupPoint[] = [];
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  filtersForm!: FormGroup;
  isLoading = false;

  pickupPointTypes = Object.values(PickupPointType);
  kenyanCounties = Object.values(KenyanCounty);

  constructor(
    private pickupPointService: PickupPointService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.filtersForm = this.fb.group({
      city: [''],
      county: [''],
      type: [''],
    });

    this.fetchPickupPoints();
  }

  fetchPickupPoints(): void {
    this.isLoading = true;

    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
      ...this.filtersForm.value,
    };

    this.pickupPointService.getPickupPoints(params).subscribe({
      next: (res) => {
        this.pickupPoints = res.items;
        this.pagination = { ...this.pagination, ...res.pagination };
      },
      error: (err) => {
        console.error('Failed to fetch pickup points', err);
      },
      complete: () => (this.isLoading = false),
    });
  }

  onFilterSubmit(): void {
    this.pagination.page = 1;
    this.fetchPickupPoints();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.pagination.page = page;
    this.fetchPickupPoints();
  }
}
