import { UserRole } from '../../auth/models/auth.models';

export interface SidebarItem {
  label: string;
  icon?: string;
  route?: string;
  children?: SidebarItem[];
  collapsible?: boolean;
}

export const SidebarConfigs: Record<UserRole, SidebarItem[]> = {
  USER: [
    {
      label: 'Dashboard',
      icon: 'home',
      route: '/dashboard',
    },
    {
      label: 'Profile',
      icon: 'person',
      route: '/profile',
    },
  ],
  PREMIUM_USER: [
    {
      label: 'Dashboard',
      icon: 'home',
      route: '/dashboard',
    },
    {
      label: 'Profile',
      icon: 'person',
      route: '/profile',
    },
  ],
  ADMIN: [
    {
      label: 'Admin Dashboard',
      icon: 'dashboard_customize',
      route: '/admin/dashboard',
    },
    {
      label: 'Manage',
      icon: 'manage_accounts',
      collapsible: true,
      children: [
        {
          label: 'Users',
          route: '/admin/users',
        },
        {
          label: 'Roles',
          route: '/admin/roles',
        },
      ],
    },
    {
      label: 'Settings',
      icon: 'settings',
      route: '/admin/settings',
    },
  ],
};

// Optional: function to merge or return role-based config
export function getSidebarItemsForRole(role: UserRole): SidebarItem[] {
  return SidebarConfigs[role] ?? [];
}
