import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { User, UserRole } from '../auth/models/auth.models';
import { SharedModule } from '../shared/shared.module';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

interface Breadcrumb {
  label: string;
  link?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  imports: [SharedModule, SidebarComponent],
  standalone: true,
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  // Layout state
  isCollapsed: boolean = false;
  showProfileModal: boolean = false;
  showNotifications: boolean = false;
  showQuickActions: boolean = false;
  isDarkMode: boolean = false;

  // User and navigation
  currentUser: User | null = null;
  pageTitle: string = 'Dashboard';
  breadcrumbs: Breadcrumb[] = [];

  // Notifications
  notificationCount: number = 3;
  notifications: Notification[] = [
    {
      id: '1',
      title: 'Package Delivered',
      message: 'Your package ST-2507923 has been delivered successfully.',
      time: '2 minutes ago',
      read: false,
      type: 'success',
    },
    {
      id: '2',
      title: 'New Package in Transit',
      message: 'Package ST-2506844 is now in transit to Los Angeles.',
      time: '1 hour ago',
      read: false,
      type: 'info',
    },
    {
      id: '3',
      title: 'Delivery Delayed',
      message: 'Package ST-2503587 delivery has been delayed due to weather.',
      time: '3 hours ago',
      read: true,
      type: 'warning',
    },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    // Load saved preferences
    this.loadPreferences();

    // Listen to route changes for breadcrumbs and page title
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updatePageInfo();
      });
  }

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });

    // Set initial page info
    this.updatePageInfo();

    // Apply theme
    this.applyTheme();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Close modals when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Close dropdowns if clicking outside
    if (!target.closest('.relative')) {
      this.showNotifications = false;
      this.showQuickActions = false;
    }
  }

  // Sidebar methods
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.savePreferences();

    // Close other modals when toggling sidebar
    this.showNotifications = false;
  }

  // Profile modal methods
  openProfileModal(): void {
    this.showProfileModal = true;
    // Close other dropdowns
    this.showNotifications = false;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  // Notification methods
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationAsRead(notification: Notification): void {
    notification.read = true;
    this.updateNotificationCount();
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.updateNotificationCount();
  }

  private updateNotificationCount(): void {
    this.notificationCount = this.notifications.filter((n) => !n.read).length;
  }

  // Theme methods
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    this.savePreferences();
  }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // User methods
  getUserRoleDisplay(): string {
    switch (this.currentUser?.role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.COURIER:
        return 'Courier';
      case UserRole.USER:
        return 'Customer';
      default:
        return 'User';
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeProfileModal();
  }

  // Page info methods
  private updatePageInfo(): void {
    // Get current route data for title and breadcrumbs
    let route = this.route.root;
    let url = '';
    const breadcrumbs: Breadcrumb[] = [];

    while (route.firstChild) {
      route = route.firstChild;
      url += '/' + route.snapshot.url.map((segment) => segment.path).join('/');

      // Get route data
      const routeData = route.snapshot.data;
      if (routeData['title']) {
        this.pageTitle = routeData['title'];
      }

      if (routeData['breadcrumb']) {
        breadcrumbs.push({
          label: routeData['breadcrumb'],
          link: url,
        });
      }
    }

    // Fallback page titles based on URL
    if (!this.pageTitle || this.pageTitle === 'Dashboard') {
      this.pageTitle = this.getPageTitleFromUrl();
    }

    // Set breadcrumbs
    this.breadcrumbs = this.generateBreadcrumbs();
  }

  private getPageTitleFromUrl(): string {
    const url = this.router.url;

    // Define URL to title mappings
    const titleMappings: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/dashboard/admin': 'Admin Dashboard',
      '/dashboard/user': 'User Dashboard',
      '/dashboard/courier': 'Courier Dashboard',
      '/parcels/send': 'Send Parcel',
      '/parcels/my-parcels': 'My Parcels',
      '/parcels/all': 'All Parcels',
      '/admin/parcels': 'Parcel Management',
      '/admin/users': 'User Management',
      '/admin/couriers': 'Courier Management',
      '/admin/reports': 'Reports & Analytics',
      '/courier/route': "Today's Route",
      '/courier/pickups': 'Pickup Tasks',
      '/courier/deliveries': 'Delivery Tasks',
      '/track': 'Track Parcel',
      '/delivery-points': 'Delivery Points',
      '/payments': 'Payments',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/help': 'Help & Support',
    };

    return titleMappings[url] || 'Dashboard';
  }

  private generateBreadcrumbs(): Breadcrumb[] {
    const url = this.router.url;
    const segments = url.split('/').filter((segment) => segment);
    const breadcrumbs: Breadcrumb[] = [];

    // Always start with Dashboard
    breadcrumbs.push({ label: 'Home', link: '/dashboard' });

    // Build breadcrumbs based on URL segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += '/' + segment;

      // Skip the first 'dashboard' segment as it's already added as 'Home'
      if (segment === 'dashboard' && index === 0) {
        return;
      }

      const breadcrumbMappings: { [key: string]: string } = {
        admin: 'Administration',
        parcels: 'Parcels',
        courier: 'Courier',
        send: 'Send Parcel',
        'my-parcels': 'My Parcels',
        all: 'All Parcels',
        users: 'Users',
        couriers: 'Couriers',
        reports: 'Reports',
        route: 'Route',
        pickups: 'Pickups',
        deliveries: 'Deliveries',
        track: 'Tracking',
        'delivery-points': 'Delivery Points',
        payments: 'Payments',
        profile: 'Profile',
        settings: 'Settings',
        help: 'Help',
      };

      const label =
        breadcrumbMappings[segment] || this.capitalizeFirst(segment);
      const isLast = index === segments.length - 1;

      breadcrumbs.push({
        label,
        link: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Preferences management
  private loadPreferences(): void {
    const saved = localStorage.getItem('dashboardPreferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        this.isCollapsed = preferences.isCollapsed || false;
        this.isDarkMode = preferences.isDarkMode || false;
      } catch (error) {
        console.warn('Failed to load preferences:', error);
      }
    }
  }

  private savePreferences(): void {
    const preferences = {
      isCollapsed: this.isCollapsed,
      isDarkMode: this.isDarkMode,
    };
    localStorage.setItem('dashboardPreferences', JSON.stringify(preferences));
  }

  // Utility methods for template
  getNotificationIcon(type: string): string {
    const iconMappings: { [key: string]: string } = {
      info: 'info',
      success: 'check-circle',
      warning: 'alert-triangle',
      error: 'alert-circle',
    };
    return iconMappings[type] || 'bell';
  }

  getNotificationColor(type: string): string {
    const colorMappings: { [key: string]: string } = {
      info: 'bg-blue-100 text-blue-600',
      success: 'bg-green-100 text-green-600',
      warning: 'bg-yellow-100 text-yellow-600',
      error: 'bg-red-100 text-red-600',
    };
    return colorMappings[type] || 'bg-gray-100 text-gray-600';
  }

  // Search functionality
  onSearch(): void {
    // Implement global search functionality
  }

  // Quick actions based on user role
  getQuickActions() {
    const role = this.currentUser?.role;

    switch (role) {
      case UserRole.ADMIN:
        return [
          {
            label: 'Create Parcel',
            icon: 'package-plus',
            link: '/admin/parcels/create',
          },
          {
            label: 'View Reports',
            icon: 'bar-chart-3',
            link: '/admin/reports',
          },
          { label: 'Manage Users', icon: 'users', link: '/admin/users' },
        ];

      case UserRole.USER:
        return [
          { label: 'Send Parcel', icon: 'send', link: '/parcels/send' },
          { label: 'Track Package', icon: 'search', link: '/track' },
          {
            label: 'View History',
            icon: 'history',
            link: '/parcels/my-parcels',
          },
        ];

      case UserRole.COURIER:
        return [
          { label: 'View Route', icon: 'route', link: '/courier/route' },
          {
            label: 'Pickup Tasks',
            icon: 'package-plus',
            link: '/courier/pickups',
          },
          {
            label: 'Delivery Tasks',
            icon: 'package-minus',
            link: '/courier/deliveries',
          },
        ];

      default:
        return [];
    }
  }
}
