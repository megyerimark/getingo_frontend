import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminUser } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';
import { ToastService } from '../../../services/toast';
import { FocusTrapDirective } from '../../../shared/directives/focus-trap.directive';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule, FocusTrapDirective],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss'
})
export class AdminUsers implements OnInit {
  users: AdminUser[] = [];
  loading = true;
  search = '';
  deleteTarget: AdminUser | null = null;
  deletePassword = '';
  deleteReason = '';
  deleteEvidence: File | null = null;
  deleting = false;

  constructor(private adminService: AdminService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminService.getUsers(this.search).subscribe({
      next: users => { this.users = users; this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Nem sikerült betölteni a felhasználókat.'); }
    });
  }

  changeRole(user: AdminUser, role: 'student' | 'admin'): void {
    const previousRole = user.role;
    user.role = role;
    this.adminService.updateUserRole(user.id, role).subscribe({
      next: response => this.toast.success(response.message ?? 'A szerepkör frissítve.'),
      error: error => { user.role = previousRole; this.toast.error(error.error?.message ?? 'Nem sikerült módosítani a szerepkört.'); }
    });
  }

  toggleBan(user: AdminUser): void {
    this.adminService.toggleBan(user.id).subscribe({
      next: response => { user.is_banned = response.is_banned; this.toast.success(response.message ?? 'Állapot frissítve.'); },
      error: error => this.toast.error(error.error?.message ?? 'Nem sikerült módosítani a felhasználó állapotát.')
    });
  }

  openDelete(user: AdminUser): void { this.deleteTarget = user; this.deletePassword = ''; this.deleteReason = ''; this.deleteEvidence = null; }
  cancelDelete(): void { if (!this.deleting) { this.deleteTarget = null; this.deletePassword = ''; this.deleteReason = ''; this.deleteEvidence = null; } }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deleteEvidence = input.files?.[0] ?? null;
  }

  @HostListener('document:keydown.escape') onEscape(): void { this.cancelDelete(); }

  confirmDelete(): void {
    if (!this.deleteTarget || !this.deletePassword || this.deleteReason.trim().length < 5 || this.deleting) return;
    this.deleting = true;
    const id = this.deleteTarget.id;
    this.adminService.deleteUser(id, this.deletePassword, this.deleteReason.trim(), this.deleteEvidence).pipe(finalize(() => this.deleting = false)).subscribe({
      next: response => { this.toast.success(response.message); this.cancelDelete(); this.load(); },
      error: error => this.toast.error(error.error?.message ?? 'A felhasználó törlése nem sikerült.')
    });
  }

  get students(): number { return this.users.filter(user => user.role === 'student').length; }
  get admins(): number { return this.users.filter(user => user.role === 'admin').length; }
  get banned(): number { return this.users.filter(user => user.is_banned).length; }
}
