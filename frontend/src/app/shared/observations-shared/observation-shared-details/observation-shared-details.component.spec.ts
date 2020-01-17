import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationSharedDetailsComponent } from './observation-shared-details.component';

describe('ObservationSharedDetailsComponent', () => {
  let component: ObservationSharedDetailsComponent;
  let fixture: ComponentFixture<ObservationSharedDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObservationSharedDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObservationSharedDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
