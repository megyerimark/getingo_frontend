import { TestBed } from '@angular/core/testing';

import { BugReport } from './bug-report';

describe('BugReport', () => {
  let service: BugReport;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BugReport);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
