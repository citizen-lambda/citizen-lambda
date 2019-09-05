import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, FormGroupName, Form, Validators } from '@angular/forms';
import { Subject, throwError } from 'rxjs';
import { debounceTime, map, catchError } from 'rxjs/operators';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '../../../conf/app.config';
import { LoggedUser } from './../models';
import { AuthService } from './../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  AppConfig = AppConfig;
  private _error = new Subject<string | null>();
  private _success = new Subject<string | null>();
  errorMessage: string | null = null;
  successMessage: string | null = null;
  staticAlertClosed = false;
  user: LoggedUser = { username: '', password: '' };
  recovery = { username: '', email: '' };
  recoveringPassword = false;
  loginForm: FormGroup = new FormGroup({
    username: new FormControl(['', Validators.required]),
    password: new FormControl(['', Validators.required])
  });
  recoverForm: FormGroup = new FormGroup({
    username: new FormControl(['', Validators.required]),
    email: new FormControl(['', Validators.required])
  });

  constructor(
    protected http: HttpClient,
    private auth: AuthService,
    private router: Router,
    public activeModal: NgbActiveModal
  ) {}

  onLogin(): void {
    this.auth
      .login(this.user)
      .pipe(
        map(user => {
          if (user) {
            const message = user.message;
            this._success.subscribe(msg => (this.successMessage = msg));
            this._success.pipe(debounceTime(1800)).subscribe(() => {
              this.activeModal.close();
            });
            this.displaySuccessMessage(message);

            if (this.auth.redirectUrl) {
              this.router.navigate([this.auth.redirectUrl]);
            }

            return user;
          }
        }),
        catchError(error => this.handleError(error))
      )
      .subscribe(
        _data => {},
        errorMessage => {
          console.error('errorMessage', errorMessage);
          this.successMessage = null;
          this.errorMessage = errorMessage;
          this.displayErrorMessage(errorMessage);
        }
      );
  }

  onRecoverPassword(): void {
    this.http
      .post<{ message: string }>(`${AppConfig.API_ENDPOINT}/user/resetpasswd`, this.recovery)
      .pipe(catchError(error => this.handleError(error)))
      .subscribe(
        response => {
          const message = response['message'];
          this._success.subscribe(msg => (this.successMessage = msg));
          this._success.pipe(debounceTime(5000)).subscribe(() => {
            this.activeModal.close();
          });
          this.displaySuccessMessage(message);
        },
        errorMessage => {
          console.error('error', errorMessage);
          this.successMessage = null;
          this.errorMessage = errorMessage;
          this.displayErrorMessage(errorMessage);
        }
      );
  }

  handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // client-side or network error
    } else {
      // server-side error
      if (error.error && error.error.message) {
        // api error
        errorMessage = `${error.error.message}`;
      } else if (error.status && error.message) {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      } else {
        errorMessage = error.toString();
      }
    }
    return throwError(errorMessage);
  }

  displayErrorMessage(message: string) {
    this._error.next(message);
  }

  displaySuccessMessage(message: string) {
    this._success.next(message);
  }
}
