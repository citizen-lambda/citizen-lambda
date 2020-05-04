import { Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';

import { Feature } from 'geojson';

import { FlowComponentInterface } from '../../flow/flow';
import { ObsFormComponent } from '../../../form/form.component';
import { ObsPostResponsePayload } from '../../../../../features/observations/observation.model';

@Component({
  templateUrl: './committed.component.html',
  styleUrls: ['./committed.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements FlowComponentInterface {
  @ViewChild(ObsFormComponent, { static: true }) form!: ObsFormComponent;
  @Input() data: any;
  newData: any = {};

  observationSubmitted(observation: ObsPostResponsePayload): void {
    if (observation) {
      this.newData = { obs: observation, ...this.data };

      const event: CustomEvent = new CustomEvent('NewObservationEvent', {
        bubbles: true,
        cancelable: true,
        detail: this.newData.obs
      });
      console.debug('dispatching');
      document.dispatchEvent(event);

      console.debug(this.newData);
      this.data.next(this.newData);
    }
  }

  committed(): void {
    this.form.onFormSubmit();
  }
}
