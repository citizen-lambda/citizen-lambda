import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ProgramsCarouselComponent } from './programs-carousel.component';

describe('ProgramsCarouselComponent', () => {
  let component: ProgramsCarouselComponent;
  let fixture: ComponentFixture<ProgramsCarouselComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, NgbTooltipModule],
      declarations: [ProgramsCarouselComponent]
    });
    fixture = TestBed.createComponent(ProgramsCarouselComponent);
    component = fixture.componentInstance;
  });
  it('can load instance', () => {
    expect(component).toBeTruthy();
  });
});
