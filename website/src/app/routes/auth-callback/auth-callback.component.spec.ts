import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthCallbackComponent } from './auth-callback.component';

describe('CliTokenComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AuthCallbackComponent ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
