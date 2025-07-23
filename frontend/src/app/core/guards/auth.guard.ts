import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { map, Observable } from 'rxjs';
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
  ): Observable<boolean | UrlTree> {
    return this.authService.currentUser$.pipe(
      map((user) => {
        const isAuthenticated = !!user;
        const userRole = user?.role || 'GUEST';
        const allowedRoles = route.data['roles'] as string[] | undefined;

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

          if (userRole === 'ADMIN') {
            return this.router.createUrlTree(['/dashboard/admin']);
          } else if (userRole === 'USER' || userRole === 'COURIER') {
            return this.router.createUrlTree(['/dashboard/user']);
          } else {
            return this.router.createUrlTree(['/auth/login']);
          }
        }

        return true;
      })
    );
  }
}
