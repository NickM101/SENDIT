import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from './sidebar.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [CommonModule, RouterModule],
  standalone: true,
})
export class SidebarComponent {
  items$: any;
  private isMobileMenuOpenSignal = signal(false);
  collapsedSections = signal<Record<string, boolean>>({});

  constructor(
    private sidebarService: SidebarService,
    public authService: AuthService
  ) {
    this.items$ = this.sidebarService.items$;
  }

  sidebarClasses = computed(() => {
    const base =
      'flex flex-col w-64 bg-card border-r border-border transition-transform duration-200 ease-in-out';
    const mobile = this.isMobileMenuOpenSignal()
      ? 'fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0'
      : 'fixed inset-y-0 left-0 z-50 -translate-x-full lg:relative lg:translate-x-0';
    return `${base} ${mobile}`;
  });

  logoTextClasses = computed(() => 'font-semibold text-lg text-foreground');
  navTextClasses = computed(() => 'text-sm font-medium');
  userProfileClasses = computed(
    () =>
      'flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors'
  );
  userInfoClasses = computed(() => 'flex flex-col space-y-1');

  isMobileMenuOpen = computed(() => this.isMobileMenuOpenSignal());

  getNavItemClasses(item: any): string {
    const base =
      'flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors';
    return base;
  }

  getSubNavItemClasses(): string {
    return 'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground';
  }

  toggleSection(label: string) {
    const collapsedSections = this.collapsedSections();
    this.collapsedSections.set({
      ...collapsedSections,
      [label]: !collapsedSections[label],
    });
  }

  isCollapsed(label: string): boolean {
    return this.collapsedSections()[label];
  }

  toggleSidebar() {
    this.isMobileMenuOpenSignal.update((current) => !current);
  }

  closeMobileSidebar() {
    this.isMobileMenuOpenSignal.set(false);
  }
}
