import { Component, Inject, LOCALE_ID } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { debounceTime, catchError, map } from 'rxjs/operators';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { RegisteringUser, LoggedUser, IAppConfig } from '../../core/models';
import { AppConfig } from '../../../conf/app.config';
import { AuthService } from '../../services/auth.service';

type AppConfigRegister = Pick<IAppConfig, 'termsOfUse'>;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  readonly AppConfig: AppConfigRegister = AppConfig;
  localizedTermsOfUseLink = (this.AppConfig.termsOfUse as { [lang: string]: string })[
    this.localeId
  ];
  user: RegisteringUser = {};
  private _error = new Subject<string | null>();
  private _success = new Subject<string | null>();
  staticAlertClosed = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    private auth: AuthService,
    private router: Router,
    public activeModal: NgbActiveModal
  ) {}

  // a note

  onRegister(): void {
    this.auth
      .register(this.user)
      .pipe(
        map((user: LoggedUser) => {
          console.log(user);
          if (user) {
            localStorage.setItem('access_token', user.access_token);
            this.auth.authorized$.next(true);
            localStorage.setItem('refresh_token', user.refresh_token);
            localStorage.setItem('username', user.username);
            this.auth.authenticated$.next(true);
            const message = user.message;
            this._success.subscribe((msg) => (this.successMessage = msg));
            this._success.pipe(debounceTime(1500)).subscribe(() => {
              this.successMessage = null;
              this.activeModal.close();
            });
            this.displaySuccessMessage(message);
            // redirect ?
            if (this.auth.redirectUrl) {
              this.router.navigate([this.auth.redirectUrl]);
            }
          }
        }),
        catchError(this.handleError)
      )
      .subscribe(
        (_data) => {},
        (errorMessage) => {
          console.error('errorMessage', errorMessage);
          this.errorMessage = errorMessage;
          this.displayErrorMessage(errorMessage);
        }
      );
  }

  handleError(error: HttpErrorResponse) {
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

  displayErrorMessage(message: string) {
    this._error.next(message);
    console.error('errorMessage:', message);
  }

  displaySuccessMessage(message: string) {
    this._success.next(message);
    console.info('successMessage:', message);
  }
}
