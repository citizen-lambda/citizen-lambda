import { Component, ViewEncapsulation, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { FlowComponentInterface } from '../../flow/flow';
import { RegisterComponent } from '../../../../../components/register/register.component';
import { LoginComponent } from '../../../../../components/login/login.component';
import { AuthService } from '../../../../../services/auth.service';

@Component({
  templateUrl: './onboard.component.html',
  styleUrls: ['./onboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class OnboardComponent implements FlowComponentInterface, OnInit {
  RegistrationModalRef!: NgbModalRef;
  LoginModalRef!: NgbModalRef;
  timeout: any;
  @Input() data: any;
  @ViewChild('RegisterComponent', { static: false }) RegisterComponent!: ElementRef;
  @ViewChild('LoginComponent', { static: false }) LoginComponent!: ElementRef;

  constructor(
    private modalService: NgbModal,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.debug('OnboardComponent.OnInit', this.data);
    this.authService.authorized$.subscribe(value => {
      if (value) {
        console.debug('OnboardComponent.next', this.data);
        this.timeout = setTimeout(() => this.data.next(this.data), 0);
      }
    });
  }

  // Actions
  register(): void {
    this.RegistrationModalRef = this.modalService.open(RegisterComponent, {
      centered: true
    });
    this.RegistrationModalRef.result.then(() => {
      this.authService.isLoggedIn().subscribe(
        value => !!value,
        reason => {
          console.debug('registration dismissed:', reason);
        }
      );
    });
  }

  login(): void {
    this.LoginModalRef = this.modalService.open(LoginComponent, {
      centered: true
    });
    this.LoginModalRef.result.then(_ => {
      console.debug('[obs-flow] login resolved');
      this.authService.isLoggedIn().subscribe(
        value => !!value,
        reason => {
          console.debug('login dismissed:', reason);
        }
      );
    });
  }

  continue(): void {
    console.debug('OnboardComponent.next', this.data);
    this.data.next(this.data);
  }
}
