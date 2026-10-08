import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Lesson, LessonCurriculum, LessonSection } from '../../core/models/lesson.model';
import { Auth } from '../../services/auth';
import { FavoriteService } from '../../services/favorite';
import { LessonService } from '../../services/lesson';
import { Note, NoteService } from '../../services/note';
import { PersonalCodeService } from '../../services/personal-code';
import { ProgressService } from '../../services/progress';
import { ToastService } from '../../services/toast';
import { CodeRunner } from '../../shared/code-runner/code-runner';
import { LessonQuiz } from '../../shared/lesson-quiz/lesson-quiz';
import { apiErrorMessage, apiErrorStatus } from '../../core/utils/http-error';

type CodeTab = 'html' | 'css' | 'javascript' | 'python' | 'csharp' | 'sql';

type LessonContentBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'tip'; text: string };

@Component({
  selector: 'app-lessons',
  imports: [ReactiveFormsModule, RouterLink, CodeRunner, LessonQuiz],
  templateUrl: './lessons.html',
  styleUrl: './lessons.scss'
})
export class Lessons implements OnInit {
  lessons: Lesson[] = [];
  curriculum: LessonCurriculum | null = null;
  sections: LessonSection[] = [];
  openSectionIds = new Set<number>();
  notes: Note[] = [];
  activeLesson: Lesson | null = null;
  activeNote: Note | null = null;
  contentBlocks: LessonContentBlock[] = [];

  loading = true;
  codeLoading = false;
  personalCodeSaved = false;
  errorMessage = '';
  focusMode = false;
  favoriteAnimating = false;

  htmlCode = new FormControl('', { nonNullable: true });
  cssCode = new FormControl('', { nonNullable: true });
  javascriptCode = new FormControl('', { nonNullable: true });
  genericCode = new FormControl('', { nonNullable: true });
  note = new FormControl('', { nonNullable: true });
  activeCodeTab: CodeTab = 'html';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService,
    private noteService: NoteService,
    private favoriteService: FavoriteService,
    private progressService: ProgressService,
    private personalCodeService: PersonalCodeService,
    public auth: Auth,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const categoryId = Number(this.route.snapshot.paramMap.get('categoryId'));

    if (!categoryId) {
      this.errorMessage = 'Hibás kategória.';
      this.loading = false;
      return;
    }

    this.lessonService.getCurriculum(categoryId).subscribe({
      next: curriculum => {
        this.curriculum = curriculum;
        this.sections = curriculum.sections;
        this.lessons = curriculum.sections.flatMap(section => section.lessons);

        const lessonId = Number(this.route.snapshot.queryParamMap.get('lesson'));
        const initialLesson = lessonId
          ? this.lessons.find(lesson => lesson.id === lessonId) ?? this.lessons[0] ?? null
          : this.lessons[0] ?? null;

        this.setActiveLesson(initialLesson, false);
        this.loading = false;

        this.auth.restoreSession().subscribe(user => {
          this.loadGuestCode();

          if (user) {
            this.loadNotes();
            this.loadPersonalCode();
          }
        });
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a tananyagokat.';
        this.loading = false;
      }
    });
  }

  setCodeTab(tab: CodeTab): void {
    this.activeCodeTab = tab;
  }

  runtimeLanguage(): 'web' | 'python' | 'csharp' | 'sql' {
    const slug = this.curriculum?.category.slug?.toLowerCase() ?? '';
    if (slug === 'python') return 'python';
    if (slug === 'csharp' || slug === 'c-sharp' || slug === 'cs') return 'csharp';
    if (slug === 'sql') return 'sql';
    return 'web';
  }

  runtimeLabel(): string {
    const labels = { web: 'Web', python: 'Python', csharp: 'C#', sql: 'SQL' } as const;
    return labels[this.runtimeLanguage()];
  }

  isWebLesson(): boolean {
    return this.runtimeLanguage() === 'web';
  }

  toggleFocusMode(): void {
    if (this.auth.currentUser()?.is_premium !== true) {
      this.toast.warning('A Fókusz mód Getingo Premium funkció.');
      return;
    }

    this.focusMode = !this.focusMode;
  }

  toggleSection(sectionId: number): void {
    if (this.openSectionIds.has(sectionId)) {
      this.openSectionIds.delete(sectionId);
      return;
    }

    this.openSectionIds.add(sectionId);
  }

  isSectionOpen(sectionId: number): boolean {
    return this.openSectionIds.has(sectionId);
  }

  isLessonCompleted(lesson: Lesson): boolean {
    return lesson.completed === true;
  }

  sectionCompleted(section: LessonSection): number {
    return section.lessons.filter(lesson => lesson.completed).length;
  }

  getActiveSectionName(): string {
    if (!this.activeLesson) return '';

    return this.sections.find(section =>
      section.lessons.some(lesson => lesson.id === this.activeLesson?.id)
    )?.name ?? '';
  }

  activeLessonNumber(): number {
    if (!this.activeLesson) return 0;
    const index = this.lessons.findIndex(lesson => lesson.id === this.activeLesson?.id);
    return index >= 0 ? index + 1 : 0;
  }

  previousLesson(): Lesson | null {
    if (!this.activeLesson) return null;
    const index = this.lessons.findIndex(lesson => lesson.id === this.activeLesson?.id);
    return index > 0 ? this.lessons[index - 1] : null;
  }

  nextLesson(): Lesson | null {
    if (!this.activeLesson) return null;
    const index = this.lessons.findIndex(lesson => lesson.id === this.activeLesson?.id);
    return index >= 0 && index < this.lessons.length - 1 ? this.lessons[index + 1] : null;
  }

  hasExampleCode(): boolean {
    return Boolean(
      this.activeLesson?.example_html ||
      this.activeLesson?.example_css ||
      this.activeLesson?.example_javascript ||
      this.activeLesson?.example_code
    );
  }

  selectLesson(lesson: Lesson): void {
    this.setActiveLesson(lesson, true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private setActiveLesson(lesson: Lesson | null, updateUrl: boolean): void {
    this.activeLesson = lesson;
    this.errorMessage = '';
    this.contentBlocks = this.parseLessonContent(lesson?.content ?? '');

    if (!lesson) return;

    const section = this.sections.find(item => item.lessons.some(entry => entry.id === lesson.id));
    if (section) this.openSectionIds.add(section.id);

    this.loadActiveNote();
    this.loadGuestCode();
    this.setDefaultCodeTab();

    if (this.auth.isLoggedIn()) {
      this.loadPersonalCode();
    }

    if (updateUrl) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { lesson: lesson.id },
        queryParamsHandling: 'merge'
      });
    }
  }

  private setDefaultCodeTab(): void {
    const runtime = this.runtimeLanguage();
    if (runtime !== 'web') {
      this.activeCodeTab = runtime;
      return;
    }

    if (this.activeLesson?.example_html) {
      this.activeCodeTab = 'html';
      return;
    }

    if (this.activeLesson?.example_css) {
      this.activeCodeTab = 'css';
      return;
    }

    this.activeCodeTab = 'javascript';
  }

  loadGuestCode(): void {
    if (!this.activeLesson) return;

    this.personalCodeSaved = false;
    this.htmlCode.setValue(this.activeLesson.example_html ?? '');
    this.cssCode.setValue(this.activeLesson.example_css ?? '');

    if (this.runtimeLanguage() === 'web') {
      this.javascriptCode.setValue(
        this.activeLesson.example_javascript ?? this.activeLesson.example_code ?? ''
      );
      this.genericCode.setValue('');
      return;
    }

    this.javascriptCode.setValue('');
    this.genericCode.setValue(this.activeLesson.example_code ?? '');
  }

  loadPersonalCode(): void {
    if (!this.activeLesson) return;

    this.codeLoading = true;

    this.personalCodeService.get(this.activeLesson.id).subscribe({
      next: response => {
        this.htmlCode.setValue(response.html ?? '');
        this.cssCode.setValue(response.css ?? '');
        this.javascriptCode.setValue(response.javascript ?? '');
        this.genericCode.setValue(response.code ?? this.activeLesson?.example_code ?? '');
        this.personalCodeSaved = response.saved;
        this.codeLoading = false;
      },
      error: () => {
        this.codeLoading = false;
        this.loadGuestCode();
        this.toast.warning('A mentett saját kód most nem tölthető be. Az eredeti példa látható.');
      }
    });
  }

  savePersonalCode(): void {
    if (!this.activeLesson) return;

    if (!this.auth.isLoggedIn()) {
      this.toast.warning('A saját kód mentéséhez be kell jelentkezned.');
      return;
    }

    const runtime = this.runtimeLanguage();

    this.personalCodeService.save(
      this.activeLesson.id,
      this.htmlCode.value,
      this.cssCode.value,
      this.javascriptCode.value,
      this.genericCode.value,
      runtime === 'web' ? null : runtime
    ).subscribe({
      next: response => {
        this.personalCodeSaved = response.saved;
        this.toast.success(response.message ?? 'Saját kód elmentve.');
      },
      error: error => this.handleError(error)
    });
  }

  resetPersonalCode(): void {
    if (!this.activeLesson) return;

    if (!this.auth.isLoggedIn()) {
      this.loadGuestCode();
      this.toast.success('Az eredeti kód visszaállítva.');
      return;
    }

    if (!confirm('Biztosan visszaállítod az eredeti kódot?')) return;

    this.personalCodeService.reset(this.activeLesson.id).subscribe({
      next: response => {
        this.htmlCode.setValue(response.html ?? '');
        this.cssCode.setValue(response.css ?? '');
        this.javascriptCode.setValue(response.javascript ?? '');
        this.genericCode.setValue(response.code ?? this.activeLesson?.example_code ?? '');
        this.personalCodeSaved = false;
        this.toast.success(response.message ?? 'Kód visszaállítva.');
      },
      error: error => this.handleError(error)
    });
  }

  loadNotes(): void {
    this.noteService.getAll().subscribe({
      next: notes => {
        this.notes = notes;
        this.loadActiveNote();
      },
      error: error => this.handleError(error)
    });
  }

  loadActiveNote(): void {
    if (!this.activeLesson) {
      this.activeNote = null;
      this.note.setValue('');
      return;
    }

    this.activeNote = this.notes.find(note => note.lesson_id === this.activeLesson!.id) ?? null;
    this.note.setValue(this.activeNote?.content ?? '');
  }

  saveNote(): void {
    if (!this.activeLesson || !this.note.value.trim()) return;

    const request = this.activeNote
      ? this.noteService.update(this.activeNote.id, this.note.value.trim())
      : this.noteService.save(this.activeLesson.id, this.note.value.trim());

    request.subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Jegyzet elmentve.');

        const index = this.notes.findIndex(item => item.lesson_id === response.note.lesson_id);
        if (index >= 0) {
          this.notes[index] = response.note;
        } else {
          this.notes.push(response.note);
        }

        this.activeNote = response.note;
      },
      error: error => this.handleError(error)
    });
  }

  deleteNote(): void {
    if (!this.activeNote || !confirm('Biztosan törlöd a jegyzetet?')) return;

    const noteId = this.activeNote.id;

    this.noteService.delete(noteId).subscribe({
      next: response => {
        this.notes = this.notes.filter(item => item.id !== noteId);
        this.activeNote = null;
        this.note.setValue('');
        this.toast.success(response.message ?? 'Jegyzet törölve.');
      },
      error: error => this.handleError(error)
    });
  }

  toggleFavorite(): void {
    if (!this.activeLesson) return;

    this.favoriteService.toggle(this.activeLesson.id).subscribe({
      next: response => {
        if (this.activeLesson) this.activeLesson.is_favorite = response.is_favorite;
        this.favoriteAnimating = true;
        globalThis.setTimeout(() => this.favoriteAnimating = false, 520);
        this.toast.success(response.message ?? 'Kedvencek frissítve.');
      },
      error: error => this.handleError(error)
    });
  }

  completeLesson(): void {
    if (!this.activeLesson || this.activeLesson.completed) return;

    this.progressService.complete(this.activeLesson.id).subscribe({
      next: response => {
        this.toast.success(response.message ?? 'Lecke teljesítve.');
        this.markActiveLessonCompleted();
      },
      error: error => this.handleError(error)
    });
  }

  private markActiveLessonCompleted(): void {
    if (!this.activeLesson || this.activeLesson.completed) return;

    this.activeLesson.completed = true;
    const section = this.sections.find(item =>
      item.lessons.some(lesson => lesson.id === this.activeLesson?.id)
    );

    if (section) {
      const completed = this.sectionCompleted(section);
      section.progress.completed = completed;
      section.progress.percentage = section.progress.total > 0
        ? Math.round((completed / section.progress.total) * 100)
        : 0;
    }

    if (this.curriculum) {
      const completed = this.lessons.filter(lesson => lesson.completed).length;
      this.curriculum.progress.completed = completed;
      this.curriculum.progress.percentage = this.curriculum.progress.total > 0
        ? Math.round((completed / this.curriculum.progress.total) * 100)
        : 0;
    }
  }

  private parseLessonContent(content: string): LessonContentBlock[] {
    const lines = content.replace(/\r\n?/g, '\n').split('\n');
    const blocks: LessonContentBlock[] = [];
    let index = 0;

    const isSpecial = (line: string): boolean => {
      const trimmed = line.trim();
      return !trimmed ||
        trimmed.startsWith('```') ||
        /^#{2,3}\s+/.test(trimmed) ||
        /^>\s?/.test(trimmed) ||
        /^[-*]\s+/.test(trimmed) ||
        /^\d+\.\s+/.test(trimmed);
    };

    while (index < lines.length) {
      const trimmed = lines[index].trim();

      if (!trimmed) {
        index++;
        continue;
      }

      if (trimmed.startsWith('```')) {
        const language = trimmed.slice(3).trim();
        const code: string[] = [];
        index++;

        while (index < lines.length && !lines[index].trim().startsWith('```')) {
          code.push(lines[index]);
          index++;
        }

        if (index < lines.length) index++;
        blocks.push({ type: 'code', language, code: code.join('\n') });
        continue;
      }

      if (trimmed.startsWith('### ')) {
        blocks.push({ type: 'heading', level: 3, text: trimmed.slice(4).trim() });
        index++;
        continue;
      }

      if (trimmed.startsWith('## ')) {
        blocks.push({ type: 'heading', level: 2, text: trimmed.slice(3).trim() });
        index++;
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        const quote: string[] = [];
        while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
          quote.push(lines[index].trim().replace(/^>\s?/, ''));
          index++;
        }
        blocks.push({ type: 'tip', text: quote.join(' ') });
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
          index++;
        }
        blocks.push({ type: 'list', ordered: false, items });
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
          index++;
        }
        blocks.push({ type: 'list', ordered: true, items });
        continue;
      }

      const paragraph: string[] = [trimmed];
      index++;
      while (index < lines.length && !isSpecial(lines[index])) {
        paragraph.push(lines[index].trim());
        index++;
      }
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    }

    return blocks;
  }

  private handleError(error: unknown): void {
    const status = apiErrorStatus(error);
    if (status === 401) {
      this.toast.warning('Ehhez a funkcióhoz be kell jelentkezned.');
      return;
    }
    if (status === 419) {
      this.toast.warning('A munkamenet lejárt. Frissítsd az oldalt és próbáld újra.');
      return;
    }
    this.toast.error(apiErrorMessage(error, status === 422 ? 'Hibás adatok.' : 'Hiba történt.'));
  }
}
