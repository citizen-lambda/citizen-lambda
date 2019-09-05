import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { UserInfo } from './models';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  user: UserInfo | undefined;

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(
    _next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    this.authService.redirectUrl = state.url;
    const token = localStorage.getItem('access_token');
    if (token) {
      return this.authService.ensureAuthorized().pipe(
        map((user: UserInfo) => !!user),
        catchError(error => {
          console.error('[AuthGuard] canActivate error', error);
          this.authService.logout();
          this.router.navigate(['/home']);
          return of(false);
        })
      );
    }

    this.authService.logout();
    this.router.navigate(['/home']);
    return false;
  }
}
