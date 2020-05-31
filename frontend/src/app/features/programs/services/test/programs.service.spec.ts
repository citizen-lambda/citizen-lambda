import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';

import { ProgramsService } from '../programs.service';

describe('ProgramsService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, BrowserTransferStateModule]
    })
  );

  it('should be created', () => {
    const service: ProgramsService = TestBed.inject(ProgramsService);
    expect(service).toBeTruthy();
  });
});
