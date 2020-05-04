import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { share, map, catchError } from 'rxjs/operators';

import { AppConfig } from '../../conf/app.config';
import {
  UserInfo,
  RegisteringUser,
  LoggedUser,
  LoginPayload,
  LoggingUser,
  LogoutPayload,
  JWT,
  TokenRefresh
} from '../core/models';

@Injectable()
export class AuthService {
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  redirectUrl: string | undefined;
  authenticated$ = new BehaviorSubject<boolean>(this.hasRefreshToken());
  authorized$ = new BehaviorSubject<boolean>(
    this.hasAccessToken() && this.tokenExpiration(this.getAccessToken()) > 1
  );

  constructor(private client: HttpClient, private router: Router) {}

  login(user: LoggingUser): Observable<LoginPayload> {
    const url = `${AppConfig.API_ENDPOINT}/login`;
    return this.client
      .post<LoginPayload>(url, user, { headers: this.headers })
      .pipe(
        map(u => {
          if (u && u.refresh_token) {
            localStorage.setItem('refresh_token', u.refresh_token);
            if (u.access_token) {
              localStorage.setItem('access_token', u.access_token);
              this.authorized$.next(true);
            }
            if (u.username) {
              localStorage.setItem('username', u.username);
              this.authenticated$.next(true);
            }
            if (localStorage.getItem('badges') !== null) {
              localStorage.removeItem('badges');
            }
          }
          return u;
        })
      );
  }

  register(user: RegisteringUser): Observable<LoggedUser | never> {
    const url = `${AppConfig.API_ENDPOINT}/registration`;
    return this.client.post<LoggedUser>(url, user, { headers: this.headers });
  }

  clearIdentity(): void {
    this.router.navigateByUrl('/home');
    this.authorized$.next(false);
    localStorage.removeItem('access_token');
    this.authenticated$.next(false);
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('badges');
  }

  logout(): Promise<LogoutPayload> {
    const url = `${AppConfig.API_ENDPOINT}/logout`;
    return this.client
      .post<LogoutPayload>(url, { headers: this.headers })
      .pipe(
        map(payload => {
          this.clearIdentity();
          this.router.navigate(['/home']);
          return payload;
        }),
        catchError(error => {
          console.error('[logout] error', error);
          this.clearIdentity();
          this.router.navigate(['/home']);
          return throwError(error);
        })
      )
      .toPromise();
  }

  ensureAuthorized(): Observable<UserInfo> {
    const url = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.client.get<UserInfo>(url, { headers: this.headers });
  }

  performTokenRefresh(): Observable<TokenRefresh> {
    const url = `${AppConfig.API_ENDPOINT}/token_refresh`;
    const refreshToken = this.getRefreshToken();
    const headers = this.headers.set('Authorization', `Bearer ${refreshToken}`);
    return this.client.post<TokenRefresh>(url, '', {
      headers
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selfDeleteAccount(_accessToken: string): Promise<LogoutPayload> {
    const url = `${AppConfig.API_ENDPOINT}/user/delete`;
    return this.client
      .delete<LogoutPayload>(url, { headers: this.headers })
      .toPromise();
  }

  isLoggedIn(): Observable<boolean> {
    return this.authorized$.pipe(share());
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private hasRefreshToken(): boolean {
    return !!window.localStorage.getItem('refresh_token');
  }

  private hasAccessToken(): boolean {
    return !!window.localStorage.getItem('access_token');
  }

  decodeToken(token: string): JWT | void {
    if (!token) {
      return;
    }
    const parts: string[] = token.split('.');
    if (parts.length !== 3) {
      return;
    }
    try {
      return {
        header: JSON.parse(atob(parts[0])),
        payload: JSON.parse(atob(parts[1]))
      };
    } catch (error) {
      console.error(error);
      return;
    }
  }

  tokenExpiration(token: string | null): number | void {
    if (!token) {
      return;
    }
    const jwt = this.decodeToken(token);
    if (!jwt) {
      return;
    }
    const now: number = new Date().getTime();
    const delta: number = (jwt.payload.exp * 1000 - now) / 1000.0;
    return delta;
  }
}
