import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminProject } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';
import { ToastService } from '../../../services/toast';
import { apiErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-admin-projects',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-projects.html',
  styleUrl: './admin-projects.scss'
})
export class AdminProjects implements OnInit {
  projects: AdminProject[] = [];
  editing: AdminProject | null = null;
  total = 0;
  page = 1;
  lastPage = 1;
  loading = false;

  filterForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    difficulty: new FormControl('', { nonNullable: true }),
    validation_type: new FormControl('', { nonNullable: true })
  });

  form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl('', { nonNullable: true, validators: Validators.required }),
    difficulty: new FormControl('kezdő', { nonNullable: true }),
    estimated_time: new FormControl(30, { nonNullable: true, validators: [Validators.min(1)] }),
    xp_reward: new FormControl(25, { nonNullable: true, validators: [Validators.min(0)] }),
    starter_html: new FormControl('', { nonNullable: true }),
    starter_css: new FormControl('', { nonNullable: true }),
    starter_javascript: new FormControl('', { nonNullable: true }),
    validation_type: new FormControl<'console_exact' | 'console_contains' | 'html_contains' | 'css_contains' | 'javascript_contains' | 'source_contains'>('javascript_contains', { nonNullable: true }),
    expected_output: new FormControl('', { nonNullable: true }),
    solution: new FormControl('', { nonNullable: true })
  });

  constructor(private adminService: AdminService, private toast: ToastService) {}

  ngOnInit(): void { this.load(); }

  load(page = this.page): void {
    const filters = this.filterForm.getRawValue();
    this.loading = true;
    this.adminService.getProjectsPage(filters.search, filters.difficulty, filters.validation_type, page).subscribe({
      next: response => {
        this.projects = response.data;
        this.total = response.total;
        this.page = response.current_page;
        this.lastPage = response.last_page;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Nem sikerült betölteni a projekteket.');
      }
    });
  }

  applyFilters(): void { this.load(1); }
  resetFilters(): void { this.filterForm.reset({ search: '', difficulty: '', validation_type: '' }); this.load(1); }
  previousPage(): void { if (this.page > 1) this.load(this.page - 1); }
  nextPage(): void { if (this.page < this.lastPage) this.load(this.page + 1); }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = this.form.getRawValue();
    const request = this.editing
      ? this.adminService.updateProject(this.editing.id, data)
      : this.adminService.createProject(data);
    request.subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Projekt elmentve.');
        this.reset();
        this.load();
      },
      error: error => this.toast.error(this.firstError(error, 'Nem sikerült menteni a projektet.'))
    });
  }

  edit(project: AdminProject): void {
    this.editing = project;
    this.form.setValue({
      title: project.title,
      description: project.description,
      difficulty: project.difficulty,
      estimated_time: project.estimated_time,
      xp_reward: project.xp_reward ?? 25,
      starter_html: project.starter_html ?? '',
      starter_css: project.starter_css ?? '',
      starter_javascript: project.starter_javascript ?? '',
      validation_type: project.validation_type ?? 'javascript_contains',
      expected_output: project.expected_output ?? '',
      solution: project.solution ?? ''
    });
  }

  remove(id: number): void {
    if (!confirm('Biztosan törlöd a projektet?')) return;
    this.adminService.deleteProject(id).subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Projekt törölve.');
        this.load();
      },
      error: error => this.toast.error(this.firstError(error, 'Nem sikerült törölni a projektet.'))
    });
  }

  reset(): void {
    this.editing = null;
    this.form.reset({
      title: '', description: '', difficulty: 'kezdő', estimated_time: 30, xp_reward: 25,
      starter_html: '', starter_css: '', starter_javascript: '', validation_type: 'javascript_contains', expected_output: '', solution: ''
    });
  }

  private firstError(error: unknown, fallback: string): string {
    return apiErrorMessage(error, fallback);
  }
}
