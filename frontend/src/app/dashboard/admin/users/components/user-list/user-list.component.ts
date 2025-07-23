// src/app/dashboard/admin/users/user-list/user-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { UserService } from '../../services/user.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { PaginationMeta, PaginatedResponse } from '../../../../../shared/models/api.model';
import { User, UserStats, UserRole, UserTableAction, UserQueryParams } from '../../models/user.models';
import { LoadingService } from '../../../../../core/services/loading.service';
import { SharedModule } from '../../../../../shared/shared.module';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  standalone: true,
  imports: [SharedModule],
})
export class UserListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  users: User[] = [];
  selectedUsers: Set<string> = new Set();
  pagination: PaginationMeta = {
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1,
  };
  userStats: UserStats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    courierUsers: 0,
    regularUsers: 0,
  };

  // Forms
  searchForm!: FormGroup;
  filtersForm!: FormGroup;

  // UI State
  isLoading = false;
  showFilters = false;
  showBulkActions = false;

  // Constants
  readonly userRoles = Object.values(UserRole);
  readonly pageSize = 10;

  Math: Math = Math;

  // Table Actions
  tableActions: UserTableAction[] = [
    {
      label: 'View Details',
      icon: 'eye',
      action: (user: User) => this.viewUser(user.id),
      class: 'text-gray-300 hover:text-blue-600',
    },
    {
      label: 'Edit User',
      icon: 'edit-2',
      action: (user: User) => this.editUser(user.id),
      class: 'text-gray-300 hover:text-green-600',
    },
    {
      label: 'Deactivate',
      icon: 'user-x',
      action: (user: User) => this.toggleUserStatus(user),
      class: 'text-gray-300 hover:text-yellow-600',
      show: (user: User) => user.isActive,
    },
    {
      label: 'Activate',
      icon: 'user-check',
      action: (user: User) => this.toggleUserStatus(user),
      class: 'text-gray-300 hover:text-green-600',
      show: (user: User) => !user.isActive,
    },
    {
      label: 'Delete User',
      icon: 'trash-2',
      action: (user: User) => this.deleteUser(user),
      class: 'text-gray-300 hover:text-red-600',
      show: (user: User) => !user.deletedAt,
    },
  ];

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService,
    private loadingService: LoadingService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadUserStats();
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.searchForm = this.fb.group({
      search: [''],
    });

    this.filtersForm = this.fb.group({
      role: [null],
      isActive: [null],
      sortBy: ['createdAt'],
      sortOrder: ['desc'],
    });
  }

  private setupSearchSubscription(): void {
    this.searchForm
      .get('search')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pagination.page = 1;
        this.loadUsers();
      });
  }

  loadUsers(page: number = 1): void {
    this.isLoading = true;
    this.loadingService.show();

    const queryParams: UserQueryParams = {
      page,
      limit: this.pagination.limit,
      search: this.searchForm.get('search')?.value || undefined,
      role: this.filtersForm.get('role')?.value || undefined,
      isActive: this.filtersForm.get('isActive')?.value,
    };

    this.userService
      .getUsers(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse<User>) => {
          console.log("Response", { items: response.items, pagination: response.pagination })
          this.users = response.items;
          this.pagination = response.pagination;
          this.selectedUsers.clear();
          this.isLoading = false;
          this.loadingService.hide();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.toastService.error('Failed to load users');
          this.isLoading = false;
          this.loadingService.hide();
        },
      });
  }

  loadUserStats(): void {
    this.userService
      .getUserStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.userStats = stats;
        },
        error: (error) => {
          console.error('Error loading user stats:', error);
        },
      });
  }

  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadUsers(page);
  }

  applyFilters(): void {
    this.pagination.page = 1;
    this.loadUsers();
    this.showFilters = false;
  }

  clearFilters(): void {
    this.filtersForm.reset({
      role: null,
      isActive: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    this.searchForm.reset();
    this.pagination.page = 1;
    this.loadUsers();
    this.showFilters = false;
  }

  toggleUserSelection(userId: string): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
    this.showBulkActions = this.selectedUsers.size > 0;
  }

  selectAllUsers(): void {
    if (this.selectedUsers.size === this.users.length) {
      this.selectedUsers.clear();
    } else {
      this.users.forEach((user) => this.selectedUsers.add(user.id));
    }
    this.showBulkActions = this.selectedUsers.size > 0;
  }

  // Navigation Actions
  createUser(): void {
    this.router.navigate(['/dashboard/admin/users/create']);
  }

  viewUser(userId: string): void {
    this.router.navigate(['/dashboard/admin/users', userId]);
  }

  editUser(userId: string): void {
    this.router.navigate(['/dashboard/admin/users', userId, 'edit']);
  }

  // User Actions
  toggleUserStatus(user: User): void {
    const action = user.isActive ? 'deactivate' : 'activate';

    if (confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      this.userService
        .updateUserByAdmin(user.id, { isActive: !user.isActive })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success(`User ${action}d successfully`);
            this.loadUsers();
            this.loadUserStats();
          },
          error: (error) => {
            console.error(`Error ${action}ing user:`, error);
            this.toastService.error(`Failed to ${action} user`);
          },
        });
    }
  }

  deleteUser(user: User): void {
    if (
      confirm(
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`
      )
    ) {
      this.userService
        .softDeleteUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('User deleted successfully');
            this.loadUsers();
            this.loadUserStats();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.toastService.error('Failed to delete user');
          },
        });
    }
  }

  // Bulk Actions
  bulkActivateUsers(): void {
    if (this.selectedUsers.size === 0) return;

    if (confirm(`Activate ${this.selectedUsers.size} selected users?`)) {
      const promises = Array.from(this.selectedUsers).map((userId) =>
        this.userService
          .updateUserByAdmin(userId, { isActive: true })
          .toPromise()
      );

      Promise.all(promises)
        .then(() => {
          this.toastService.success(
            `${this.selectedUsers.size} users activated successfully`
          );
          this.selectedUsers.clear();
          this.showBulkActions = false;
          this.loadUsers();
          this.loadUserStats();
        })
        .catch((error) => {
          console.error('Error in bulk activation:', error);
          this.toastService.error('Some users failed to activate');
        });
    }
  }

  bulkDeactivateUsers(): void {
    if (this.selectedUsers.size === 0) return;

    if (confirm(`Deactivate ${this.selectedUsers.size} selected users?`)) {
      const promises = Array.from(this.selectedUsers).map((userId) =>
        this.userService
          .updateUserByAdmin(userId, { isActive: false })
          .toPromise()
      );

      Promise.all(promises)
        .then(() => {
          this.toastService.success(
            `${this.selectedUsers.size} users deactivated successfully`
          );
          this.selectedUsers.clear();
          this.showBulkActions = false;
          this.loadUsers();
          this.loadUserStats();
        })
        .catch((error) => {
          console.error('Error in bulk deactivation:', error);
          this.toastService.error('Some users failed to deactivate');
        });
    }
  }

  // Utility Methods
  getUserRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.COURIER:
        return 'Courier';
      case UserRole.USER:
        return 'Regular User';
      default:
        return role;
    }
  }

  getUserStatusClass(user: User): string {
    if (user.deletedAt) return 'bg-red-100 text-red-800';
    if (!user.isActive) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getUserStatusLabel(user: User): string {
    if (user.deletedAt) return 'Deleted';
    if (!user.isActive) return 'Inactive';
    return 'Active';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  shouldShowAction(action: UserTableAction, user: User): boolean {
    return action.show ? action.show(user) : true;
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  // Add this method to your UserListComponent class
  onTableAction(action: UserTableAction, user: User): void {
    if (action.action) {
      action.action(user);
    }
  }
}
