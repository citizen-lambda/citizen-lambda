import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TaxhubService } from './taxhub.service';

describe('TaxhubService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    })
  );

  it('should be created', () => {
    const service: TaxhubService = TestBed.get(TaxhubService);
    expect(service).toBeTruthy();
  });
});
