import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ObservationDetailsComponent } from './observation-details.component';
import { ObservationsFacade } from '../observations-facade.service';

describe('ObservationDetailsComponent', () => {
  let component: ObservationDetailsComponent;
  let fixture: ComponentFixture<ObservationDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        BrowserTransferStateModule,
        HttpClientTestingModule,
        NgbModule
      ],
      declarations: [ObservationDetailsComponent],
      providers: [ObservationsFacade]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObservationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
