import { Component, OnInit } from '@angular/core';
import { User } from '../../../auth/models/auth.models';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { SharedModule } from '../../../shared/shared.module';
import { UserFormComponent } from "./user-form/user-form.component";
import { CeilPipe } from "../../../shared/pipes/ceil.pipe";


interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  imports: [SharedModule, UserFormComponent, CeilPipe]
})
export class UserManagementComponent implements OnInit {
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

  constructor(private userService: UserService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.loadUserStats();
    this.loadUsers();
  }

  loadUserStats(): void {
    this.userService.getUserStats().subscribe({
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
      role: this.selectedRole,
      isActive: this.selectedStatus === 'true' ? true : (this.selectedStatus === 'false' ? false : undefined)
    };

    this.userService.getUsers(this.currentPage, this.itemsPerPage, filters).subscribe({
      next: (response) => {
        this.users = response.data;
        this.totalUsers = response.total;
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

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    this.userService.updateUser(user.id, { isActive: newStatus }).subscribe({
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

  editUser(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.selectedUser = user;
        this.showUserForm = true;
      },
      error: (err) => {
        console.error('Error fetching user for edit:', err);
        this.error = 'Failed to load user for editing.';
      }
    });
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.userService.deleteUser(userId).subscribe({
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

  viewUser(userId: string): void {
    // Implement navigation to user detail page
    console.log('View user:', userId);
  }

  viewUserParcels(userId: string): void {
    // Implement navigation to user\'s parcels page
    console.log('View parcels for user:', userId);
  }
}