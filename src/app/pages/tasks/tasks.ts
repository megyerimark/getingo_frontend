import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ExerciseService, StudentExercise } from '../../services/exercise';
import { ToastService } from '../../services/toast';
import { FocusTrapDirective } from '../../shared/directives/focus-trap.directive';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule, FocusTrapDirective],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss'
})
export class Tasks implements OnInit, OnDestroy {
  items: StudentExercise[] = [];
  selected: StudentExercise | null = null;
  search = '';
  difficulty = '';
  answer = '';
  loading = true;
  opening = false;
  saving = false;
  now = Date.now();
  private timer?: ReturnType<typeof setInterval>;

  constructor(private exercises: ExerciseService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
    this.timer = setInterval(() => this.now = Date.now(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  load(): void {
    this.loading = true;
    this.exercises.list(this.search, this.difficulty).pipe(finalize(() => this.loading = false)).subscribe({
      next: items => this.items = items,
      error: () => this.toast.error('A feladatok betöltése nem sikerült.')
    });
  }

  open(item: StudentExercise): void {
    this.opening = true;
    this.exercises.open(item.id).pipe(finalize(() => this.opening = false)).subscribe({
      next: detail => {
        this.selected = detail;
        this.answer = detail.submission?.answer ?? '';
        this.now = Date.now();
      },
      error: () => this.toast.error('A feladat megnyitása nem sikerült.')
    });
  }

  save(): void {
    if (!this.selected || this.expired || this.saving) return;
    this.saving = true;
    this.exercises.save(this.selected.id, this.answer).pipe(finalize(() => this.saving = false)).subscribe({
      next: response => {
        if (this.selected) this.selected.submission = response.submission;
        this.toast.success(response.message);
      },
      error: err => {
        if (err?.status === 423 && this.selected?.submission) this.selected.submission.is_expired = true;
        this.toast.error(err?.error?.message ?? 'A mentés nem sikerült.');
      }
    });
  }

  close(): void { this.selected = null; this.answer = ''; }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }

  get expired(): boolean {
    const expiry = this.selected?.submission?.expires_at;
    return !!this.selected?.submission?.is_expired || (!!expiry && this.now >= new Date(expiry).getTime());
  }

  timeLeft(item = this.selected): string {
    const expiry = item?.submission?.expires_at;
    if (!expiry) return `${item?.estimated_time ?? 0}:00`;
    const seconds = Math.max(0, Math.floor((new Date(expiry).getTime() - this.now) / 1000));
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
