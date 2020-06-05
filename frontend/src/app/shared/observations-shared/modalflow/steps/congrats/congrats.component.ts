import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  LOCALE_ID,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  AfterContentChecked
} from '@angular/core';
import { AppConfig } from '@conf/app.config';
import { ObsPostResponsePayload, SharedContext } from '@models/observation.model';
import { FlowComponentInterface } from '@shared/flow/flow';

@Component({
  templateUrl: './congrats.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CongratsComponent implements FlowComponentInterface, OnInit, AfterContentChecked {
  username = '';
  AppConfig = AppConfig;
  @ViewChild('img') img?: ElementRef;
  @Input() data!: SharedContext & { obs: ObsPostResponsePayload };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obs: { [name: string]: any } | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taxon: { [name: string]: any } | undefined = undefined;
  imgMaxHeight: string | undefined;
  bodyHeight: number | undefined;

  constructor(@Inject(LOCALE_ID) public localeId: string) {}

  ngOnInit(): void {
    this.obs = this.data.obs.properties;
    this.taxon = this.obs?.taxref; // server-side taxo

    console.debug(this.obs);

    // new Anonymous(this.localeId)
    this.username =
      localStorage.getItem('username') || this.localeId.startsWith('fr') ? 'Anonyme' : 'Anonymous';
  }

  ngAfterContentChecked(): void {
    const modalContentHeight = document.querySelector(
      'body > ngb-modal-window > div > div.modal-content'
    )?.clientHeight;
    // const modalFooterHeight = document.querySelector(
    //   'body > ngb-modal-window > div > div > app-flow > ng-component > div.modal-footer'
    // )?.clientHeight;
    if (modalContentHeight /*  && modalFooterHeight */) {
      // TODO: min(~95% windowHeight , modalBody)
      this.bodyHeight = modalContentHeight /*  - modalFooterHeight */;

      this.imgMaxHeight = `${this.bodyHeight}px`;

      console.debug(this.bodyHeight);
    }
  }

  next(): void {
    this.data?.next(this.data);
  }
}
