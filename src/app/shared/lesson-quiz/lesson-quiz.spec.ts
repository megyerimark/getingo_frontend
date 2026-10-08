import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LessonQuiz } from './lesson-quiz';

describe('LessonQuiz', () => {
  let component: LessonQuiz;
  let fixture: ComponentFixture<LessonQuiz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonQuiz],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonQuiz);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
