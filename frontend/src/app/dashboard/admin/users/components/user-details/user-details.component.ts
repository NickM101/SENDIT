// src/app/dashboard/admin/users/user-details/user-details.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { SharedModule } from '../../../../../shared/shared.module';
import { LoadingService } from '../../../../../core/services/loading.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { User, UserRole } from '../../models/user.models';
import { UserService } from '../../services/user.service';


@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  imports: [SharedModule],
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  user: User | null = null;
  userId: string = '';
  isLoading = false;
  showDeleteModal = false;
  showRestoreModal = false;

  // Activity data (mock data - in real app, this would come from API)
  recentActivity = [
    {
      id: '1',
      action: 'User created',
      description: 'Account was created by admin',
      timestamp: new Date('2025-01-15T10:00:00'),
      type: 'create',
    },
    {
      id: '2',
      action: 'Profile updated',
      description: 'Email address was changed',
      timestamp: new Date('2025-01-16T14:30:00'),
      type: 'update',
    },
    {
      id: '3',
      action: 'Last login',
      description: 'User logged in from Chrome browser',
      timestamp: new Date('2025-01-18T09:15:00'),
      type: 'login',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private toastService: ToastService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUser();
    } else {
      this.router.navigate(['/dashboard/admin/users']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadUser(): void {
    this.isLoading = true;
    this.loadingService.show();

    this.userService
      .getUserById(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
          this.loadingService.hide();
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.toastService.error('Failed to load user details');
          this.isLoading = false;
          this.loadingService.hide();
          this.router.navigate(['/dashboard/admin/users']);
        },
      });
  }

  editUser(): void {
    this.router.navigate(['/dashboard/admin/users', this.userId, 'edit']);
  }

  toggleUserStatus(): void {
    if (!this.user) return;

    const action = this.user.isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} ${this.user.name}?`)) {
      this.userService
        .updateUserByAdmin(this.userId, { isActive: !this.user.isActive })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedUser) => {
            this.user = updatedUser;
            this.toastService.success(`User ${action}d successfully`);
          },
          error: (error) => {
            console.error(`Error ${action}ing user:`, error);
            this.toastService.error(`Failed to ${action} user`);
          },
        });
    }
  }

  confirmDelete(): void {
    this.showDeleteModal = true;
  }

  deleteUser(): void {
    if (!this.user) return;

    this.userService
      .softDeleteUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (deletedUser) => {
          this.user = deletedUser;
          this.showDeleteModal = false;
          this.toastService.success('User deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.toastService.error('Failed to delete user');
          this.showDeleteModal = false;
        },
      });
  }

  confirmRestore(): void {
    this.showRestoreModal = true;
  }

  restoreUser(): void {
    if (!this.user) return;

    this.userService
      .restoreUser(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (restoredUser) => {
          this.user = restoredUser;
          this.showRestoreModal = false;
          this.toastService.success('User restored successfully');
        },
        error: (error) => {
          console.error('Error restoring user:', error);
          this.toastService.error('Failed to restore user');
          this.showRestoreModal = false;
        },
      });
  }

  closeModal(): void {
    this.showDeleteModal = false;
    this.showRestoreModal = false;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin/users']);
  }

  // Utility methods
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

  getUserRoleClass(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-blue-100 text-blue-800';
      case UserRole.COURIER:
        return 'bg-purple-100 text-purple-800';
      case UserRole.USER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatShortDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'create':
        return 'user-plus';
      case 'update':
        return 'edit-2';
      case 'login':
        return 'log-in';
      case 'delete':
        return 'trash-2';
      default:
        return 'activity';
    }
  }

  getActivityClass(type: string): string {
    switch (type) {
      case 'create':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'login':
        return 'text-gray-600';
      case 'delete':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }
}
