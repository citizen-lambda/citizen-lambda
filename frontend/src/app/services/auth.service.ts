import { Injectable, Inject, LOCALE_ID } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { share, map, catchError, pluck, flatMap } from 'rxjs/operators';

import { AppConfig } from '@conf/app.config';
import {
  RegisteringUser,
  RegistrationPayload,
  LoginPayload,
  UserLogin,
  LogoutPayload,
  JWT,
  AuthorizationPayload,
  UserFeaturesPayload,
  AnonymousUser,
  UserFeatures
} from '@core/models';

@Injectable()
export class AuthService {
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  redirectUrl: string | undefined;
  private _authenticated$ = new BehaviorSubject<boolean>(this.haveIdentification());
  authenticated$ = this._authenticated$.asObservable();

  private _authorized$ = new BehaviorSubject<boolean>(
    this.haveAuthorization() && this.getAuthorizationExpiration(this.getAuthorization()) > 1
  );
  authorized$ = this._authorized$.asObservable();

  userAuthState$: Observable<AnonymousUser | UserFeatures> = this.authenticated$.pipe(
    map(authenticated => {
      if (!authenticated) {
        return of(new AnonymousUser(this.localeId));
      }
      return this.ensureAuthorized().pipe(pluck<UserFeaturesPayload, UserFeatures>('features'));
    }),
    flatMap((user: Observable<AnonymousUser | UserFeatures>) => user)
  );

  constructor(
    @Inject(LOCALE_ID) public localeId: string,
    private client: HttpClient,
    private router: Router
  ) {}

  login(userLogin: UserLogin): Observable<LoginPayload> {
    const url = `${AppConfig.API_ENDPOINT}/login`;
    return this.client
      .post<LoginPayload>(url, userLogin, { headers: this.headers })
      .pipe(
        map(payload => {
          this.saveCredentials(payload);
          if (localStorage.getItem('badges') !== null) {
            localStorage.removeItem('badges');
          }
          return payload;
        }),
        catchError(this.handleError)
      );
  }

  saveCredentials(payload: RegistrationPayload | LoginPayload): void {
    if (payload?.refresh_token && payload?.access_token && payload?.username) {
      this.storeIdentification(payload.refresh_token);
      localStorage.setItem('username', payload.username);
      this.storeAuthorization(payload.access_token);
      this._authenticated$.next(true);
      this._authorized$.next(true);
    }
    // handle localStorage Exception
  }

  register(user: RegisteringUser): Observable<RegistrationPayload | never> {
    const url = `${AppConfig.API_ENDPOINT}/registration`;
    return this.client.post<RegistrationPayload>(url, user, { headers: this.headers });
  }

  clearCredentials(): void {
    this.router.navigateByUrl('/home');
    this._authorized$.next(false);
    localStorage.removeItem('access_token');
    this._authenticated$.next(false);
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
          this.clearCredentials();
          this.router.navigate(['/home']);
          return payload;
        }),
        catchError(error => {
          console.error('[logout] error', error);
          this.clearCredentials();
          this.router.navigate(['/home']);
          return throwError(error);
        })
      )
      .toPromise();
  }

  ensureAuthorized(): Observable<UserFeaturesPayload> {
    const url = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.client.get<UserFeaturesPayload>(url, { headers: this.headers });
  }

  renewAuthorization(): Observable<AuthorizationPayload> {
    const url = `${AppConfig.API_ENDPOINT}/token_refresh`;
    const refreshToken = this.getIdentification();
    const headers = this.headers.set('Authorization', `Bearer ${refreshToken}`);
    return this.client.post<AuthorizationPayload>(url, '', {
      headers
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selfDeleteAccount(_authorization: string): Promise<LogoutPayload> {
    const url = `${AppConfig.API_ENDPOINT}/user/delete`;
    return this.client
      .delete<LogoutPayload>(url, { headers: this.headers })
      .toPromise();
  }

  isLoggedIn(): Observable<boolean> {
    return this.authorized$.pipe(share());
  }

  getIdentification(): string | null {
    return window.localStorage.getItem('refresh_token');
  }

  getAuthorization(): string | null {
    return window.localStorage.getItem('access_token');
  }

  storeIdentification(token: string): void {
    if (token.length > 0) {
      // QuotaExceededError DOMException
      localStorage.setItem('refresh_token', token);
    }
  }

  storeAuthorization(token: string): void {
    if (token.length > 0) {
      // QuotaExceededError DOMException
      localStorage.setItem('access_token', token);
    }
  }

  haveIdentification(): boolean {
    const token = window.localStorage.getItem('refresh_token');
    return (token && token.length > 0) || false;
  }

  haveAuthorization(): boolean {
    const token = window.localStorage.getItem('access_token');
    return (token && token.length > 0) || false;
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

  getAuthorizationExpiration(token: string | null): number | void {
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

  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      console.error('client-side error');
      // client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      if (error.error && error.error.message) {
        // api error
        console.error('api error', error);
        errorMessage = error.error.message;
      } else {
        console.error('server-side error', error);
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    return throwError(errorMessage);
  }
}
