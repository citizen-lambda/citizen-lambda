import { TestBed } from '@angular/core/testing';

import { GncService } from './gnc.service';

describe('GncService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GncService = TestBed.inject(GncService);
    expect(service).toBeTruthy();
  });
});
