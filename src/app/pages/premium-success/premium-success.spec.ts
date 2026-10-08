import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PremiumSuccess } from './premium-success';
import { BillingService } from '../../services/billing';
import { Auth } from '../../services/auth';

describe('PremiumSuccess', () => {
  let component: PremiumSuccess;
  let fixture: ComponentFixture<PremiumSuccess>;
  const billing = jasmine.createSpyObj<BillingService>('BillingService', ['status']);
  const auth = jasmine.createSpyObj<Auth>('Auth', ['me']);

  beforeEach(async () => {
    billing.status.and.returnValue(of({ plan: 'premium', subscription_status: 'active', subscription_current_period_end: null, is_premium: true }));
    auth.me.and.returnValue(of({ id: 1, name: 'Teszt', email: 'x@y.hu', email_verified_at: '2026-10-01', role: 'student', is_banned: false, xp_points: 0, current_streak: 0 }));
    await TestBed.configureTestingModule({
      imports: [PremiumSuccess],
      providers: [{ provide: BillingService, useValue: billing }, { provide: Auth, useValue: auth }]
    }).overrideComponent(PremiumSuccess, { set: { template: '' } }).compileComponents();
    fixture = TestBed.createComponent(PremiumSuccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => component.ngOnDestroy());

  it('marks checkout as active only after backend status confirms Premium', () => {
    expect(component.state).toBe('active');
    expect(auth.me).toHaveBeenCalled();
  });
});
