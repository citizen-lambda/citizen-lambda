// tslint:disable-next-line: no-implicit-dependencies
import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getHeading() {
    return element(by.css('app-root h1')).getText();
  }

  getParagraphText(name: string) {
    return element(by.css('app-root p#' + name)).getText();
  }
}
