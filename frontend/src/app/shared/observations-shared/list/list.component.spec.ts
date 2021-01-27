import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ScrollingModule } from '@angular/cdk/scrolling';

import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ObsListComponent } from './list.component';

describe('ObsListComponent', () => {
  let component: ObsListComponent;
  let fixture: ComponentFixture<ObsListComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [NgbModule, HttpClientTestingModule, RouterTestingModule, ScrollingModule],
        providers: [NgbModal],
        declarations: [ObsListComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ObsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
