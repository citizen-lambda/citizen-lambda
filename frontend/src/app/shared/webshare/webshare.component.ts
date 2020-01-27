import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';

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
      class="btn-big"
      style="background-color: var(--secondary);"
      i18n
    >
      <i class="fa fa-share-alt" aria-hidden="true"></i> Partager
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
    if (this.canShare() && this.data) {
      let url = document.location.href;
      const canonicalElement = document.querySelector('link[rel=canonical]');
      if (canonicalElement !== null) {
        url = canonicalElement.getAttribute('href') as string;
      }
      this.navigator.share({
        title: this.data.title,
        text: this.data.text,
        url: this.data.url ? this.data.url : url
      });
    }
  }
}
