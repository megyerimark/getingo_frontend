import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { AdminService } from '../../../services/admin';
import { ToastService } from '../../../services/toast';
import { apiErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.scss'
})
export class AdminCategories implements OnInit {
  categories: Category[] = [];
  editingId: number | null = null;
  total = 0;
  page = 1;
  lastPage = 1;
  loading = false;

  filterForm = new FormGroup({ search: new FormControl('', { nonNullable: true }) });

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)] }),
    sort_order: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
  });

  constructor(private adminService: AdminService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(page = this.page): void {
    this.loading = true;
    this.adminService.getCategoriesPage(this.filterForm.controls.search.value, page).subscribe({
      next: response => {
        this.categories = response.data;
        this.total = response.total;
        this.page = response.current_page;
        this.lastPage = response.last_page;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Nem sikerült betölteni a kategóriákat.');
      }
    });
  }

  applyFilters(): void { this.load(1); }
  resetFilters(): void { this.filterForm.reset({ search: '' }); this.load(1); }
  previousPage(): void { if (this.page > 1) this.load(this.page - 1); }
  nextPage(): void { if (this.page < this.lastPage) this.load(this.page + 1); }

  edit(category: Category): void {
    this.editingId = category.id;
    this.form.patchValue({ name: category.name, slug: category.slug, sort_order: category.sort_order });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancel(): void {
    this.editingId = null;
    this.form.reset({ name: '', slug: '', sort_order: 0 });
  }

  generateSlug(): void {
    if (this.editingId) return;
    const slug = this.form.controls.name.value.toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    this.form.controls.slug.setValue(slug);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.editingId
      ? this.adminService.updateCategory(this.editingId, this.form.getRawValue())
      : this.adminService.createCategory(this.form.getRawValue());
    request.subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Kategória elmentve.');
        this.cancel();
        this.load();
      },
      error: error => this.toast.error(this.getError(error))
    });
  }

  delete(category: Category): void {
    if (!confirm(`Biztosan törlöd a(z) "${category.name}" kategóriát?`)) return;
    this.adminService.deleteCategory(category.id).subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Kategória törölve.');
        this.load();
      },
      error: error => this.toast.error(this.getError(error))
    });
  }

  private getError(error: unknown): string {
    return apiErrorMessage(error, 'Hiba történt.');
  }
}
