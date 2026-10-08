import { DatePipe } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { DeletedUserRecord } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';
import { ToastService } from '../../../services/toast';
import { FocusTrapDirective } from '../../../shared/directives/focus-trap.directive';

@Component({
  selector: 'app-admin-deleted-users',
  imports: [DatePipe, FormsModule, FocusTrapDirective],
  templateUrl: './admin-deleted-users.html',
  styleUrl: './admin-deleted-users.scss'
})
export class AdminDeletedUsers implements OnInit {
  records: DeletedUserRecord[] = [];
  search = '';
  loading = true;
  evidenceTarget: DeletedUserRecord | null = null;
  adminPassword = '';
  downloading = false;

  constructor(private admin: AdminService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.admin.getDeletedUsers(this.search).pipe(finalize(() => this.loading = false)).subscribe({
      next: records => this.records = records,
      error: () => this.toast.error('Nem sikerült betölteni a törölt felhasználókat.')
    });
  }

  openEvidence(record: DeletedUserRecord): void {
    if (!record.evidence_original_name) return;
    this.evidenceTarget = record;
    this.adminPassword = '';
  }

  closeEvidence(): void {
    if (this.downloading) return;
    this.evidenceTarget = null;
    this.adminPassword = '';
  }

  downloadEvidence(): void {
    if (!this.evidenceTarget || !this.adminPassword || this.downloading) return;
    const target = this.evidenceTarget;
    this.downloading = true;
    this.admin.unlockSensitive(this.adminPassword).pipe(
      switchMap(response => this.admin.downloadDeletionEvidence(target.id, response.token)),
      finalize(() => this.downloading = false)
    ).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = target.evidence_original_name || 'torlesi-bizonyitek';
        anchor.click();
        URL.revokeObjectURL(url);
        this.closeEvidence();
      },
      error: error => this.toast.error(error.error?.message ?? 'A bizonyíték letöltése nem sikerült.')
    });
  }

  @HostListener('document:keydown.escape') onEscape(): void { this.closeEvidence(); }
}
