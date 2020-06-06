import { Component, Inject, LOCALE_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { RegisteringUser, RegistrationPayload } from '@models/api.model';
import { AppConfigInterface } from '@models/app-config.model';
import { AppConfig } from '@conf/app.config';
import { AuthService } from '@services/auth.service';

type AppConfigRegister = Pick<AppConfigInterface, 'termsOfUse'>;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  readonly AppConfig: AppConfigRegister = AppConfig;
  localizedTermsOfUseLink = (this.AppConfig.termsOfUse as { [lang: string]: string })[
    this.localeId
  ];
  user: RegisteringUser = {};
  private error = new Subject<string | null>();
  private success = new Subject<string | null>();
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
        map((payload: RegistrationPayload) => {
          // this.auth.login()
          this.auth.saveCredentials(payload);
          const message = payload.message;
          this.success.pipe(take(1)).subscribe(msg => (this.successMessage = msg));
          this.success.pipe(take(1)).subscribe(() => {
            this.successMessage = null;
            this.activeModal.close();
          });
          this.displaySuccessMessage(message);
          // redirect ?
          if (this.auth.redirectUrl) {
            this.router.navigate([this.auth.redirectUrl]);
          }
        }),
        catchError(this.auth.handleError)
      )
      .subscribe(
        () => ({}),
        errorMessage => {
          console.error('errorMessage', errorMessage);
          this.errorMessage = errorMessage;
          this.displayErrorMessage(errorMessage);
        }
      );
  }

  displayErrorMessage(message: string): void {
    this.error.next(message);
    console.error('errorMessage:', message);
  }

  displaySuccessMessage(message: string): void {
    this.success.next(message);
    console.info('successMessage:', message);
  }
}
