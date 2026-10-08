import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AccountService } from './account';

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(AccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
