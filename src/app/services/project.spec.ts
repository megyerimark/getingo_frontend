import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectService } from './project';
import { environment } from '../../environments/environment';

describe('ProjectService', () => {
  let service: ProjectService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProjectService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts and restarts projects through explicit timer endpoints', () => {
    service.start(7).subscribe();
    const start = http.expectOne(`${environment.apiUrl}/projects/7/start`);
    expect(start.request.method).toBe('POST');
    expect(start.request.withCredentials).toBeTrue();
    start.flush({ message: 'Elindult', timer_started: true, started_at: '2026-10-07T10:00:00Z', expires_at: '2026-10-07T10:30:00Z', remaining_seconds: 1800, is_expired: false });

    service.restart(7).subscribe();
    const restart = http.expectOne(`${environment.apiUrl}/projects/7/restart`);
    expect(restart.request.method).toBe('POST');
    expect(restart.request.withCredentials).toBeTrue();
    restart.flush({ message: 'Újraindult', timer_started: true, started_at: '2026-10-07T11:00:00Z', expires_at: '2026-10-07T11:30:00Z', remaining_seconds: 1800, is_expired: false });
  });

  it('sends the workspace only to the workspace endpoint', () => {
    const payload = { html_code: '<h1>x</h1>', css_code: 'h1{}', javascript_code: 'console.log(1)' };
    service.saveWorkspace(3, payload).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/projects/3/workspace`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({ message: 'Mentve' });
  });
});
