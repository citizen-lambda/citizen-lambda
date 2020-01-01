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
import { Taxonomy } from '../../../core/models';


@Component({
  selector: 'app-modalflow',
  templateUrl: './modalflow.component.html',
  styleUrls: ['./modalflow.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ModalFlowComponent {
  @Input()
  data!: {
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: Taxonomy;
  };
  @Input()
  triggerTemplate!: TemplateRef<HTMLElement>;
  @ViewChild('content', { static: false })
  content!: ElementRef;
  flowitems: FlowItem[] = [];
  timeout: any;

  constructor(@Inject(LOCALE_ID) readonly localeId: string, public flowService: ModalFlowService) {}

  clicked() {
    // console.debug('before getFlowitems:', this.data);
    this.flowitems = this.flowService.getFlowItems({ ...this.data });
    this.flowService.open(this.content);
  }

  step(data: any) {}
}
