import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';

import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { LoadingBarModule } from '@ngx-loading-bar/core';

import { AppConfig } from '../conf/app.config';
import { AppComponent } from './app.component';
import { TopbarComponent } from './core/topbar/topbar.component';
import { AuthService } from './auth/auth.service';
import { SidebarComponent } from './core/sidebar/sidebar.component';
import { FooterComponent } from './core/footer/footer.component';

// class MockRouter { public navigate() {}; }

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
      declarations: [AppComponent, TopbarComponent, SidebarComponent, FooterComponent],
      imports: [
        BrowserTransferStateModule,
        RouterTestingModule,
        HttpClientTestingModule,
        LoadingBarHttpClientModule,
        LoadingBarRouterModule,
        LoadingBarModule
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title '${AppConfig.appName}'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual(AppConfig.appName);
  });

  it('should render an home anchor', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('header > app-topbar')).toBeTruthy();
  });
});
