import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  Inject,
  LOCALE_ID,
  TemplateRef
} from '@angular/core';

import { FeatureCollection } from 'geojson';

import { FlowItem } from './flow/flow-item';
import { ModalFlowService } from './modalflow.service';
import { Taxonomy } from '@core/models';

@Component({
  selector: 'app-modalflow',
  templateUrl: './modalflow.component.html',
  styleUrls: ['./modalflow.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ModalFlowComponent {
  @Input()
  data!: {
    coords?: L.LatLng;
    program?: FeatureCollection;
    taxa?: Taxonomy;
  };
  @Input()
  triggerTemplate!: TemplateRef<HTMLElement>;
  @ViewChild('content')
  content!: ElementRef;
  flowitems: FlowItem[] = [];
  timeout: number | undefined;

  constructor(@Inject(LOCALE_ID) readonly localeId: string, public flowService: ModalFlowService) {}

  clicked(): void {
    // console.debug('before getFlowitems:', this.data);
    this.flowitems = this.flowService.getFlowItems({ ...this.data });
    this.flowService.open(this.content);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  step(data: any): void {}
}
