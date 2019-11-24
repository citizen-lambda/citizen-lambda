import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TaxonomyService } from './taxonomy.service';

describe('TaxonomyService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    })
  );

  it('should be created', () => {
    const service: TaxonomyService = TestBed.get(TaxonomyService);
    expect(service).toBeTruthy();
  });
});
