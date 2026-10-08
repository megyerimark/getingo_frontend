import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth';
import { User } from '../../core/models/user.model';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss'
})
export class VerifyEmail implements OnInit {
  user: User | null = null;
  isLoading = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: user => {
        this.user = user;

        if (user.email_verified_at) {
          this.goToApp(user);
        }
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  resend(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.auth.resendVerificationEmail()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: response => this.toast.success(response.message),
        error: error => {
          if (error.status === 429) {
            this.toast.warning('Túl sok kérés. Várj egy kicsit, majd próbáld újra.');
            return;
          }

          this.toast.error(error.error?.message ?? 'Nem sikerült újraküldeni az emailt.');
        }
      });
  }

  refreshStatus(): void {
    this.auth.me().subscribe({
      next: user => {
        this.user = user;

        if (user.email_verified_at) {
          this.goToApp(user);
          return;
        }

        this.toast.info('Az email cím még nincs megerősítve.');
      },
      error: () => this.toast.error('Nem sikerült ellenőrizni az email megerősítését.')
    });
  }

  private goToApp(user: User): void {
    this.router.navigate([user.role === 'admin' ? '/admin' : '/dashboard']);
  }
}
