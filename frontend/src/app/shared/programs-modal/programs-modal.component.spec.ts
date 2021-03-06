import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserTransferStateModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModule, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { GncService } from '@services/gnc.service';
import { ProgramsService } from '@services/programs.service';

import { ProgramsModalComponent } from './programs-modal.component';

describe('ProgramsModalComponent', () => {
  let component: ProgramsModalComponent;
  let fixture: ComponentFixture<ProgramsModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserTransferStateModule,
        HttpClientTestingModule,
        RouterTestingModule,
        NgbModule
      ],
      providers: [NgbModal, NgbActiveModal, GncService, ProgramsService],
      declarations: [ProgramsModalComponent]
    });
    fixture = TestBed.createComponent(ProgramsModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
