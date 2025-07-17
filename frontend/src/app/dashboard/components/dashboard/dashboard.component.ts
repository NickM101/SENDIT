// File: src/app/dashboard/components/dashboard/dashboard.component.ts
// Main dashboard component for SendIT application

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../../auth/services/auth.service';
import {
  DashboardStats,
  RecentParcel,
  NotificationItem,
  QuickAction,
  ActivityFeed,
} from '../../models/dashboard.models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, RouterModule],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Data properties
  stats: DashboardStats | null = null;
  recentParcels: RecentParcel[] = [];
  notifications: NotificationItem[] = [];
  activityFeed: ActivityFeed[] = [];

  // UI state
  isLoading = true;
  isRefreshing = false;
  showNotifications = false;

  Math: Math = Math;

  // Quick actions
  quickActions: QuickAction[] = [
    {
      id: 'send-parcel',
      title: 'Send New Parcel',
      description: 'Create and send a new parcel',
      icon: 'package-plus',
      route: '/parcels/send',
      enabled: true,
    },
    {
      id: 'track-parcel',
      title: 'Track Parcel',
      description: 'Track your parcel status',
      icon: 'search',
      route: '/parcels/track',
      enabled: true,
    },
    {
      id: 'delivery-points',
      title: 'Find Delivery Point',
      description: 'Locate nearby delivery points',
      icon: 'map-pin',
      route: '/delivery-points',
      enabled: true,
    },
    {
      id: 'support',
      title: 'Get Support',
      description: 'Contact customer support',
      icon: 'help-circle',
      route: '/support',
      enabled: true,
    },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupNotificationListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load initial dashboard data
   */
  private loadDashboardData(): void {
    this.isLoading = true;

    combineLatest([
      this.dashboardService.getDashboardStats(),
      this.dashboardService.getRecentParcels(5),
      this.dashboardService.getNotifications(),
      this.dashboardService.getActivityFeed(5),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([stats, parcels, notifications, activity]) => {
          this.stats = stats;
          this.recentParcels = parcels;
          this.notifications = notifications;
          this.activityFeed = activity;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.isLoading = false;
        },
      });
  }

  /**
   * Setup notification listener
   */
  private setupNotificationListener(): void {
    this.dashboardService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
      });
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.isRefreshing = true;

    this.dashboardService
      .refreshDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ stats, parcels, notifications }) => {
          this.stats = stats;
          this.recentParcels = parcels;
          this.notifications = notifications;
          this.isRefreshing = false;
        },
        error: (error) => {
          console.error('Error refreshing dashboard:', error);
          this.isRefreshing = false;
        },
      });
  }

  /**
   * Handle quick action click
   */
  onQuickActionClick(action: QuickAction): void {
    if (action.enabled) {
      this.router.navigate([action.route]);
    }
  }

  /**
   * Navigate to parcels page
   */
  viewAllParcels(): void {
    this.router.navigate(['/parcels']);
  }

  /**
   * Navigate to specific parcel
   */
  viewParcel(parcel: RecentParcel): void {
    this.router.navigate(['/parcels', parcel.id]);
  }

  /**
   * Track parcel
   */
  trackParcel(trackingNumber: string): void {
    this.router.navigate(['/parcels/track'], {
      queryParams: { tracking: trackingNumber },
    });
  }

  trackByParcelId(index: number, parcel: RecentParcel): string {
    return parcel.id;
  }

  trackByNotificationId(index: number, notification: NotificationItem): string {
    return notification.id;
  }

  trackByActivityId(index: number, activity: ActivityFeed): string {
    return activity.id;
  }


  /**
   * Toggle notifications panel
   */
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notification: NotificationItem): void {
    if (!notification.read) {
      this.dashboardService
        .markNotificationAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }

    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.dashboardService
      .clearAllNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  /**
   * Get current user
   */
  get currentUser() {
    return this.authService.currentUserValue;
  }

  /**
   * Get user's first name
   */
  get userFirstName(): string {
    const user = this.currentUser;
    if (!user) return 'User';

    const names = user.name.split(' ');
    return names[0];
  }

  /**
   * Get greeting based on time of day
   */
  get greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Get unread notification count
   */
  get unreadNotificationCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return this.dashboardService.formatStatus(status);
  }

  /**
   * Get status color class
   */
  getStatusColorClass(status: string): string {
    return this.dashboardService.getStatusColorClass(status);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Calculate growth percentage
   */
  getGrowthIcon(growth: number): string {
    return growth >= 0 ? 'trending-up' : 'trending-down';
  }

  /**
   * Get growth color class
   */
  getGrowthColorClass(growth: number): string {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Export data
   */
  exportData(): void {
    this.dashboardService
      .exportParcelHistory('csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sendit-parcels-${
          new Date().toISOString().split('T')[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
  }
}
