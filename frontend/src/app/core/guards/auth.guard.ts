import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';


@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (this.authService.isAuthenticated) {
      // Check for role-based access
      const requiredRole = route.data?.['role'];
      if (requiredRole && !this.hasRequiredRole(requiredRole)) {
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }

    // Not authenticated, redirect to login
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.canActivate(childRoute, state);
  }

  private hasRequiredRole(requiredRole: string): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    switch (requiredRole) {
      case 'ADMIN':
        return currentUser.role === 'ADMIN';
      case 'PREMIUM_USER':
        return (
          currentUser.role === 'PREMIUM_USER' || currentUser.role === 'ADMIN'
        );
      default:
        return true;
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class GuestGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}
