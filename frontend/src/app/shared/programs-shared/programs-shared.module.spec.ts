import { TestBed } from '@angular/core/testing';
import { ProgramsSharedModule } from './programs-shared.module';
describe('ProgramsSharedModule', () => {
  let pipe: ProgramsSharedModule;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ProgramsSharedModule] });
    pipe = TestBed.inject(ProgramsSharedModule);
  });
  it('can load instance', () => {
    expect(pipe).toBeTruthy();
  });
});
