import { TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';

import { UniqueProgramGuard } from './default-program.guard';

describe('UniqueProgramGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UniqueProgramGuard],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserTransferStateModule
      ]
    });
  });

  it('should ...', inject([UniqueProgramGuard], (guard: UniqueProgramGuard) => {
    expect(guard).toBeTruthy();
  }));
});
