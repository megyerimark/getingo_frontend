import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  isLoading = false;
  message = '';
  errorMessage = '';

  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] })
  });

  constructor(private auth: Auth) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.errorMessage = '';

    this.auth.forgotPassword(this.form.getRawValue().email).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: response => this.message = response.message,
      error: error => {
        this.errorMessage = error.status === 429
          ? 'Túl sok kérés érkezett. Próbáld újra később.'
          : 'A kérés most nem sikerült. Próbáld újra.';
      }
    });
  }
}
