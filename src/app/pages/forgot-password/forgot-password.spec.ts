import { of } from 'rxjs';
import { Auth } from '../../services/auth';
import { ForgotPassword } from './forgot-password';

describe('ForgotPassword', () => {
  it('does not submit an invalid email', () => {
    const auth = jasmine.createSpyObj<Auth>('Auth', ['forgotPassword']);
    const component = new ForgotPassword(auth);
    component.form.controls.email.setValue('hibas-email');

    component.onSubmit();

    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('submits a valid email and shows the generic response', () => {
    const auth = jasmine.createSpyObj<Auth>('Auth', ['forgotPassword']);
    auth.forgotPassword.and.returnValue(of({ message: 'Ha létezik a fiók, elküldtük a linket.' }));
    const component = new ForgotPassword(auth);
    component.form.controls.email.setValue('mark@example.com');

    component.onSubmit();

    expect(auth.forgotPassword).toHaveBeenCalledOnceWith('mark@example.com');
    expect(component.message).toContain('elküldtük');
  });
});
