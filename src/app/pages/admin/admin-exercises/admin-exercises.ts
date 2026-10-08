import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { AdminExercise } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';
import { ToastService } from '../../../services/toast';
import { apiErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-admin-exercises',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-exercises.html',
  styleUrl: './admin-exercises.scss'
})
export class AdminExercises implements OnInit {
  exercises: AdminExercise[] = [];
  categories: Category[] = [];
  editing: AdminExercise | null = null;
  total = 0;
  page = 1;
  lastPage = 1;
  loading = false;

  filterForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category_id: new FormControl<number | null>(null),
    difficulty: new FormControl('', { nonNullable: true })
  });

  form = new FormGroup({
    category_id: new FormControl<number | null>(null, Validators.required),
    title: new FormControl('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl('', { nonNullable: true, validators: Validators.required }),
    difficulty: new FormControl('kezdő', { nonNullable: true }),
    estimated_time: new FormControl(20, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(480)] }),
    solution: new FormControl('', { nonNullable: true })
  });

  constructor(private adminService: AdminService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
    this.adminService.getCategories().subscribe({
      next: categories => this.categories = categories,
      error: () => this.toast.error('Nem sikerült betölteni a kategóriákat.')
    });
  }

  load(page = this.page): void {
    const filters = this.filterForm.getRawValue();
    this.loading = true;
    this.adminService.getExercisesPage(filters.search, filters.category_id, filters.difficulty, page).subscribe({
      next: response => {
        this.exercises = response.data;
        this.total = response.total;
        this.page = response.current_page;
        this.lastPage = response.last_page;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Nem sikerült betölteni a feladatokat.');
      }
    });
  }

  applyFilters(): void { this.load(1); }
  resetFilters(): void { this.filterForm.reset({ search: '', category_id: null, difficulty: '' }); this.load(1); }
  previousPage(): void { if (this.page > 1) this.load(this.page - 1); }
  nextPage(): void { if (this.page < this.lastPage) this.load(this.page + 1); }

  categoryName(categoryId: number): string {
    return this.categories.find(category => category.id === categoryId)?.name ?? `#${categoryId}`;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = this.form.getRawValue();
    if (!data.category_id) return;
    const payload: Omit<AdminExercise, 'id'> = {
      category_id: data.category_id,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      estimated_time: data.estimated_time,
      solution: data.solution || null
    };
    const request = this.editing
      ? this.adminService.updateExercise(this.editing.id, payload)
      : this.adminService.createExercise(payload);
    request.subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Feladat elmentve.');
        this.reset();
        this.load();
      },
      error: error => this.toast.error(this.firstError(error, 'Nem sikerült menteni a feladatot.'))
    });
  }

  edit(exercise: AdminExercise): void {
    this.editing = exercise;
    this.form.setValue({
      category_id: exercise.category_id,
      title: exercise.title,
      description: exercise.description,
      difficulty: exercise.difficulty,
      estimated_time: exercise.estimated_time ?? 20,
      solution: exercise.solution ?? ''
    });
  }

  remove(id: number): void {
    if (!confirm('Biztosan törlöd?')) return;
    this.adminService.deleteExercise(id).subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Feladat törölve.');
        this.load();
      },
      error: error => this.toast.error(this.firstError(error, 'Nem sikerült törölni a feladatot.'))
    });
  }

  reset(): void {
    this.editing = null;
    this.form.reset({ category_id: null, title: '', description: '', difficulty: 'kezdő', estimated_time: 20, solution: '' });
  }

  private firstError(error: unknown, fallback: string): string {
    return apiErrorMessage(error, fallback);
  }
}
