import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CompanionActionEvent, CompanionActionKey, CompanionState } from '../../core/models/companion.model';
import {
  DashboardLearningData,
  DashboardNote,
  DailyGoal,
  LearningPathItem
} from '../../core/models/dashboard.model';
import { User } from '../../core/models/user.model';
import { AccountService } from '../../services/account';
import { Auth } from '../../services/auth';
import { CompanionService } from '../../services/companion';
import { DashboardService } from '../../services/dashboard';
import { NoteService } from '../../services/note';
import { MascotStage } from '../../shared/mascot-stage/mascot-stage';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, RouterLink, MascotStage],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  user: User | null = null;
  notes: DashboardNote[] = [];
  companionState: CompanionState | null = null;
  learningData: DashboardLearningData | null = null;
  learningLoading = true;
  learningError = '';
  isLoading = true;
  notesLoading = true;
  companionLoading = true;
  companionAction: CompanionActionKey | null = null;
  lastCompanionAction: CompanionActionKey | null = null;
  companionActionEvent: CompanionActionEvent | null = null;
  buddyAnimating = false;
  isLoggingOut = false;
  companionMessage = '';
  companionError = '';
  showDeletePanel = false;
  isDeleting = false;
  deleteError = '';
  private companionActionEventId = 0;

  deleteForm = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirm: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] })
  });

  constructor(
    private auth: Auth,
    private accountService: AccountService,
    private router: Router,
    private noteService: NoteService,
    private companionService: CompanionService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.isLoading = false;
    this.loadLearningDashboard();
  }

  loadLearningDashboard(): void {
    this.learningLoading = true;
    this.notesLoading = true;
    this.companionLoading = true;
    this.learningError = '';
    this.companionError = '';

    this.dashboardService.getLearningDashboard().subscribe({
      next: data => {
        this.learningData = data;
        this.notes = data.notes;
        this.companionState = data.companion;
        this.learningLoading = false;
        this.notesLoading = false;
        this.companionLoading = false;

        if (this.user) {
          this.user.current_streak = data.user.current_streak;
          this.user.longest_streak = data.user.longest_streak;
          this.user.xp_points = data.user.xp_points;
        }
      },
      error: () => {
        this.learningError = 'A személyes dashboard most nem tölthető be.';
        this.companionError = 'A Getingo Buddy most nem tölthető be.';
        this.learningLoading = false;
        this.notesLoading = false;
        this.companionLoading = false;
      }
    });
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 10) return 'Jó reggelt';
    if (hour < 18) return 'Szia';
    return 'Jó estét';
  }

  firstName(): string {
    return (this.user?.name ?? '').trim().split(/\s+/)[0] || 'Tanuló';
  }

  dailyGoalIcon(goal: DailyGoal): string {
    if (goal.key === 'lesson') return 'bi-book-half';
    if (goal.key === 'quiz') return 'bi-patch-question-fill';
    return 'bi-code-square';
  }

  dailyGoalRoute(goal: DailyGoal): string | Array<string | number> {
    const match = goal.url.match(/^\/categories\/(\d+)\/lessons/);
    if (match) return ['/categories', Number(match[1]), 'lessons'];
    return goal.url;
  }

  dailyGoalQueryParams(goal: DailyGoal): Record<string, number> | null {
    const match = goal.url.match(/[?&]lesson=(\d+)/);
    return match ? { lesson: Number(match[1]) } : null;
  }

  pathIcon(item: LearningPathItem): string {
    const value = `${item.name} ${item.slug}`.toLowerCase();
    if (value.includes('javascript')) return 'JS';
    if (value.includes('html')) return 'HTML';
    if (value.includes('css')) return 'CSS';
    if (value.includes('angular')) return 'A';
    if (value.includes('laravel')) return 'L';
    return item.name.slice(0, 2).toUpperCase();
  }

  careForCompanion(action: CompanionActionKey): void {
    if (this.companionAction) return;

    this.companionAction = action;
    this.companionMessage = '';
    this.companionError = '';

    this.companionService.performAction(action).subscribe({
      next: response => {
        this.companionState = response.state;
        if (this.learningData) this.learningData.companion = response.state;
        this.companionMessage = response.message;
        this.lastCompanionAction = action;
        this.companionActionEvent = { id: ++this.companionActionEventId, type: action };
        this.companionAction = null;
        this.triggerBuddyAnimation();
      },
      error: err => {
        this.companionError =
          err?.error?.errors?.action?.[0] ??
          err?.error?.message ??
          'A művelet nem sikerült.';
        this.companionAction = null;
      }
    });
  }

  actionCost(action: CompanionActionKey): number {
    return this.companionState?.actions.find(item => item.key === action)?.cost ?? 0;
  }

  actionGrowth(action: CompanionActionKey): number {
    return this.companionState?.actions.find(item => item.key === action)?.growth ?? 0;
  }

  actionLabel(action: CompanionActionKey): string {
    return this.companionState?.actions.find(item => item.key === action)?.label ?? action;
  }

  actionIcon(action: CompanionActionKey | null): string {
    if (action === 'water') return '💧';
    if (action === 'feed') return '🐟';
    if (action === 'play') return '✨';
    return '';
  }

  moodEmoji(): string {
    switch (this.companionState?.mood.key) {
      case 'radiant': return '🌟';
      case 'happy': return '😸';
      case 'calm': return '🙂';
      default: return '😴';
    }
  }

  companionTip(): string {
    if (!this.companionState) return 'Teljesíts egy leckét, hogy pontokat szerezz a Buddy gondozásához.';

    const { water, hunger, happiness } = this.companionState.companion;
    const minimum = Math.min(water, hunger, happiness);
    if (minimum === water) return 'Pixel most egy kis itatásnak örülne a legjobban.';
    if (minimum === hunger) return 'Adj neki egy falatot, hogy újra lendületbe jöjjön.';
    return 'Játssz vele egyet, hogy még vidámabb legyen.';
  }

  progressHint(): string {
    if (!this.companionState) return 'Minden lecke és kvíz közelebb visz a következő szinthez.';
    if (this.companionState.growth.level >= this.companionState.growth.max_level) {
      return 'Elérted a 100. szintet: Pixel a legmagasabb Getingo Buddy formájában van.';
    }
    return `Még ${this.companionState.growth.points_to_next_level} fejlődési pont kell a ${this.companionState.growth.level + 1}. szinthez.`;
  }

  deleteNote(note: DashboardNote): void {
    if (!confirm('Biztosan törlöd ezt a jegyzetet?')) return;

    this.noteService.delete(note.id).subscribe({
      next: () => {
        this.notes = this.notes.filter(item => item.id !== note.id);
        if (this.learningData) this.learningData.notes = this.notes;
      }
    });
  }

  toggleDeletePanel(): void {
    this.showDeletePanel = !this.showDeletePanel;
    this.deleteError = '';
    if (!this.showDeletePanel) this.deleteForm.reset({ password: '', confirm: false });
  }

  deleteAccount(): void {
    if (this.deleteForm.invalid) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    this.deleteError = '';
    this.isDeleting = true;

    this.accountService.deleteAccount(this.deleteForm.controls.password.value)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: () => {
          this.auth.clearAuth();
          this.router.navigate(['/']);
        },
        error: error => {
          const errors = error.error?.errors;
          if (errors) {
            const firstKey = Object.keys(errors)[0];
            this.deleteError = errors[firstKey]?.[0] ?? 'Nem sikerült törölni a fiókot.';
            return;
          }
          this.deleteError = error.error?.message ?? 'Nem sikerült törölni a fiókot.';
        }
      });
  }

  logout(): void {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;
    this.auth.logout().pipe(finalize(() => this.isLoggingOut = false)).subscribe({
      next: () => setTimeout(() => this.router.navigate(['/login']), 260),
      error: () => {
        this.auth.clearAuth();
        setTimeout(() => this.router.navigate(['/login']), 260);
      }
    });
  }

  private triggerBuddyAnimation(): void {
    this.buddyAnimating = false;
    setTimeout(() => {
      this.buddyAnimating = true;
      setTimeout(() => this.buddyAnimating = false, 900);
    });
  }
}
