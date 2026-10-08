import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminLesson, AdminLessonSection } from '../../../core/models/admin.model';
import { Category } from '../../../core/models/category.model';
import { AdminService } from '../../../services/admin';
import { CategoryService } from '../../../services/category';
import { ToastService } from '../../../services/toast';
import { apiErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-admin-lessons',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-lessons.html',
  styleUrl: './admin-lessons.scss'
})
export class AdminLessons implements OnInit {
  @ViewChild('lessonTitleInput') private lessonTitleInput?: ElementRef<HTMLInputElement>;
  @ViewChild('lessonEditor') private lessonEditor?: ElementRef<HTMLElement>;
  @ViewChild('sectionEditor') private sectionEditor?: ElementRef<HTMLElement>;

  lessons: AdminLesson[] = [];
  categories: Category[] = [];
  sections: AdminLessonSection[] = [];
  editingLesson: AdminLesson | null = null;
  editingSection: AdminLessonSection | null = null;
  loading = true;
  saving = false;
  sectionSaving = false;

  lessonSearch = new FormControl('', { nonNullable: true });
  lessonCategoryFilter = new FormControl<number | null>(null);
  lessonSectionFilter = new FormControl<number | null>(null);

  sectionForm = new FormGroup({
    category_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    sort_order: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] })
  });

  form = new FormGroup({
    category_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    lesson_section_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    sort_order: new FormControl(10, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    is_published: new FormControl(false, { nonNullable: true }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    content: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    example_code: new FormControl('', { nonNullable: true }),
    example_html: new FormControl('', { nonNullable: true }),
    example_css: new FormControl('', { nonNullable: true }),
    example_javascript: new FormControl('', { nonNullable: true })
  });

  constructor(
    private adminService: AdminService,
    private categoryService: CategoryService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadSections();
    this.loadLessons();

    this.form.controls.category_id.valueChanges.subscribe(categoryId => {
      const sectionId = this.form.controls.lesson_section_id.value;
      if (sectionId && !this.sections.some(section => section.id === sectionId && section.category_id === categoryId)) {
        this.form.controls.lesson_section_id.setValue(null);
      }
    });

    this.form.controls.lesson_section_id.valueChanges.subscribe(sectionId => {
      if (!this.editingLesson && sectionId) {
        this.form.controls.sort_order.setValue(this.nextLessonSortOrder(sectionId));
      }
    });

    this.lessonCategoryFilter.valueChanges.subscribe(categoryId => {
      const sectionId = this.lessonSectionFilter.value;
      if (sectionId && !this.sections.some(section => section.id === sectionId && (!categoryId || section.category_id === categoryId))) {
        this.lessonSectionFilter.setValue(null);
      }
    });
  }

  get availableSections(): AdminLessonSection[] {
    const categoryId = this.form.controls.category_id.value;
    return categoryId ? this.sections.filter(section => section.category_id === categoryId) : [];
  }

  get filterSections(): AdminLessonSection[] {
    const categoryId = this.lessonCategoryFilter.value;
    return categoryId ? this.sections.filter(section => section.category_id === categoryId) : this.sections;
  }

  get filteredLessons(): AdminLesson[] {
    const search = this.lessonSearch.value.trim().toLowerCase();
    const categoryId = this.lessonCategoryFilter.value;
    const sectionId = this.lessonSectionFilter.value;

    return this.lessons.filter(lesson => {
      if (categoryId && lesson.category_id !== categoryId) return false;
      if (sectionId && lesson.lesson_section_id !== sectionId) return false;
      if (!search) return true;

      const category = this.getCategoryName(lesson.category_id).toLowerCase();
      const section = this.getSectionName(lesson.lesson_section_id).toLowerCase();
      return lesson.title.toLowerCase().includes(search)
        || lesson.slug.toLowerCase().includes(search)
        || category.includes(search)
        || section.includes(search);
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: categories => this.categories = categories,
      error: () => this.toast.error('Nem sikerült betölteni a kategóriákat.')
    });
  }

  loadSections(): void {
    this.adminService.getLessonSections().subscribe({
      next: sections => this.sections = sections,
      error: () => this.toast.error('Nem sikerült betölteni a fejezeteket.')
    });
  }

  loadLessons(): void {
    this.loading = true;
    this.adminService.getLessons().subscribe({
      next: lessons => {
        this.lessons = lessons;
        this.loading = false;
        const sectionId = this.form.controls.lesson_section_id.value;
        if (!this.editingLesson && sectionId) {
          this.form.controls.sort_order.setValue(this.nextLessonSortOrder(sectionId));
        }
      },
      error: () => {
        this.toast.error('Nem sikerült betölteni a leckéket.');
        this.loading = false;
      }
    });
  }

  sectionNameChanged(): void {
    if (!this.editingSection) {
      this.sectionForm.controls.slug.setValue(this.slugify(this.sectionForm.controls.name.value));
    }
  }

  titleChanged(): void {
    if (!this.editingLesson) {
      this.form.controls.slug.setValue(this.slugify(this.form.controls.title.value));
    }
  }

  saveSection(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      this.toast.warning('A fejezet mentéséhez töltsd ki a kötelező mezőket.');
      return;
    }

    const categoryId = this.sectionForm.controls.category_id.value;
    if (!categoryId) return;

    const data = {
      category_id: categoryId,
      name: this.sectionForm.controls.name.value.trim(),
      slug: this.sectionForm.controls.slug.value.trim(),
      description: this.sectionForm.controls.description.value.trim() || null,
      sort_order: this.sectionForm.controls.sort_order.value
    };

    this.sectionSaving = true;
    const wasEditing = !!this.editingSection;
    const request = this.editingSection
      ? this.adminService.updateLessonSection(this.editingSection.id, data)
      : this.adminService.createLessonSection(data);

    request.subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Fejezet elmentve.');
        this.sectionSaving = false;

        if (!wasEditing && response.section) {
          this.sections = [
            ...this.sections.filter(section => section.id !== response.section.id),
            response.section as AdminLessonSection
          ].sort((a, b) => a.category_id - b.category_id || a.sort_order - b.sort_order || a.name.localeCompare(b.name));
          this.form.controls.category_id.setValue(categoryId);
          this.form.controls.lesson_section_id.setValue(response.section.id);
          this.form.controls.sort_order.setValue(this.nextLessonSortOrder(response.section.id));
          this.scrollTo(this.lessonEditor);
          queueMicrotask(() => this.lessonTitleInput?.nativeElement.focus());
        }

        this.resetSectionForm(wasEditing ? null : categoryId, wasEditing ? 0 : data.sort_order + 10);
        this.loadSections();
      },
      error: error => {
        this.toast.error(this.firstError(error, 'Nem sikerült menteni a fejezetet.'));
        this.sectionSaving = false;
      }
    });
  }

  editSection(section: AdminLessonSection): void {
    this.editingSection = section;
    this.sectionForm.setValue({
      category_id: section.category_id,
      name: section.name,
      slug: section.slug,
      description: section.description ?? '',
      sort_order: section.sort_order
    });
    this.scrollTo(this.sectionEditor);
  }

  deleteSection(section: AdminLessonSection): void {
    if (!confirm(`Biztosan törlöd ezt a fejezetet: ${section.name}?`)) return;

    this.adminService.deleteLessonSection(section.id).subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Fejezet törölve.');
        this.sections = this.sections.filter(item => item.id !== section.id);
      },
      error: error => this.toast.error(this.firstError(error, 'Nem sikerült törölni a fejezetet.'))
    });
  }

  cancelSectionEdit(): void {
    this.resetSectionForm();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('A tananyag mentéséhez töltsd ki a kategóriát, fejezetet, címet, slugot és a tananyag szövegét.');
      return;
    }

    const categoryId = this.form.controls.category_id.value;
    const sectionId = this.form.controls.lesson_section_id.value;
    if (!categoryId || !sectionId) return;

    const data = {
      category_id: categoryId,
      lesson_section_id: sectionId,
      sort_order: this.form.controls.sort_order.value,
      is_published: this.form.controls.is_published.value,
      title: this.form.controls.title.value.trim(),
      slug: this.form.controls.slug.value.trim(),
      content: this.form.controls.content.value.trim(),
      example_code: this.form.controls.example_code.value,
      example_html: this.form.controls.example_html.value,
      example_css: this.form.controls.example_css.value,
      example_javascript: this.form.controls.example_javascript.value
    };

    this.saving = true;
    const wasEditing = !!this.editingLesson;
    const request = this.editingLesson
      ? this.adminService.updateLesson(this.editingLesson.id, data)
      : this.adminService.createLesson(data);

    request.subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Tananyag elmentve.');
        this.saving = false;

        if (wasEditing) {
          this.resetForm();
        } else {
          this.resetForNextLesson(categoryId, sectionId, data.sort_order + 10);
          queueMicrotask(() => this.lessonTitleInput?.nativeElement.focus());
        }

        this.loadLessons();
        this.loadSections();
      },
      error: error => {
        this.toast.error(this.firstError(error, 'Nem sikerült menteni a tananyagot.'));
        this.saving = false;
      }
    });
  }

  edit(lesson: AdminLesson): void {
    this.editingLesson = lesson;
    this.form.setValue({
      category_id: lesson.category_id,
      lesson_section_id: lesson.lesson_section_id,
      sort_order: lesson.sort_order ?? 10,
      is_published: lesson.is_published ?? false,
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content,
      example_code: lesson.example_code ?? '',
      example_html: lesson.example_html ?? '',
      example_css: lesson.example_css ?? '',
      example_javascript: lesson.example_javascript ?? ''
    });
    this.scrollTo(this.lessonEditor);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteLesson(lesson: AdminLesson): void {
    if (!confirm(`Biztosan törlöd ezt a leckét: ${lesson.title}?`)) return;

    this.adminService.deleteLesson(lesson.id).subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Lecke törölve.');
        this.lessons = this.lessons.filter(item => item.id !== lesson.id);
        if (this.editingLesson?.id === lesson.id) this.resetForm();
        this.loadSections();
      },
      error: error => this.toast.error(this.firstError(error, 'Nem sikerült törölni a leckét.'))
    });
  }

  clearLessonFilters(): void {
    this.lessonSearch.setValue('');
    this.lessonCategoryFilter.setValue(null);
    this.lessonSectionFilter.setValue(null);
  }

  sectionCountForCategory(categoryId: number): number {
    return this.sections.filter(section => section.category_id === categoryId).length;
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(category => category.id === categoryId)?.name ?? 'Ismeretlen kategória';
  }

  getSectionName(sectionId: number | null): string {
    if (!sectionId) return 'Nincs fejezet';
    return this.sections.find(section => section.id === sectionId)?.name ?? 'Ismeretlen fejezet';
  }

  private nextLessonSortOrder(sectionId: number): number {
    const values = this.lessons
      .filter(lesson => lesson.lesson_section_id === sectionId)
      .map(lesson => lesson.sort_order ?? 0);
    return (values.length ? Math.max(...values) : 0) + 10;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private resetSectionForm(categoryId: number | null = null, sortOrder = 0): void {
    this.editingSection = null;
    this.sectionForm.reset({ category_id: categoryId, name: '', slug: '', description: '', sort_order: sortOrder });
  }

  private resetForNextLesson(categoryId: number, sectionId: number, sortOrder: number): void {
    this.editingLesson = null;
    this.form.reset({
      category_id: categoryId,
      lesson_section_id: sectionId,
      sort_order: sortOrder,
      is_published: false,
      title: '',
      slug: '',
      content: '',
      example_code: '',
      example_html: '',
      example_css: '',
      example_javascript: ''
    });
  }

  private resetForm(): void {
    this.editingLesson = null;
    this.form.reset({
      category_id: null,
      lesson_section_id: null,
      sort_order: 10,
      is_published: false,
      title: '',
      slug: '',
      content: '',
      example_code: '',
      example_html: '',
      example_css: '',
      example_javascript: ''
    });
  }

  private scrollTo(element?: ElementRef<HTMLElement>): void {
    queueMicrotask(() => element?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  private firstError(error: unknown, fallback: string): string {
    return apiErrorMessage(error, fallback);
  }
}
