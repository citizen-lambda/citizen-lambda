import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  Route,
  CanActivateChild,
  CanLoad
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { UserFeatures, UserFeaturesPayload } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  user: UserFeatures | undefined;

  constructor(private router: Router, private auth: AuthService) {}

  canActivate(_next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const url = state.url;
    return this.checkLogin(url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): Observable<boolean> {
    const url = `/${route.path}`;

    return this.checkLogin(url);
  }

  checkLogin(url: string): Observable<boolean> {
    this.auth.redirectUrl = url;
    const token = this.auth.haveAuthorization();
    if (token) {
      return this.auth.ensureAuthorized().pipe(
        map((user: UserFeaturesPayload) => !!user === true),
        catchError(error => {
          console.error('[AuthGuard] checkLogin error', error);
          this.auth.logout();
          this.router.navigate(['/home']);
          return of(false);
        })
      );
    }

    this.auth.logout();
    this.router.navigate(['/home']);
    return of(false);
  }
}
