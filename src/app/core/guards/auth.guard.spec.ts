import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { Auth } from '../../services/auth';
import { authGuard } from './auth.guard';

function user() {
  return {
    id: 1,
    name: 'Mark',
    email: 'mark@example.com',
    email_verified_at: '2026-10-03T08:00:00Z',
    role: 'student' as const,
    is_banned: false,
    xp_points: 0,
    current_streak: 0
  };
}

describe('authGuard', () => {
  let auth: jasmine.SpyObj<Auth>;
  let router: Router;

  beforeEach(() => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['ensureSession']);
    TestBed.configureTestingModule({
      providers: [{ provide: Auth, useValue: auth }, provideRouter([])]
    });
    router = TestBed.inject(Router);
  });

  it('allows an authenticated user', async () => {
    auth.ensureSession.and.returnValue(of(user()));
    const result = await TestBed.runInInjectionContext(() => firstValueFrom(authGuard(null as never, null as never) as Observable<boolean | UrlTree>));
    expect(result).toBeTrue();
  });

  it('redirects an anonymous user to login', async () => {
    auth.ensureSession.and.returnValue(of(null));
    const result = await TestBed.runInInjectionContext(() => firstValueFrom(authGuard(null as never, null as never) as Observable<boolean | UrlTree>));
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
