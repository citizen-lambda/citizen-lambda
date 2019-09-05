import { DebugElement } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  async,
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks
} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../auth/auth.service';
import { LoginComponent } from './login.component';
import { By } from '@angular/platform-browser';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModule,
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [AuthService, NgbActiveModal],
      declarations: [LoginComponent]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        de = fixture.debugElement;
        el = de.nativeElement;
      });
  }));

  it('should create', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should be invalid if this an empty login form', async(() => {
    expect(component.recoveringPassword).toBeFalsy();
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('button[type=submit]'));
    const username = component.loginForm.controls.username;
    const password = component.loginForm.controls.password;
    expect(btn).toBeTruthy();
    expect(btn.nativeElement.disabled).toBeTruthy();
    expect(username).toBeTruthy();
    expect(password).toBeTruthy();

    component.loginForm.patchValue({
      username: '',
      password: ''
    });
    fixture.detectChanges();
    expect(password.value).toBe('');

    // expect(username.pristine).toBeFalsy();
    // expect(username.touched).toBeTruthy();

    // expect(component.loginForm.invalid).toBeTruthy();
    // expect(component.loginForm.invalid).toBeFalsy();
    // expect(component.loginForm.valid).toBeFalsy();
    expect(de.query(By.css('form')).classes).toEqual({
      'ng-untouched': true,
      'ng-touched': false,
      'ng-pristine': true,
      'ng-dirty': false,
      'ng-valid': false,
      'ng-invalid': true,
      'ng-pending': false
    });
  }));

  it('should validate upon valid completion if this is a login form', fakeAsync(() => {
    expect(component.recoveringPassword).toBeFalsy();
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('button[type=submit]'));
    const username = component.loginForm.controls['username'];
    const password = component.loginForm.controls['password'];
    expect(btn).toBeTruthy();
    expect(btn.nativeElement.disabled).toBeTruthy();
    expect(username).toBeTruthy();
    expect(password).toBeTruthy();

    component.loginForm.patchValue({
      username: 'abc@abc.com',
      password: 'abcabcd'
    });
    // component.loginForm.patchValue({ password: 'abcabcd' });
    // password.setValue('blahablah');
    fixture.detectChanges();
    // flushMicrotasks();
    expect(username.valid).toBeTruthy();
    // expect(password.dirty).toBeTruthy();
    // expect(password.touched).toBeTruthy();
    expect(password.value).toBe('abcabcd');
    expect(password.errors).toBeNull();
    expect(password.invalid).toBeFalsy();
    expect(password.valid).toBeTruthy();
    expect(component.loginForm.errors).toBeNull();
    expect(component.loginForm.invalid).toBeFalsy();
    expect(component.loginForm.valid).toBeTruthy();
    // FIXME: submission should be enabled
    // expect(btn.nativeElement.disabled).toBeFalsy();
    // spyOn(component, 'onLogin');
    // btn.nativeElement.click();
    // btn.triggerEventHandler('click', {});
    // fixture.detectChanges();
    flushMicrotasks();
    // expect(component.onLogin).toHaveBeenCalled();
  }));
});
