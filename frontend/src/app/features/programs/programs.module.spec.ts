import { ProgramsModule } from './programs.module';

describe('ProgramsModule', () => {
  let programsModule: ProgramsModule;

  beforeEach(() => {
    programsModule = new ProgramsModule();
  });

  it('should create an instance', () => {
    expect(programsModule).toBeTruthy();
  });
});
