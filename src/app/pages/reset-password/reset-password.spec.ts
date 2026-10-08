import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Auth } from '../../services/auth';
import { ResetPassword } from './reset-password';

function route(token = 'token-123', email = 'mark@example.com'): ActivatedRoute {
  return { snapshot: { queryParamMap: convertToParamMap({ token, email }) } } as unknown as ActivatedRoute;
}

describe('ResetPassword', () => {
  it('prefills the email from the reset link', () => {
    const auth = jasmine.createSpyObj<Auth>('Auth', ['resetPassword']);
    const component = new ResetPassword(route(), auth);
    expect(component.token).toBe('token-123');
    expect(component.form.controls.email.value).toBe('mark@example.com');
  });

  it('rejects different password confirmation values locally', () => {
    const auth = jasmine.createSpyObj<Auth>('Auth', ['resetPassword']);
    const component = new ResetPassword(route(), auth);
    component.form.patchValue({ password: 'NewPassword123', password_confirmation: 'Different123A' });

    component.onSubmit();

    expect(auth.resetPassword).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('nem egyezik');
  });

  it('submits a strong matching password', () => {
    const auth = jasmine.createSpyObj<Auth>('Auth', ['resetPassword']);
    auth.resetPassword.and.returnValue(of({ message: 'A jelszavad sikeresen megváltozott.' }));
    const component = new ResetPassword(route(), auth);
    component.form.patchValue({ password: 'NewPassword123', password_confirmation: 'NewPassword123' });

    component.onSubmit();

    expect(auth.resetPassword).toHaveBeenCalled();
    expect(component.completed).toBeTrue();
  });
});
