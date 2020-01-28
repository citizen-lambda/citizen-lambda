import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { of } from 'rxjs';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: ReadonlyArray<File>;
}

export declare interface Navigator {
  share?: (data?: ShareData) => Promise<void>;
  canShare?: (data?: ShareData) => boolean;
}

@Component({
  selector: 'app-webshare',
  template: `
    <button
      *ngIf="canShare()"
      (click)="share()"
      [disabled]="!canShare()"
      class="btn-big"
      style="background-color: var(--secondary);"
    >
      <ng-content></ng-content>
    </button>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WebshareComponent implements OnInit {
  navigator: any = null;
  @Input() data?: ShareData;

  constructor() {
    this.navigator = window.navigator;
  }

  ngOnInit() {}

  canShare() {
    return 'share' in this.navigator;
  }

  share() {
    of(this.data).subscribe(data => {
      let url = document.location.href;
      const canonicalElement = document.querySelector('link[rel=canonical]');
      if (canonicalElement !== null) {
        url = canonicalElement.getAttribute('href') as string;
      }
      if ('share' in this.navigator) {
        this.navigator.share({
          // tslint:disable-next-line: no-non-null-assertion
          title: data!.title,
          // tslint:disable-next-line: no-non-null-assertion
          text: data!.text,
          // tslint:disable-next-line: no-non-null-assertion
          url: data!.url ? data!.url : url
        });
      } else {
        console.debug({
          // tslint:disable-next-line: no-non-null-assertion
          title: data!.title,
          // tslint:disable-next-line: no-non-null-assertion
          text: data!.text,
          // tslint:disable-next-line: no-non-null-assertion
          url: data!.url ? data!.url : url
        });
      }
    });
  }
}
