import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { RoutedModalObservationDetailsComponent } from './routed-modal-observation-details-component';
import { ObservationsFacade } from '@services/observations-facade.service';
import { ObservationDetailsComponent } from './observation-details.component';

describe('RoutedModalObservationDetailsComponent', () => {
  let component: RoutedModalObservationDetailsComponent;
  let fixture: ComponentFixture<RoutedModalObservationDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, NgbModule],
      declarations: [RoutedModalObservationDetailsComponent, ObservationDetailsComponent],
      providers: [NgbActiveModal, ObservationsFacade]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutedModalObservationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
