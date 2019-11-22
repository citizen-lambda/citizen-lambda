import { ObservationsModule } from './observations.module';

describe('ObservationsModule', () => {
  let observationsModule: ObservationsModule;

  beforeEach(() => {
    observationsModule = new ObservationsModule();
  });

  it('should create an instance', () => {
    expect(observationsModule).toBeTruthy();
  });
});
