import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AdminQuizzes } from './admin-quizzes';

describe('AdminQuizzes', () => {
  let component: AdminQuizzes;
  let fixture: ComponentFixture<AdminQuizzes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminQuizzes],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminQuizzes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
