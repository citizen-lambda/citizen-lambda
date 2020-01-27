import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AppConfig } from '.././../conf/app.config';

enum MetaNamesStrings {
  'application-name',
  'author',
  'description',
  'keywords',
  'google-site-verification'
}
type MetaNames = keyof typeof MetaNamesStrings;

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  readonly appConfig = AppConfig;

  constructor(
    private readonly metaService: Meta,
    private readonly titleService: Title,
  ) {}

  setMetaTag(metaTag: { name: MetaNames, content: string }): void {
    if (!!metaTag.content) {
      this.metaService.updateTag(metaTag);
    } else {
      const selector = `${MetaNamesStrings[name]}='${metaTag.content}'`;
      this.metaService.removeTag(selector);
    }
  }

  setMetaTags(metaTags: { name: MetaNames, content: string }[]): void {
    for (const metaTag of metaTags) {
      this.setMetaTag(metaTag);
    }
  }

  setTitle(title: string = '') {
    this.titleService.setTitle(`${title} - ${this.appConfig.appName}`);
    if (!!title) {
      this.metaService.updateTag({ name: 'title', content: `${title} - ${this.appConfig.appName}` });
    } else {
      this.metaService.removeTag(`name='title'`);
    }
  }
}
