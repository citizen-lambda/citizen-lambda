import { Component, OnInit, ViewEncapsulation, Inject, LOCALE_ID } from '@angular/core';

@Component({
  selector: 'app-about-custom',
  templateUrl: '../../../../../../config/custom/frontend/about/custom.component.html',
  styleUrls: ['../../../../../../config/custom/frontend/about/custom.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AboutCustomComponent implements OnInit {
  constructor(@Inject(LOCALE_ID) public localeId: string) {}

  ngOnInit() {}
}
