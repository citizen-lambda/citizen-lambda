import { TestBed } from '@angular/core/testing';
import { ProgramsCarouselModule } from './programs-carousel.module';
describe('ProgramsSharedModule', () => {
  let pipe: ProgramsCarouselModule;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ProgramsCarouselModule] });
    pipe = TestBed.inject(ProgramsCarouselModule);
  });
  it('can load instance', () => {
    expect(pipe).toBeTruthy();
  });
});
