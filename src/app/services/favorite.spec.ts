import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { FavoriteService } from './favorite';

describe('FavoriteService', () => {
  let service: FavoriteService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(FavoriteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
