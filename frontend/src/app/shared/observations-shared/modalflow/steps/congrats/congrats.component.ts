import {
  Component,
  Input,
  ViewEncapsulation,
  OnInit,
  Inject,
  LOCALE_ID,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef
} from '@angular/core';

import { FlowComponentInterface } from '@shared/observations-shared/modalflow/flow/flow';
import { AppConfig } from '@conf/app.config';
import { ObsPostResponsePayload, SharedContext } from '@features/observations/observation.model';

@Component({
  templateUrl: './congrats.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CongratsComponent implements FlowComponentInterface, OnInit {
  username = '';
  AppConfig = AppConfig;
  @ViewChild('img') img?: ElementRef;
  @ViewChild('fullViewPortContainer') fullViewPortContainer?: ElementRef;
  @Input() data!: SharedContext & { obs: ObsPostResponsePayload };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obs: { [name: string]: any } | undefined = undefined;

  constructor(@Inject(LOCALE_ID) public localeId: string) {}

  ngOnInit(): void {
    console.debug(this.data.obs.properties);
    this.obs = this.data.obs.properties;

    // new Anonymous(this.localeId)
    this.username =
      localStorage.getItem('username') || this.localeId.startsWith('fr') ? 'Anonyme' : 'Anonymous';
  }

  fullViewPortToggle(): void {
    if (
      this.fullViewPortContainer?.nativeElement.classList.value.includes('full-viewport-hidden')
    ) {
      this.fullViewPortContainer?.nativeElement.classList.remove('full-viewport-hidden');
      this.fullViewPortContainer?.nativeElement.classList.add('full-viewport-show');
    } else {
      this.fullViewPortContainer?.nativeElement.classList.remove('full-viewport-show');
      this.fullViewPortContainer?.nativeElement.classList.add('full-viewport-hidden');
    }
  }

  next(): void {
    this.data?.next(this.data);
  }
}
