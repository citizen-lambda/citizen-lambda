import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { of } from 'rxjs';

import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { GreeterModule } from '@shared/greeter/greeter.module';
import { ProgramTeaserComponent } from '@shared/program-teaser/program-teaser.component';
import { ProgramContentComponent } from '@shared/program-content/program-content.component';
import { ObsFormComponent } from '@shared/observations-shared/form/form.component';
import { FormMapComponent } from '@shared/observations-shared/form/map/map-component';
import { ObsListComponent } from '@shared/observations-shared/list/list.component';
import { ObsMapComponent } from '@shared/observations-shared/map/map.component';
import { ObsComponent } from './obs.component';
import { ModalFlowComponent } from '@shared/observations-shared/modalflow/modalflow.component';
import { FlowComponent } from '@shared/flow/flow.component';

describe('ObsComponent', () => {
  let component: ObsComponent;
  let fixture: ComponentFixture<ObsComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserTransferStateModule,
          RouterTestingModule,
          HttpClientTestingModule,
          FormsModule,
          ReactiveFormsModule,
          ScrollingModule,
          NgbModule,
          GreeterModule
        ],
        providers: [
          NgbModal,
          {
            provide: ActivatedRoute,
            useValue: {
              params: of({ id: 123 }),
              fragment: of('programs')
            }
          }
        ],
        declarations: [
          ProgramTeaserComponent,
          ProgramContentComponent,
          ObsComponent,
          ObsFormComponent,
          ObsListComponent,
          ObsMapComponent,
          ModalFlowComponent,
          FormMapComponent,
          FlowComponent
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ObsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
