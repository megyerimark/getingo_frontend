import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword {
  readonly token: string;
  isLoading = false;
  completed = false;
  message = '';
  errorMessage = '';

  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]
    }),
    password_confirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(route: ActivatedRoute, private auth: Auth) {
    this.token = route.snapshot.queryParamMap.get('token') ?? '';
    this.form.controls.email.setValue(route.snapshot.queryParamMap.get('email') ?? '');
  }

  onSubmit(): void {
    if (!this.token) {
      this.errorMessage = 'A jelszó-visszaállító link hiányos. Kérj új linket.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (value.password !== value.password_confirmation) {
      this.errorMessage = 'A két jelszó nem egyezik.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';

    this.auth.resetPassword({ token: this.token, ...value }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: response => {
        this.completed = true;
        this.message = response.message;
        this.form.disable();
      },
      error: error => {
        if (error.status === 422) {
          this.errorMessage = error.error?.errors?.email?.[0] ?? error.error?.message ?? 'A link hibás vagy lejárt.';
        } else if (error.status === 429) {
          this.errorMessage = 'Túl sok kérés érkezett. Próbáld újra később.';
        } else {
          this.errorMessage = 'A jelszó módosítása most nem sikerült.';
        }
      }
    });
  }
}
