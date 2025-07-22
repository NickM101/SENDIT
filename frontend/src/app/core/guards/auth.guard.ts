import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    return this.checkAccess(route, state);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    return this.checkAccess(route, state);
  }

  private checkAccess(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const isAuthenticated = this.authService.isAuthenticated;
    const userRole = this.authService.currentUserValue?.role || 'GUEST';
    const allowedRoles = route.data['roles'] as string[] | undefined;

    console.log(
      `AuthGuard: isAuthenticated=${isAuthenticated}, userRole=${userRole}`
    );

    if (!isAuthenticated) {
      console.warn('User not authenticated. Redirecting to login.');
      return this.router.createUrlTree(['/auth/login']);
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      console.warn(
        `Access denied for role "${userRole}". Required roles: ${allowedRoles.join(
          ', '
        )}`
      );

      // Redirect user based on their role
      if (userRole === 'ADMIN') {
        return this.router.createUrlTree(['/dashboard/admin']);
      } else if (userRole === 'USER' || userRole === 'PREMIUM_USER') {
        return this.router.createUrlTree(['/dashboard/user']);
      } else {
        return this.router.createUrlTree(['/auth/login']);
      }
    }

    // Access granted
    return true;
  }
}
