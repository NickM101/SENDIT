// File: src/app/shared/components/layout/layout.component.ts
// Main layout component with sidebar navigation for SendIT application

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  current: boolean;
  badge?: number;
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  imports: [CommonModule, RouterModule]
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  currentRoute = '';
  unreadNotifications = 0;

  navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', current: true },
    { name: 'My Parcels', href: '/parcels', icon: 'parcels', current: false },
    {
      name: 'Send Parcel',
      href: '/parcels/send',
      icon: 'send',
      current: false,
    },
    {
      name: 'Track Parcel',
      href: '/parcels/track',
      icon: 'track',
      current: false,
    },
    {
      name: 'Delivery Points',
      href: '/delivery-points',
      icon: 'location',
      current: false,
    },
    { name: 'Payments', href: '/payments', icon: 'payments', current: false },
    { name: 'Profile', href: '/profile', icon: 'profile', current: false },
    { name: 'Settings', href: '/settings', icon: 'settings', current: false },
  ];

  userNavigation = [
    { name: 'Your Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
    { name: 'Sign out', href: '#' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupRouteListener();
    this.setupNotificationListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup route change listener
   */
  private setupRouteListener(): void {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
        this.updateNavigationCurrent();
      }
    });
  }

  /**
   * Setup notification count listener
   */
  private setupNotificationListener(): void {
    this.dashboardService
      .getUnreadNotificationCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadNotifications = count;
      });
  }

  /**
   * Update current navigation item
   */
  private updateNavigationCurrent(): void {
    this.navigation = this.navigation.map((item) => ({
      ...item,
      current: this.currentRoute.startsWith(item.href),
    }));
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /**
   * Close sidebar
   */
  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  /**
   * Navigate to route
   */
  navigateTo(href: string): void {
    if (href === '#') return;

    this.router.navigate([href]);
    this.closeSidebar();
  }

  /**
   * Handle user menu action
   */
  onUserMenuAction(item: any): void {
    if (item.name === 'Sign out') {
      this.logout();
    } else {
      this.navigateTo(item.href);
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Get current user
   */
  get currentUser() {
    return this.authService.currentUserValue;
  }

  /**
   * Get user initials for avatar
   */
  get userInitials(): string {
    const user = this.currentUser;
    if (!user?.name) return 'U';

    return user.name
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Check if user is admin
   */
  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }
}
