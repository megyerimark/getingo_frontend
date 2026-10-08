import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { QuizService } from './quiz';

describe('QuizService', () => {
  let service: QuizService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(QuizService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
