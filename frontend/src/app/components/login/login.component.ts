import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, throwError, Observable } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AppConfig } from '@conf/app.config';
import { UserLogin, RegistrationPayload } from '@core/models';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  AppConfig = AppConfig;
  private error$ = new Subject<string | null>();
  private success$ = new Subject<string | null>();
  errorMessage: string | null = null;
  successMessage: string | null = null;
  staticAlertClosed = false;
  user: UserLogin = { username: '', password: '' };
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
    protected client: HttpClient,
    private auth: AuthService,
    private router: Router,
    public activeModal: NgbActiveModal
  ) {}

  onLogin(): void {
    this.auth
      .login(this.user)
      .pipe(
        map((user: Partial<RegistrationPayload>) => {
          const message = user.message || '';
          this.success$.pipe(take(1)).subscribe(msg => {
            this.successMessage = msg;
            if (this.activeModal) {
              this.activeModal.close(msg);
            }
          });
          this.displaySuccessMessage(message);

          if (this.auth.redirectUrl) {
            this.router.navigate([this.auth.redirectUrl]);
          }

          return user;
        }),
        catchError(error => this.handleError(error))
      )
      .subscribe(
        () => ({}),
        errorMessage => {
          console.error('errorMessage', errorMessage);
          this.successMessage = null;
          this.errorMessage = errorMessage;
          this.displayErrorMessage(errorMessage);
        }
      );
  }

  onRecoverPassword(): void {
    this.client
      .post<{ message: string }>(`${AppConfig.API_ENDPOINT}/user/resetpasswd`, this.recovery)
      .pipe(catchError(error => this.handleError(error)))
      .subscribe(
        response => {
          if (!(typeof response === 'string')) {
            const message = response.message;
            this.success$.pipe(take(1)).subscribe(msg => (this.successMessage = msg));
            this.success$.pipe(take(1)).subscribe(() => {
              this.activeModal.close();
            });
            this.displaySuccessMessage(message);
          }
          console.error('error', response);
          this.successMessage = null;
          this.errorMessage = response.toString();
          this.displayErrorMessage(response.toString());
        },
        errorMessage => {
          console.error('error', errorMessage);
          this.successMessage = null;
          this.errorMessage = errorMessage;
          this.displayErrorMessage(errorMessage);
        }
      );
  }

  handleError(error: HttpErrorResponse): Observable<string> {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // client-side or network error
      return throwError(errorMessage);
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

  displayErrorMessage(message: string): void {
    this.error$.next(message);
  }

  displaySuccessMessage(message: string): void {
    this.success$.next(message);
  }
}
