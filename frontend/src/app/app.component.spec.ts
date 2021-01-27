import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserTransferStateModule } from '@angular/platform-browser';
import { environment } from '../environments/environment';

import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { LoadingBarModule } from '@ngx-loading-bar/core';

import { AppComponent } from './app.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { AuthService } from './services/auth.service';
import { FooterComponent } from './components/footer/footer.component';

// class MockRouter { public navigate() {}; }

describe('AppComponent', () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [AuthService, { provide: APP_BASE_HREF, useValue: '/my/app' }],
        declarations: [AppComponent, TopbarComponent, FooterComponent],
        imports: [
          BrowserTransferStateModule,
          RouterTestingModule,
          HttpClientTestingModule,
          LoadingBarHttpClientModule,
          LoadingBarRouterModule,
          LoadingBarModule,
          ServiceWorkerModule.register('', { enabled: environment.production })
        ]
      }).compileComponents();
    })
  );

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render an home anchor', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('header > app-topbar')).toBeTruthy();
  });
});
