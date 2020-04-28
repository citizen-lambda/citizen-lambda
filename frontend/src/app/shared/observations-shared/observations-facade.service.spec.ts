import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';

import { ObservationsFacade } from './observations-facade.service';

describe('ObservationsFacade', () => {
  let service: ObservationsFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserTransferStateModule, HttpClientTestingModule],
      providers: [ObservationsFacade],
    }).compileComponents();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObservationsFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
