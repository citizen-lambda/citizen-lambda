import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxonPickerComponent } from './taxon-picker.component';

describe('TaxonPickerComponent', () => {
  let component: TaxonPickerComponent;
  let fixture: ComponentFixture<TaxonPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxonPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxonPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
