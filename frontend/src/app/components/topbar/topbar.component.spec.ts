import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AuthService } from '@services/auth.service';
import { TopbarComponent } from './topbar.component';
import { APP_BASE_HREF } from '@angular/common';

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, BrowserTransferStateModule],
      providers: [AuthService, { provide: APP_BASE_HREF, useValue: '/my/app' }],
      declarations: [TopbarComponent]
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TopbarComponent);
        component = fixture.componentInstance;
      });
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
