import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebshareComponent } from './webshare.component';

describe('WebshareComponent', () => {
  let component: WebshareComponent;
  let fixture: ComponentFixture<WebshareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WebshareComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebshareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
