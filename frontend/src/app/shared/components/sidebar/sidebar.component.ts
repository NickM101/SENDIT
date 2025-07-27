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
      link: this.generateDynamicLink('/dashboard', 'track-parcel'),
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
      link: this.generateDynamicLink('/dashboard', 'pickup-point'),
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
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
      link: this.generateDynamicLink('/dashboard', 'profile'),
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
    },
    {
      title: 'Settings',
      icon: 'settings',
      link: this.generateDynamicLink('/dashboard', 'settings'),
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      link: '/help',
      roles: [UserRole.ADMIN, UserRole.USER, UserRole.COURIER],
    },
  ];

  constructor(private authService: AuthService, private router: Router) {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.activeLink = event.urlAfterRedirects;
        this.expandActiveParentMenus();
      });
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.resetMenuStates();
        this.updateDynamicLinks(); // Update dynamic links when user changes
      });

    this.activeLink = this.router.url;
    this.expandActiveParentMenus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showProfileMenu = false;
    }
  }

  trackByFn(index: number, item: NavItem): string {
    return item.title;
  }

  filterNavigation(items: NavItem[]): NavItem[] {
    if (!this.currentUser?.role) return [];
    return items.filter((item) => {
      const hasRole =
        !item.roles || item.roles.includes(this.currentUser!.role);
      if (item.children) {
        item.children = this.filterNavigation(item.children);
        return item.children.length > 0 && hasRole;
      }
      return hasRole;
    });
  }

  onToggleCollapsed(): void {
    this.toggleCollapsed.emit();
    if (this.isCollapsed) {
      this.showProfileMenu = false;
    }
  }

  toggleSubmenu(item: NavItem): void {
    if (this.isCollapsed) return;
    this.navigation.forEach((navItem) => {
      if (navItem !== item && navItem.children) {
        navItem.expanded = false;
      }
    });
    item.expanded = !item.expanded;
  }

  toggleProfileMenu(): void {
    if (this.isCollapsed) {
      this.router.navigate([this.generateDynamicLink('/dashboard', 'profile')]);
      return;
    }
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    this.authService.logout();
    this.showProfileMenu = false;
  }

  isRouteActive(link: string): boolean {
    if (link === '/') {
      return this.activeLink === '/';
    }
    const navItem = this.navigation.find((item) => item.link === link);
    if (navItem && !navItem.children) {
      return this.activeLink === link;
    }
    return this.activeLink.startsWith(link);
  }

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

  private resetMenuStates(): void {
    this.navigation.forEach((item) => {
      if (item.children) {
        item.expanded = false;
      }
    });
    this.showProfileMenu = false;
  }

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
    return rect.top + rect.height / 2 - 12;
  }

  openProfileModal(): void {
    // Logic to open the profile modal
  }

  // Method to generate dynamic links based on user role
  generateDynamicLink(basePath: string, path: string): string {
    if (!this.currentUser?.role) return `${basePath}/${path}`;

    switch (this.currentUser.role) {
      case UserRole.ADMIN:
        return `${basePath}/admin/${path}`;
      case UserRole.COURIER:
        return `${basePath}/courier/${path}`;
      case UserRole.USER:
        return `${basePath}/user/${path}`;
      default:
        return `${basePath}/${path}`;
    }
  }

  // Method to update dynamic links when user changes
  updateDynamicLinks(): void {
    this.navigation.forEach((item) => {
      if (item.title === 'Profile') {
        item.link = this.generateDynamicLink('/dashboard', 'profile');
      }
      if (item.title === 'Settings') {
        item.link = this.generateDynamicLink('/dashboard', 'settings');
      }
      if (item.title === 'Track Parcel') {
        item.link = this.generateDynamicLink('/dashboard', 'track-parcel');
      }
      if (item.title === 'Delivery Points') {
        item.link = this.generateDynamicLink('/dashboard', 'pickup-point');
      }
    });
  }
}
