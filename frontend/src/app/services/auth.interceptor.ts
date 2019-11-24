import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, finalize, filter, mergeMap } from 'rxjs/operators';
import { Observable, BehaviorSubject, from, of } from 'rxjs';

import { AppConfig } from '../../conf/app.config';
import { AuthService } from './auth.service';
import { TokenRefresh } from '../core/models';
import { ErrorHandler } from './error_handler';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  refreshing = false;
  token$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    public errorHandler: ErrorHandler,
    private auth: AuthService,
    private router: Router
  ) {}

  addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      return request;
    }
  }

  handle401(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // error.error.msg === "Token has expired";
    if (!this.refreshing) {
      this.refreshing = true;
      this.token$.next(null);

      return this.auth.performTokenRefresh().pipe(
        mergeMap((data: TokenRefresh) => {
          if (data && !!data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            this.token$.next(data.access_token);
            const clone = this.addToken(request, data.access_token);
            return next.handle(clone);
          }
          this.router.navigate(['/home']);
          return from(this.auth.logout());
        }),
        catchError(error => {
          console.error(`[AuthInterceptor.performTokenRefresh] error "${error}"`);
          // this.errorHandler.handleError(error);
          this.router.navigate(['/home']);
          return from(this.auth.logout());
        }),
        finalize(() => {
          this.refreshing = false;
        })
      );
    } else {
      return this.token$.pipe(
        filter((token: string | null) => !!token),
        switchMap((token: string) => next.handle(this.addToken(request, token)))
      );
    }
  }

  async handle400(error: HttpErrorResponse): Promise<any> {
    console.error(
      `[400 handler] "${error.error.message || error.message}"`,
      `${error instanceof HttpErrorResponse}`,
      error
    );
    this.errorHandler.handleError(error);
    return from(this.router.navigateByUrl('/home'));
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (
      (request.url.match(AppConfig.API_ENDPOINT) &&
        (request.url.includes('token_refresh') ||
          request.url.includes('registration') ||
          request.url.includes('login'))) ||
      !request.url.match(AppConfig.API_ENDPOINT)
    ) {
      // QUESTION: 3rd party request(cookie!) logging ?
      return next.handle(request);
    }

    // access_token renewal 2min before expiration if interacting with backend api.
    const secondsToExpiration = this.auth.tokenExpiration(
      // tslint:disable-next-line: no-non-null-assertion
      this.auth.getAccessToken()!
    );
    // console.debug(`secs to exp: ${secondsToExpiration}`);
    if (secondsToExpiration && secondsToExpiration <= 120.0) {
      return this.handle401(request, next);
    }

    return (
      next
        // tslint:disable-next-line: no-non-null-assertion
        .handle(this.addToken(request, this.auth.getAccessToken()!))
        .pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.error instanceof ProgressEvent) {
              this.errorHandler.handleError(error);
            } else if (!(error.error instanceof ErrorEvent)) {
              // api call failure response
              switch (error.status) {
                case 400:
                case 422:
                  return this.handle400(error);
                case 401:
                  return this.handle401(request, next);
                default:
                  /*
                  When the flask backend is in debug mode ,
                  no cors header is returned upon error so
                  error.status=0, error.statusText="Unknown Error" and
                  error.message="Http failure response for (unknown url): 0 Unknown Error".
                  See comment in backend/server.py below flask_cors init.
                  */
                  if (error.status !== 0) {
                    this.errorHandler.handleError(error);
                  }
              }
            }
            console.error(error);
            // return from(this.router.navigateByUrl('/404'));
            return of(error);
          })
        )
    );
  }
}