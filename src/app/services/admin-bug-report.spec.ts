import { TestBed } from '@angular/core/testing';

import { AdminBugReport } from './admin-bug-report';

describe('AdminBugReport', () => {
  let service: AdminBugReport;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminBugReport);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
