import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { User } from '../../../auth/models/auth.models';
import { SharedModule } from '../../shared.module';

interface NavItem {
  title: string;
  icon: string;
  link?: string;
  roles?: string[];
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [SharedModule]
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed: boolean = false;
  @Output() toggleCollapsed = new EventEmitter<void>();

  currentUser: User | null = null;
  activeLink: string = '';
  showProfileMenu: boolean = false;

  navigation: NavItem[] = [
    { title: 'Dashboard', icon: 'layout-dashboard', link: '/user-dashboard', roles: ['ADMIN', 'USER'] },
    { title: 'Parcels', icon: 'package', roles: ['ADMIN', 'USER'], children: [
      { title: 'Send Parcel', icon: 'package-plus', link: '/parcels/send', roles: ['USER'] },
      { title: 'My Parcels', icon: 'package', link: '/parcels/my-parcels', roles: ['USER'] },
      { title: 'All Parcels', icon: 'package', link: '/parcels/all', roles: ['ADMIN'] }
    ]},
    { title: 'Tracking', icon: 'truck', link: '/track', roles: ['ADMIN', 'USER'] },
    { title: 'Users', icon: 'users', link: '/admin/users', roles: ['ADMIN'] },
    { title: 'Settings', icon: 'settings', link: '/settings', roles: ['ADMIN', 'USER'] },
    { title: 'Help', icon: 'help-circle', link: '/help', roles: ['ADMIN', 'USER'] }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.activeLink = event.urlAfterRedirects;
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  filterNavigation(items: NavItem[]): NavItem[] {
    if (!this.currentUser) return [];
    return items.filter(item => {
      const hasRole = item.roles ? item.roles.some(role => this.authService.hasRole(role as any)) : true;
      if (item.children) {
        item.children = this.filterNavigation(item.children);
        return item.children.length > 0 && hasRole;
      }
      return hasRole;
    });
  }

  onToggleCollapsed(): void {
    this.toggleCollapsed.emit();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    this.authService.logout();
    this.showProfileMenu = false;
  }
}
