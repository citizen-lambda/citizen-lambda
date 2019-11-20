import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { AnchorNavigation } from '../../../helpers/anav';
import { ProgramTeaserComponent } from './program-teaser.component';

describe('ProgramTeaserComponent', () => {
  let component: ProgramTeaserComponent;
  let fixture: ComponentFixture<ProgramTeaserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NgbTooltipModule
      ],
      declarations: [
        ProgramTeaserComponent,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramTeaserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
