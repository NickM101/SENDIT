import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { map, take } from 'rxjs/operators';
import { User } from '../../auth/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.checkAccess(route);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.checkAccess(route);
  }

  private checkAccess(
    route: ActivatedRouteSnapshot
  ): Observable<boolean | UrlTree> {
    return combineLatest([this.authService.isAuthenticated$, this.authService.currentUser$]).pipe(
      take(1),
      map(([isAuthenticated, user]) => {
        if (!isAuthenticated || !user) {
          console.warn('User is not authenticated or user data is missing. Redirecting to login.');
          return this.router.createUrlTree(['/auth/login']);
        }

        const allowedRoles = route.data['roles'] as string[] | undefined;
        const userRole = user.role || 'GUEST';

        if (allowedRoles && !allowedRoles.includes(userRole)) {
          console.warn(
            `Access denied for role "${userRole}". Allowed roles: ${allowedRoles.join(
              ', '
            )}`
          );

          // Redirect based on role
          if (userRole === 'ADMIN') {
            return this.router.createUrlTree(['/dashboard/admin/users']);
          } else if (userRole === 'USER') {
            return this.router.createUrlTree(['/dashboard/user/my-parcels']);
          } else if (userRole === 'COURIER') {
            return this.router.createUrlTree(['/dashboard/courier/track-parcel']);
          } else {
            return this.router.createUrlTree(['/auth/login']);
          }
        }

        console.log('Access granted to route.');
        return true;
      })
    );
  }
}
