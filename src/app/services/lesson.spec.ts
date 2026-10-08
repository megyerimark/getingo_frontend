import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { LessonService } from './lesson';

describe('LessonService', () => {
  let service: LessonService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(LessonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
