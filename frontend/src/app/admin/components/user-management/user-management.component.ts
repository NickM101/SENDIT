import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../../auth/models/auth.models';
import { ToastService } from '../../../core/services/toast.service';
import { AdminService } from '../../../admin/services/admin.service';
import { SharedModule } from '../../../shared/shared.module';
import { UserFormComponent } from "./user-form/user-form.component";
import { CeilPipe } from "../../../shared/pipes/ceil.pipe";

declare global {
  interface Window {
    HSStaticMethods: {
      autoInit: () => void;
    };
  }
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: [],
  imports: [SharedModule, UserFormComponent, CeilPipe]
})
export class UserManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  users: User[] = [];
  userStats!: UserStats;
  loading = true;
  error: string | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalUsers = 0;

  searchQuery: string = '';
  selectedRole: string = '';
  selectedStatus: string = '';

  showUserForm = false;
  selectedUser: User | null = null;

  Math:Math = Math; // Expose Math for use in templates

  constructor(private adminService: AdminService, private toastService: ToastService, private router: Router) { }

  ngOnInit(): void {
    this.loadUserStats();
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    // Initialize Preline UI components after the view has been initialized
    if (window.HSStaticMethods) {
      window.HSStaticMethods.autoInit();
    }
  }

  ngOnDestroy(): void {
    // Perform any cleanup if necessary
  }

  loadUserStats(): void {
    this.adminService.getUserStats().subscribe({
      next: (stats) => {
        this.userStats = stats;
      },
      error: (err) => {
        console.error('Error loading user stats:', err);
        this.toastService.error('Loading Failed', 'Failed to load user statistics.');
      }
    });
  }

  loadUsers(): void {
    this.loading = true;
    const filters = {
      search: this.searchQuery,
      role: this.selectedRole || undefined,
      isActive: this.selectedStatus === 'true' ? true : (this.selectedStatus === 'false' ? false : undefined)
    };

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...filters
    };
    this.adminService.getUsers(params).subscribe({
      next: (response) => {
        console.log("USERS RESPONSE:", response)
        this.users = response.items;
        this.totalUsers = response.pagination?.total || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error = 'Failed to load users.';
        this.loading = false;
        this.toastService.error('Loading Failed', 'Failed to load users.');
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    this.adminService.updateUser(user.id, { isActive: newStatus }).subscribe({
      next: () => {
        user.isActive = newStatus; // Optimistically update UI
        this.loadUserStats();
        this.toastService.success('User Status Updated', `User ${user.name}'s status has been updated to ${newStatus ? 'Active' : 'Inactive'}.`);
      },
      error: (err) => {
        console.error('Error toggling user status:', err);
        this.error = `Failed to update status for ${user.name}.`;
        this.toastService.error('Update Failed', `Failed to update status for ${user.name}.`);
      }
    });
  }

  openCreateUserModal(): void {
    this.selectedUser = null;
    this.showUserForm = true;
  }

  viewUser(userId: string): void {
    this.router.navigate(['/admin/users', userId]);
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.adminService.hardDeleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(user => user.id !== userId);
          this.totalUsers--;
          this.loadUserStats(); // Reload stats after deletion
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          this.error = 'Failed to delete user.';
          this.toastService.error('Deletion Failed', 'Failed to delete user.');
        }
      });
    }
  }

  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
    const pageNumbers: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  }

  onFormSubmitted(): void {
    this.showUserForm = false;
    this.selectedUser = null;
    this.loadUsers(); // Reload users after form submission
    this.loadUserStats(); // Reload stats after form submission
    this.toastService.success('User Saved', 'User information has been successfully saved.');
  }

  onFormCancelled(): void {
    this.showUserForm = false;
    this.selectedUser = null;
  }

  viewUserParcels(userId: string): void {
    // Implement navigation to user\'s parcels page
    console.log('View parcels for user:', userId);
  }
}