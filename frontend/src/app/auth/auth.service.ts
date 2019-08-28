// tslint:disable: quotemark
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, BehaviorSubject, throwError } from "rxjs";
import { share, map, catchError } from "rxjs/operators";

import { AppConfig } from "../../conf/app.config";
import {
  LoggedUser,
  RegisteredUser,
  JWT,
  TokenRefresh,
  LoginPayload,
  LogoutPayload,
  UserInfo
} from "./models";

@Injectable()
export class AuthService {
  private headers: HttpHeaders = new HttpHeaders({
    "Content-Type": "application/json"
  });

  redirectUrl: string | undefined;
  authenticated$ = new BehaviorSubject<boolean>(this.hasRefreshToken());
  authorized$ = new BehaviorSubject<boolean>(
    // tslint:disable-next-line: no-non-null-assertion
    this.hasAccessToken() && this.tokenExpiration(this.getAccessToken()!) > 1
  );
  timeoutID: any = null;

  constructor(private http: HttpClient, private router: Router) {}

  login(user: LoggedUser): Observable<LoginPayload> {
    const url = `${AppConfig.API_ENDPOINT}/login`;
    return this.http
      .post<LoginPayload>(url, user, { headers: this.headers })
      .pipe(
        map(u => {
          if (u && u.refresh_token) {
            localStorage.setItem("refresh_token", u.refresh_token);
            if (u.access_token) {
              localStorage.setItem("access_token", u.access_token);
              this.authorized$.next(true);
            }
            if (u.username) {
              localStorage.setItem("username", u.username);
              this.authenticated$.next(true);
            }
          }
          return u;
        })
      );
  }

  register(user: RegisteredUser): Observable<any> {
    const url = `${AppConfig.API_ENDPOINT}/registration`;
    return this.http.post(url, user, { headers: this.headers });
  }

  logout(): Promise<any> {
    const url = `${AppConfig.API_ENDPOINT}/logout`;
    return this.http
      .post<LogoutPayload>(url, { headers: this.headers })
      .pipe(
        map(payload => {
          // fixme: feed back to the ui.
          console.debug(`[logout] payload:`, payload);
          this.router.navigateByUrl("/home");
          this.authorized$.next(false);
          localStorage.removeItem("access_token");
          this.authenticated$.next(false);
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("username");
          return payload;
        }),
        catchError(error => {
          console.error(`[logout] error "${error}"`);
          return throwError(error);
        })
      )
      .toPromise();
  }

  ensureAuthorized(): Observable<UserInfo> {
    const url = `${AppConfig.API_ENDPOINT}/user/info`;
    return this.http.get<UserInfo>(url, { headers: this.headers });
  }

  performTokenRefresh(): Observable<TokenRefresh> {
    const url = `${AppConfig.API_ENDPOINT}/token_refresh`;
    const refresh_token = this.getRefreshToken();
    const headers = this.headers.set(
      "Authorization",
      `Bearer ${refresh_token}`
    );
    return this.http.post<TokenRefresh>(url, "", {
      headers: headers
    });
  }

  selfDeleteAccount(_access_token: string): Promise<any> {
    const url = `${AppConfig.API_ENDPOINT}/user/delete`;
    return this.http.delete(url, { headers: this.headers }).toPromise();
  }

  isLoggedIn(): Observable<boolean> {
    return this.authorized$.pipe(share());
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  }

  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  private hasRefreshToken(): boolean {
    return !!localStorage.getItem("refresh_token");
  }

  private hasAccessToken(): boolean {
    return !!localStorage.getItem("access_token");
  }

  decodeToken(token: string): JWT | void {
    if (!token) {
      return;
    }
    const parts: any[] = token.split(".");
    if (parts.length != 3) {
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

  tokenExpiration(token: string): number | void {
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
