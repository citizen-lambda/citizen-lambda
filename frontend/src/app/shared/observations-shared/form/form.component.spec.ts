import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import L from 'leaflet';

import { ObsFormComponent } from './form.component';
import { FormMapComponent } from './map/map-component';
import { CommentComponent } from './comment/comment.component';
import { DateComponent } from './date/date.component';
import { PhotoComponent } from './photo/photo.component';

describe('ObsFormComponent', () => {
  let component: ObsFormComponent;
  let fixture: ComponentFixture<ObsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModule,
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [NgbActiveModal],
      declarations: [
        ObsFormComponent,
        FormMapComponent,
        CommentComponent,
        DateComponent,
        PhotoComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObsFormComponent);
    component = fixture.componentInstance;
    component.data = { coords: L.latLng(5, 44) };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
