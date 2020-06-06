// tslint:disable-next-line: no-implicit-dependencies
import { browser, logging } from 'protractor';
import { AppPage } from './app.po';
import { AppConfig } from '@conf/app.config';

describe('frontend App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();

    expect(page.getHeading()).toMatch(/`AppConfig.platformIntro.en`/);
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(
      jasmine.objectContaining({
        level: logging.Level.SEVERE
      })
    );
  });
});
