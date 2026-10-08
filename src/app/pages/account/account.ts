import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AccountService } from '../../services/account';
import { Auth } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { PdfExportService } from '../../services/pdf-export';
import { apiErrorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.scss'
})
export class Account implements OnInit {
  isSavingProfile = false;
  isChangingPassword = false;
  isExporting = false;
  isPrintingPdf = false;
  isDeleting = false;
  private originalEmail = '';

  profileForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    current_password: new FormControl('', { nonNullable: true })
  });

  passwordForm = new FormGroup({
    current_password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12)]
    }),
    password_confirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  deleteForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    confirm: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue]
    })
  });

  constructor(
    public auth: Auth,
    private accountService: AccountService,
    private router: Router,
    private toast: ToastService,
    private pdfExport: PdfExportService
  ) {}

  ngOnInit(): void {
    this.auth.ensureSession().subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.originalEmail = user.email.trim().toLowerCase();
      this.profileForm.patchValue({ name: user.name, email: user.email });
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.getRawValue();
    const normalizedEmail = value.email.trim().toLowerCase();
    const emailChanged = normalizedEmail !== this.originalEmail;

    if (emailChanged && !value.current_password.trim()) {
      this.profileForm.controls.current_password.setErrors({ required: true });
      this.toast.warning('Email cím módosításához add meg a jelenlegi jelszavadat.');
      return;
    }

    this.isSavingProfile = true;
    this.accountService.updateProfile({
      name: value.name,
      email: normalizedEmail,
      current_password: value.current_password || undefined
    }).pipe(finalize(() => this.isSavingProfile = false)).subscribe({
      next: response => {
        this.auth.currentUser.set(response.user);
        this.originalEmail = response.user.email.trim().toLowerCase();
        this.profileForm.controls.current_password.setValue('');
        this.toast.success(response.message);

        if (!response.user.email_verified_at) {
          this.router.navigate(['/verify-email']);
        }
      },
      error: error => this.toast.error(this.firstError(error, 'Nem sikerült menteni a fiókadatokat.'))
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.getRawValue();
    if (value.password !== value.password_confirmation) {
      this.passwordForm.controls.password_confirmation.setErrors({ mismatch: true });
      this.toast.warning('A két új jelszó nem egyezik.');
      return;
    }

    this.isChangingPassword = true;
    this.accountService.changePassword(value)
      .pipe(finalize(() => this.isChangingPassword = false))
      .subscribe({
        next: response => {
          this.passwordForm.reset();
          this.toast.success(response.message);
        },
        error: error => this.toast.error(this.firstError(error, 'Nem sikerült megváltoztatni a jelszót.'))
      });
  }

  exportData(): void {
    this.isExporting = true;
    this.accountService.exportData()
      .pipe(finalize(() => this.isExporting = false))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'getingo-szemelyes-adataim.json';
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          this.toast.success('A személyes adataid exportja elkészült.');
        },
        error: () => this.toast.error('Nem sikerült letölteni a személyes adataidat.')
      });
  }

  exportPdf(): void {
    this.isPrintingPdf = true;
    this.accountService.exportData().pipe(finalize(() => this.isPrintingPdf = false)).subscribe({
      next: blob => {
        blob.text().then(text => {
          const data = JSON.parse(text) as Record<string, unknown>;
          this.pdfExport.downloadDataReport(data);
          this.toast.success('A PDF adatjelentés letöltése elindult.');
        }).catch(() => this.toast.error('A PDF adatjelentés feldolgozása nem sikerült.'));
      },
      error: () => this.toast.error('Nem sikerült elkészíteni a PDF adatjelentést.')
    });
  }

  deleteAccount(): void {
    if (this.deleteForm.invalid) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    this.isDeleting = true;
    this.accountService.deleteAccount(this.deleteForm.controls.password.value)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: response => {
          this.auth.clearAuth();
          this.router.navigate(['/']);
          this.toast.success(response.message ?? 'A fiókod törlése sikerült.');
        },
        error: error => this.toast.error(this.firstError(error, 'Nem sikerült törölni a fiókot.'))
      });
  }

  private firstError(error: unknown, fallback: string): string {
    return apiErrorMessage(error, fallback);
  }
}
