import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { BillingService } from './billing';
import { CsrfService } from './csrf';
import { environment } from '../../environments/environment';

describe('BillingService', () => {
  let service: BillingService;
  let http: HttpTestingController;
  const csrf = jasmine.createSpyObj<CsrfService>('CsrfService', ['ensure']);

  beforeEach(() => {
    csrf.ensure.and.returnValue(of(void 0));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: CsrfService, useValue: csrf }]
    });
    service = TestBed.inject(BillingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtains CSRF before starting Stripe checkout', () => {
    service.checkout('monthly').subscribe();
    expect(csrf.ensure).toHaveBeenCalled();
    const request = http.expectOne(`${environment.apiUrl}/billing/checkout`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ plan: 'monthly' });
    expect(request.request.withCredentials).toBeTrue();
    request.flush({ url: 'https://checkout.example.test/session' });
  });
});
