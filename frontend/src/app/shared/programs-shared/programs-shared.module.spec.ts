import { TestBed } from '@angular/core/testing';
import { ProgramsSharedModule } from './programs-shared.module';
// import { ProgramsModalComponent } from './programs-modal/programs-modal.component';
// import { ProgramsComponent } from './programs.component/programs.component';
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
