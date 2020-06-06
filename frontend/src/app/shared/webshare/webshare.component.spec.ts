import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebshareComponent } from './webshare.component';

describe('WebshareComponent', () => {
  let component: WebshareComponent;
  let fixture: ComponentFixture<WebshareComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WebshareComponent]
    });
    fixture = TestBed.createComponent(WebshareComponent);
    component = fixture.componentInstance;
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
