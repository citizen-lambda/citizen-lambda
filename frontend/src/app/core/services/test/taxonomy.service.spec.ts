import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TaxonomyService } from '../taxonomy.service';

describe('TaxonomyService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    })
  );

  it('should be created', () => {
    const service: TaxonomyService = TestBed.inject(TaxonomyService);
    expect(service).toBeTruthy();
  });
});
