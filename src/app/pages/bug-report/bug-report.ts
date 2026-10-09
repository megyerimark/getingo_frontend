import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  BugReportPriority,
  BugReportType,
} from '../../core/models/bug-report.model';

import { BugReportService } from '../../services/bug-report';

@Component({
  selector: 'app-bug-report',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './bug-report.html',
  styleUrl: './bug-report.scss',
})
export class BugReport {
  private readonly fb = inject(FormBuilder);
  private readonly bugReportService = inject(BugReportService);

  submitting = false;
  success = '';
  error = '';

  screenshot: File | null = null;
  screenshotPreview: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(160),
      ],
    ],

    description: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(5000),
      ],
    ],

    type: ['other' as BugReportType, Validators.required],

    priority: ['medium' as BugReportPriority, Validators.required],
  });

  get descriptionLength(): number {
    return this.form.controls.description.value.length;
  }

  setType(type: BugReportType): void {
    this.form.controls.type.setValue(type);
  }

  setPriority(priority: BugReportPriority): void {
    this.form.controls.priority.setValue(priority);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.setScreenshot(file);

    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    const file = event.dataTransfer?.files?.[0];

    if (!file) {
      return;
    }

    this.setScreenshot(file);
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  removeScreenshot(): void {
    this.screenshot = null;

    if (this.screenshotPreview) {
      URL.revokeObjectURL(this.screenshotPreview);
    }

    this.screenshotPreview = null;
  }
  submit(): void {
  console.log('BUG REPORT SUBMIT ELINDULT');

  this.success = '';
  this.error = '';

  console.log('Form valid:', this.form.valid);
  console.log('Form value:', this.form.getRawValue());
  console.log('Title errors:', this.form.controls.title.errors);
  console.log('Description errors:', this.form.controls.description.errors);
  console.log('Type errors:', this.form.controls.type.errors);
  console.log('Priority errors:', this.form.controls.priority.errors);

  if (this.form.invalid) {
    this.form.markAllAsTouched();

    this.error =
      'A hibajelentés nincs teljesen kitöltve. Ellenőrizd a címet és a leírást.';

    console.warn('A form érvénytelen, ezért nem küldünk API kérést.');

    return;
  }

  const value = this.form.getRawValue();

  const payload = {
    title: value.title.trim(),
    description: value.description.trim(),
    type: value.type,
    priority: value.priority,
    pageUrl: window.location.href,
    browser: navigator.userAgent,
    platform: navigator.platform || 'Ismeretlen',
    screenshot: this.screenshot,
  };

  console.log('Küldendő hibajelentés:', payload);

  this.submitting = true;

  this.bugReportService
    .create(payload)
    .pipe(
      finalize(() => {
        this.submitting = false;
        console.log('BUG REPORT REQUEST BEFEJEZŐDÖTT');
      })
    )
    .subscribe({
      next: response => {
        console.log('BUG REPORT SIKER:', response);

        this.success =
          response.message || 'A hibajelentést sikeresen elküldted.';

        this.form.reset({
          title: '',
          description: '',
          type: 'other',
          priority: 'medium',
        });

        this.removeScreenshot();
      },

      error: err => {
        console.error('BUG REPORT HIBA:', err);

        if (err.status === 401) {
          this.error =
            'A hibajelentés elküldéséhez be kell jelentkezned.';
          return;
        }

        if (err.status === 403) {
          this.error =
            'Nincs jogosultságod a hibajelentés elküldéséhez.';
          return;
        }
        if (err.status === 413) {
  this.error =
    'A képernyőkép túl nagy. Maximum 5 MB-os képet tölthetsz fel.';
  return;
}


        if (err.status === 419) {
          this.error =
            'A munkamenet lejárt. Frissítsd az oldalt, majd próbáld újra.';
          return;
        }

        if (err.status === 422) {
          const validationErrors = err?.error?.errors;

          if (validationErrors) {
            const firstError = Object.values(validationErrors)
              .flat()
              .find(message => typeof message === 'string');

            this.error =
              typeof firstError === 'string'
                ? firstError
                : 'A megadott adatok valamelyike hibás.';
          } else {
            this.error =
              err?.error?.message ||
              'A megadott adatok valamelyike hibás.';
          }

          return;
        }

        if (err.status === 500) {
          this.error =
            'Backend hiba történt a hibajelentés mentése közben.';
          return;
        }

        this.error =
          err?.error?.message ||
          `A hibajelentést nem sikerült elküldeni. (${err.status || 'ismeretlen hiba'})`;
      },
    });
}

/*   submit(): void {
    this.success = '';
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const value = this.form.getRawValue();

    this.bugReportService.create({
      title: value.title.trim(),
      description: value.description.trim(),
      type: value.type,
      priority: value.priority,

      pageUrl: window.location.href,
      browser: navigator.userAgent,
      platform: navigator.platform || 'Ismeretlen',

      screenshot: this.screenshot,
    })
    .pipe(
      finalize(() => {
        this.submitting = false;
      })
    )
    .subscribe({
      next: response => {
        this.success = response.message;

        this.form.reset({
          title: '',
          description: '',
          type: 'other',
          priority: 'medium',
        });

        this.removeScreenshot();
      },

      error: error => {
        this.error =
          error?.error?.message
          ?? 'A hibajelentést nem sikerült elküldeni.';
      },
    });
  } */

  private setScreenshot(file: File): void {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    this.error = '';

    if (!allowedTypes.includes(file.type)) {
      this.error = 'Csak PNG, JPG vagy WEBP kép tölthető fel.';
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      this.error = 'A képernyőkép maximum 5 MB lehet.';
      return;
    }

    if (this.screenshotPreview) {
      URL.revokeObjectURL(this.screenshotPreview);
    }

    this.screenshot = file;
    this.screenshotPreview = URL.createObjectURL(file);
  }
}