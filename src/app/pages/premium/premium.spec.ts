import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { Premium } from './premium';
import { Auth } from '../../services/auth';
import { BillingService } from '../../services/billing';
import { ToastService } from '../../services/toast';
import { User } from '../../core/models/user.model';

const user = (overrides: Partial<User> = {}): User => ({
  id: 1, name: 'Teszt', email: 'test@example.com', email_verified_at: '2026-10-01T10:00:00Z',
  role: 'student', is_banned: false, xp_points: 0, current_streak: 0, is_premium: false, ...overrides
});

describe('Premium', () => {
  let component: Premium;
  let fixture: ComponentFixture<Premium>;
  let current: User | null = null;
  const auth = { restoreSession: () => of(null), currentUser: () => current };
  const billing = jasmine.createSpyObj<BillingService>('BillingService', ['plans', 'checkout', 'portal']);
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const toast = jasmine.createSpyObj<ToastService>('ToastService', ['error']);

  beforeEach(async () => {
    current = null;
    billing.plans.and.returnValue(of({ configured: true, plans: [] }));
    billing.checkout.and.returnValue(NEVER);
    billing.portal.and.returnValue(NEVER);
    await TestBed.configureTestingModule({
      imports: [Premium],
      providers: [
        { provide: Auth, useValue: auth }, { provide: BillingService, useValue: billing },
        { provide: Router, useValue: router }, { provide: ToastService, useValue: toast }
      ]
    }).overrideComponent(Premium, { set: { template: '' } }).compileComponents();
    fixture = TestBed.createComponent(Premium);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('routes anonymous users to registration before checkout', () => {
    component.startCheckout('monthly');
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
    expect(billing.checkout).not.toHaveBeenCalled();
  });

  it('requires verified email before Stripe checkout', () => {
    current = user({ email_verified_at: null });
    component.startCheckout('yearly');
    expect(router.navigate).toHaveBeenCalledWith(['/verify-email']);
    expect(billing.checkout).not.toHaveBeenCalled();
  });

  it('starts checkout for a verified free user', () => {
    current = user();
    component.startCheckout('monthly');
    expect(billing.checkout).toHaveBeenCalledWith('monthly');
    expect(component.checkoutLoading).toBe('monthly');
  });
});
