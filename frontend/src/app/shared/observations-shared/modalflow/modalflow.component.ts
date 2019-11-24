import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  Inject,
  LOCALE_ID
} from '@angular/core';

import { FlowItem } from './flow/flow-item';
import { ModalFlowService } from './modalflow.service';
import { IAppConfig } from '../../../core/models';
import { AppConfig } from '../../../../conf/app.config';
import { FeatureCollection } from 'geojson';
import { Taxonomy } from '../../../core/models';

type AppConfigModalFlow = Pick<IAppConfig, 'program_add_an_observation'>;

@Component({
  selector: 'app-modalflow',
  templateUrl: './modalflow.component.html',
  styleUrls: ['./modalflow.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ModalFlowComponent {
  readonly appConfig: AppConfigModalFlow = AppConfig;
  program_add_an_observation: string;
  @Input()
  data!: {
    coords?: L.Point;
    program?: FeatureCollection;
    taxa?: Taxonomy;
  };
  @ViewChild('content')
  content!: ElementRef;
  flowitems: FlowItem[] = [];
  timeout: any;

  constructor(@Inject(LOCALE_ID) readonly localeId: string, public flowService: ModalFlowService) {
    this.program_add_an_observation = (this.appConfig.program_add_an_observation as {
      [name: string]: string;
    })[localeId];
  }

  clicked() {
    console.debug('before getFlowitems:', this.data);
    this.flowitems = this.flowService.getFlowItems({ ...this.data });
    this.flowService.open(this.content);
  }

  step(data: any) {}
}
