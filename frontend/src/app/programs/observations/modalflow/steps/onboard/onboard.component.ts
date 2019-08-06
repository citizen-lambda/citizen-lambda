import {
  Component,
  ViewEncapsulation,
  Input,
  ViewChild,
  ElementRef,
  OnInit
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

import { IFlowComponent } from "../../flow/flow";
import { RegisterComponent } from "../../../../../auth/register/register.component";
import { LoginComponent } from "../../../../../auth/login/login.component";
import { AuthService } from "../../../../../auth/auth.service";

@Component({
  templateUrl: "./onboard.component.html",
  styleUrls: ["./onboard.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class OnboardComponent implements IFlowComponent, OnInit {
  RegistrationModalRef: NgbModalRef;
  LoginModalRef: NgbModalRef;
  timeout: any;
  @Input("data") data: any;
  @ViewChild("RegisterComponent") RegisterComponent: ElementRef;
  @ViewChild("LoginComponent") LoginComponent: ElementRef;

  constructor(
    private modalService: NgbModal,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    console.debug("OnboardComponent.OnInit", this.data);
    this.authService.authorized$.subscribe(value => {
      if (value) {
        console.debug("OnboardComponent.next", this.data);
        this.timeout = setTimeout(() => this.data.next(this.data), 0);
      }
    });
  }

  // Actions
  register() {
    this.RegistrationModalRef = this.modalService.open(RegisterComponent, {
      centered: true
    });
    this.RegistrationModalRef.result.then(_ => {
      this.authService.isLoggedIn().subscribe(
        value => !!value,
        reason => {
          console.debug("registration dismissed:", reason);
        }
      );
    });
  }

  login() {
    this.LoginModalRef = this.modalService.open(LoginComponent, {
      centered: true
    });
    this.LoginModalRef.result.then(_ => {
      console.debug("[obs-flow] login resolved");
      this.authService.isLoggedIn().subscribe(
        value => !!value,
        reason => {
          console.debug("login dismissed:", reason);
        }
      );
    });
  }

  continue() {
    console.debug("OnboardComponent.next", this.data);
    this.data.next(this.data);
  }
}
