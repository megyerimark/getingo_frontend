import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExerciseService } from './exercise';
import { environment } from '../../environments/environment';

describe('ExerciseService', () => {
  let service: ExerciseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ExerciseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the student exercise endpoints expected by the tasks page', () => {
    service.list('array', 'kezdő').subscribe();
    const list = http.expectOne(req => req.url === `${environment.apiUrl}/exercises` && req.params.get('search') === 'array');
    expect(list.request.withCredentials).toBeTrue();
    list.flush([]);

    service.open(12).subscribe();
    const detail = http.expectOne(`${environment.apiUrl}/exercises/12`);
    expect(detail.request.method).toBe('GET');
    detail.flush({ id: 12, category_id: 1, title: 'Array', description: 'x', difficulty: 'kezdő', estimated_time: 10, submission: null });

    service.save(12, 'megoldás').subscribe();
    const save = http.expectOne(`${environment.apiUrl}/exercises/12/workspace`);
    expect(save.request.method).toBe('PUT');
    expect(save.request.body).toEqual({ answer: 'megoldás' });
    save.flush({ message: 'Mentve', submission: { id: 1, answer: 'megoldás', started_at: null, expires_at: null, completed_at: null, is_expired: false } });
  });
});
