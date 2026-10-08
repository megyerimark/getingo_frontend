import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminRevenueResponse } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-admin-revenue',
  imports: [FormsModule],
  templateUrl: './admin-revenue.html',
  styleUrl: './admin-revenue.scss'
})
export class AdminRevenue implements OnInit {
  data: AdminRevenueResponse | null = null;
  loading = true;
  syncing = false;
  error = '';
  months = 12;
  search = '';
  from = '';
  to = '';
  status = 'all';
  exporting = false;

  constructor(private adminService: AdminService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getRevenue(this.months)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: data => this.data = data,
        error: err => this.error = err?.error?.message ?? 'A bevételi statisztika nem tölthető be.'
      });
  }

  syncStripe(): void {
    if (this.syncing) return;
    this.syncing = true;
    this.adminService.syncStripeRevenue()
      .pipe(finalize(() => this.syncing = false))
      .subscribe({
        next: result => { this.toast.success(`${result.synced} Stripe számla szinkronizálva.`); this.load(); },
        error: err => this.toast.error(err?.error?.message ?? 'A Stripe szinkronizálás nem sikerült.')
      });
  }


  filteredPayments() {
    const needle = this.search.trim().toLowerCase();
    return (this.data?.recent_payments ?? []).filter(payment => {
      const text = `${payment.user?.name ?? ''} ${payment.user?.email ?? ''} ${payment.billing_reason ?? ''} ${payment.status}`.toLowerCase();
      const date = payment.paid_at ? payment.paid_at.slice(0, 10) : '';
      return (!needle || text.includes(needle))
        && (this.status === 'all' || payment.status === this.status)
        && (!this.from || date >= this.from)
        && (!this.to || date <= this.to);
    });
  }

  exportCsv(): void {
    if (this.exporting) return;
    this.exporting = true;
    this.adminService.exportRevenue({ search: this.search, from: this.from, to: this.to, status: this.status })
      .pipe(finalize(() => this.exporting = false))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `getingo-bevetelek-${new Date().toISOString().slice(0,10)}.csv`; a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.toast.error('A bevételi export nem sikerült.')
      });
  }

  resetFilters(): void { this.search = ''; this.from = ''; this.to = ''; this.status = 'all'; }

  money(amount: number | null | undefined): string {
    return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format((amount ?? 0) / 100);
  }

  chartMax(): number {
    return Math.max(1, ...(this.data?.monthly.map(item => item.amount) ?? [1]));
  }

  chartHeight(amount: number): number {
    return Math.max(3, Math.round((amount / this.chartMax()) * 100));
  }

  growthClass(): string { return (this.data?.summary.month_growth_percentage ?? 0) >= 0 ? 'up' : 'down'; }

  date(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  billingReason(value: string | null): string {
    const map: Record<string, string> = { subscription_create: 'Új előfizetés', subscription_cycle: 'Megújítás', subscription_update: 'Csomagváltás', manual: 'Manuális' };
    return value ? (map[value] ?? value) : 'Stripe számla';
  }
}
