// tslint:disable-next-line: no-implicit-dependencies
import { AppPage } from './app.po';
import { browser, logging } from 'protractor';
import { AppConfig } from '@conf/app.config';

const platformIntro = AppConfig.platformIntro.fr;

describe('frontend App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getHeading()).toMatch(/`platformIntro`/);
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
