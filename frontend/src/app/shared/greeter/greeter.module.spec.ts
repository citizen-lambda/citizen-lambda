import { GreeterModule } from './greeter.module';

describe('GreeterModule', () => {
  let greeterModule: GreeterModule;

  beforeEach(() => {
    greeterModule = new GreeterModule();
  });

  it('should create an instance', () => {
    expect(greeterModule).toBeTruthy();
  });
});
