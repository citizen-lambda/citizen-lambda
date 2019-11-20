import { Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';

import { Feature } from 'geojson';

import { IFlowComponent } from '../../flow/flow';
import { ObsFormComponent } from '../../../form/form.component';

@Component({
  templateUrl: './committed.component.html',
  styleUrls: ['./committed.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CommittedComponent implements IFlowComponent {
  @ViewChild(ObsFormComponent)
  form!: ObsFormComponent;
  @Input() data: any;
  newData: any = {};

  onNewObservation(observation: Feature) {
    if (observation) {
      this.newData = { obs: observation, ...this.data };

      const event: CustomEvent = new CustomEvent('NewObservationEvent', {
        bubbles: true,
        cancelable: true,
        detail: this.newData.obs
      });
      document.dispatchEvent(event);

      this.data.next(this.newData);
    }
  }

  committed() {
    this.form.onFormSubmit();
  }
}
