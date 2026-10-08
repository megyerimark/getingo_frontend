import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { NoteService } from './note';

describe('NoteService', () => {
  let service: NoteService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(NoteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
