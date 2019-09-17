import { ObservationsSharedModule } from './observations-shared.module';

describe('ObservationsSharedModule', () => {
  let observationsSharedModule: ObservationsSharedModule;

  beforeEach(() => {
    observationsSharedModule = new ObservationsSharedModule();
  });

  it('should create an instance', () => {
    expect(observationsSharedModule).toBeTruthy();
  });
});
