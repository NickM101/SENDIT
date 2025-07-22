import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.isAuthenticated) {
      // Redirect logged-in users to dashboard
      const userRole = this.authService.currentUserValue?.role;
      if (userRole) {
        this.authService.navigateByRole(userRole);
      }
      return false; // Prevent access to guest route
    }
    return true;
  }
}
