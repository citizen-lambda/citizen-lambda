import { Component, Inject, LOCALE_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { debounceTime, catchError, map } from 'rxjs/operators';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { RegisteringUser, LoggedUser } from '../models';
import { AuthService } from './../auth.service';
import { AppConfig } from '../../../conf/app.config';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  readonly AppConfig = AppConfig;
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

  onRegister(): void {
    this.auth
      .register(this.user)
      .pipe(
        map((user: LoggedUser) => {
          localStorage.setItem('access_token', user.access_token);
          localStorage.setItem('refresh_token', user.refresh_token);
          localStorage.setItem('username', user.username);
          console.log(user.status);
          if (user) {
            const message = user.message;
            this._success.subscribe(msg => (this.successMessage = msg));
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
        _data => {},
        errorMessage => {
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
