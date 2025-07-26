import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { User, UserRole } from '../../../auth/models/auth.models';
import { SharedModule } from '../../shared.module';

interface NavItem {
  title: string;
  icon: string;
  link?: string;
  roles?: UserRole[];
  children?: NavItem[];
  expanded?: boolean;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [SharedModule],
  standalone: true,
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isCollapsed: boolean = false;
  @Output() toggleCollapsed = new EventEmitter<void>();

  currentUser: User | null = null;
  activeLink: string = '';
  showProfileMenu: boolean = false;

  private destroy$ = new Subject<void>();

  // Dynamic navigation based on user roles
  navigation: NavItem[] = [
    {
      title: 'Dashboard',
      icon: 'layout-dashboard',
      link: '/dashboard',
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
    },
    {
      title: 'My Parcels',
      icon: 'package',
      link: '/dashboard/user/my-parcels',
      roles: [UserRole.USER],
      badge: '3',
    },
    {
      title: 'Send Parcel',
      icon: 'send',
      link: '/dashboard/user/send-parcel',
      roles: [UserRole.USER],
    },
    {
      title: 'Track Parcel',
      icon: 'search',
      link: '/track',
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
    },
    {
      title: 'Deliveries',
      icon: 'truck',
      roles: [UserRole.COURIER],
      children: [
        {
          title: "Today's Route",
          icon: 'route',
          link: '/courier/route',
          roles: [UserRole.COURIER],
        },
        {
          title: 'Pickup Tasks',
          icon: 'package-plus',
          link: '/courier/pickups',
          roles: [UserRole.COURIER],
          badge: '5',
        },
        {
          title: 'Delivery Tasks',
          icon: 'package-minus',
          link: '/courier/deliveries',
          roles: [UserRole.COURIER],
          badge: '12',
        },
      ],
    },
    {
      title: 'Management',
      icon: 'settings',
      roles: [UserRole.ADMIN],
      children: [
        {
          title: 'All Parcels',
          icon: 'package',
          link: '/admin/parcels',
          roles: [UserRole.ADMIN],
        },
        {
          title: 'Users',
          icon: 'users',
          link: '/admin/users',
          roles: [UserRole.ADMIN],
        },
        {
          title: 'Couriers',
          icon: 'truck',
          link: '/admin/couriers',
          roles: [UserRole.ADMIN],
        },
        {
          title: 'Reports',
          icon: 'bar-chart-3',
          link: '/admin/reports',
          roles: [UserRole.ADMIN],
        },
      ],
    },
    {
      title: 'Delivery Points',
      icon: 'map-pin',
      link: '/delivery-points',
      roles: [UserRole.ADMIN],
    },
    {
      title: 'Payments',
      icon: 'credit-card',
      link: '/payments',
      roles: [UserRole.ADMIN, UserRole.USER],
    },
    {
      title: 'Profile',
      icon: 'user',
      link: '/profile',
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
    },
    {
      title: 'Settings',
      icon: 'settings',
      link: '/settings',
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      link: '/help',
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
    },
  ];
  tooltipEvent: any;

  constructor(private authService: AuthService, private router: Router) {
    // Track route changes
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.activeLink = event.urlAfterRedirects;
        // Auto-expand parent menus for active child routes
        this.expandActiveParentMenus();
      });
  }

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        // Reset expanded states when user changes
        this.resetMenuStates();
      });

    // Set initial active link
    this.activeLink = this.router.url;
    this.expandActiveParentMenus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Close profile menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showProfileMenu = false;
    }
  }

  // Track by function for ngFor performance
  trackByFn(index: number, item: NavItem): string {
    return item.title;
  }

  // Filter navigation items based on user role
  filterNavigation(items: NavItem[]): NavItem[] {
    if (!this.currentUser?.role) return [];

    return items.filter((item) => {
      // Check if user has required role
      const hasRole =
        !item.roles || item.roles.includes(this.currentUser!.role);

      if (item.children) {
        // Filter children and only show parent if it has visible children
        item.children = this.filterNavigation(item.children);
        return item.children.length > 0 && hasRole;
      }

      return hasRole;
    });
  }

  // Toggle sidebar collapsed state
  onToggleCollapsed(): void {
    this.toggleCollapsed.emit();
    // Close profile menu when collapsing
    if (this.isCollapsed) {
      this.showProfileMenu = false;
    }
  }

  // Toggle submenu expansion
  toggleSubmenu(item: NavItem): void {
    if (this.isCollapsed) return;

    // Close other submenus (accordion behavior)
    this.navigation.forEach((navItem) => {
      if (navItem !== item && navItem.children) {
        navItem.expanded = false;
      }
    });

    item.expanded = !item.expanded;
  }

  // Toggle profile dropdown menu
  toggleProfileMenu(): void {
    if (this.isCollapsed) {
      // In collapsed mode, navigate to profile directly
      this.router.navigate(['/profile']);
      return;
    }

    this.showProfileMenu = !this.showProfileMenu;
  }

  // Logout user
  logout(): void {
    this.authService.logout();
    this.showProfileMenu = false;
  }

  // Helper method to check if route is active
  isRouteActive(link: string): boolean {
    if (link === '/') {
      return this.activeLink === '/';
    }

    // Exact match if the nav item has no children
    const navItem = this.navigation.find((item) => item.link === link);
    if (navItem && !navItem.children) {
      return this.activeLink === link;
    }

    // StartsWith only for parent items with children
    return this.activeLink.startsWith(link);
  }

  // Auto-expand parent menus for active child routes
  private expandActiveParentMenus(): void {
    this.navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.link && this.isRouteActive(child.link)
        );
        if (hasActiveChild) {
          item.expanded = true;
        }
      }
    });
  }

  // Reset all menu expanded states
  private resetMenuStates(): void {
    this.navigation.forEach((item) => {
      if (item.children) {
        item.expanded = false;
      }
    });
    this.showProfileMenu = false;
  }

  // Get user role display name
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

  // Get role-based styling
  getUserRoleColor(): string {
    switch (this.currentUser?.role) {
      case UserRole.ADMIN:
        return 'from-red-400 to-red-600';
      case UserRole.COURIER:
        return 'from-green-400 to-green-600';
      case UserRole.USER:
        return 'from-blue-400 to-blue-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  }

  getTooltipPosition(event: any): number {
    const rect = event.target.getBoundingClientRect();
    return rect.top + rect.height / 2 - 12; // Center the tooltip vertically
  }

  openProfileModal(): void {
    // Logic to open the profile modal
  }
}
