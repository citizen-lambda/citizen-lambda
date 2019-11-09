import { TestBed } from '@angular/core/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ProgramsResolve } from './programs-resolve.service';

describe('ProgramsResolve', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      BrowserTransferStateModule,
      HttpClientTestingModule
    ]}));

  it('should be created', () => {
    const service: ProgramsResolve = TestBed.get(ProgramsResolve);
    expect(service).toBeTruthy();
  });
});
