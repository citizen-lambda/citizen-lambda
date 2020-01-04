import { Component, OnInit, VERSION } from '@angular/core';

// TODO: mv to AppConfig
declare const require: any;
export const lambdaVersion: string = require('../../../../package.json').version;
// export const angularVersion: string = require('../../../../package.json').dependencies['@angular/core'].replace(/[\^~=]/, '');

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  lambdaVersion = lambdaVersion;
  ngVersion = VERSION.full;

  constructor() {}

  ngOnInit() {}

}
