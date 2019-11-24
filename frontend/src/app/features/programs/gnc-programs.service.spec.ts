import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserTransferStateModule, TransferState } from '@angular/platform-browser';

import { GncProgramsService } from './gnc-programs.service';

describe('GncProgramsService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, BrowserTransferStateModule]
    })
  );

  it('should be created', () => {
    const service: GncProgramsService = TestBed.get(GncProgramsService);
    expect(service).toBeTruthy();
  });
});
