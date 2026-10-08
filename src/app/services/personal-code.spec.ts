import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PersonalCodeService } from './personal-code';

describe('PersonalCodeService', () => {
  let service: PersonalCodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(PersonalCodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
