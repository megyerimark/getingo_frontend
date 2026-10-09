import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
/*   BuddyRoomKey,
  CompanionActionEvent,
  CompanionActionKey,
  CompanionReaction,
  CompanionRoom,
  CompanionSkin,
  CompanionState,
  CompanionVisualAction,
  CompanionBehavior */
  BuddyRoomKey,
  CompanionActionEvent,
  CompanionActionKey,
  CompanionBehavior,
  CompanionGrowth,
  CompanionReaction,
  CompanionRoom,
  CompanionSkin,
  CompanionState,
  CompanionVisualAction
} from '../../core/models/companion.model';
import { Auth } from '../../services/auth';
import { CompanionService } from '../../services/companion';
import { ToastService } from '../../services/toast';
import { Buddy3D } from '../../shared/buddy-3d/buddy-3d';
import { MascotStage } from '../../shared/mascot-stage/mascot-stage';

@Component({
  selector: 'app-buddy',
  imports: [RouterLink, FormsModule, MascotStage, Buddy3D],
  templateUrl: './buddy.html',
  styleUrl: './buddy.scss'
})
export class Buddy implements OnInit {
  state: CompanionState | null = null;
  loading = true;
  action: CompanionActionKey | null = null;
  error = '';
  viewMode: 'mascot' | '3d' = '3d';
  actionEvent: CompanionActionEvent | null = null;
  private actionEventId = 0;
  editingName = false;
  buddyName = '';
  savingName = false;

  constructor(
    public auth: Auth,
    private companionService: CompanionService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get room(): BuddyRoomKey {
    return this.state?.companion.selected_room ?? 'studio';
  }

  get premium(): boolean {
    return this.auth.currentUser()?.is_premium === true;
  }

  get selectedSkin(): CompanionSkin | null {
    if (!this.state) return null;
    return this.state.available_skins.find(item => item.key === this.state?.companion.selected_skin) ?? null;
  }

  get selectedModelUrl(): string {
    return this.selectedSkin?.model_url ?? '/models/getingo-buddies/getingo-mouse.glb';
  }
  
  
/*   get currentBehavior(): CompanionBehavior {
  return this.state?.behavior ?? {
    key: 'idle',
    name: 'Nyugodt',
    message: 'Minden rendben. A Buddy készen áll.',
    animation: 'idle'
  }; */
  get currentGrowth(): CompanionGrowth {
  return this.state?.growth ?? {
    key: 'era-1',
    level: 1,
    max_level: 100,
    era: 1,
    name: 'Apró társ',
    progress_percentage: 0,
    current_level_points: 0,
    next_level_points: 100,
    points_to_next_level: 100,
    next_stage_points: 100,
    points_to_next_stage: 100,
    knowledge_growth_points: 0,
    care_growth_points: 0,
    total_growth_points: 0,
    size_percentage: 100,
    curriculum_points: 0,
    curriculum_max_points: 0,
    completed_lessons: 0,
    total_lessons: 0,
    completed_quizzes: 0,
    total_quizzes: 0,
    curriculum_percentage: 0,
    evolution_stage: 1,
    evolution_name: 'Kezdő Buddy'
  };
}

get currentBehavior(): CompanionBehavior {
  return this.state?.behavior ?? {
    key: 'idle',
    name: 'Nyugodt',
    message: 'A Buddy készen áll.',
    animation: 'idle'
  };
}


  get nextUnlockLabel(): string {
    if (!this.state?.next_unlock) return 'Minden fejlődési mérföldkő teljesítve.';
    return `${this.state.next_unlock.level}. szint · ${this.state.next_unlock.reward}`;
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.companionService.getState().pipe(finalize(() => this.loading = false)).subscribe({
      next: state => { this.state = state; this.buddyName = state.companion.name; },
      error: () => this.error = 'A Buddy világa most nem tölthető be.'
    });
  }

  care(action: CompanionActionKey): void {
    if (this.action) return;
    this.action = action;
    this.error = '';

    this.companionService.performAction(action).pipe(finalize(() => this.action = null)).subscribe({
      next: response => {
        this.state = response.state;
        this.viewMode = '3d';
        this.emitAction(action);
        this.toast.success(response.message);
      },
      error: err => this.toast.error(
        err?.error?.errors?.action?.[0] ?? err?.error?.message ?? 'A művelet nem sikerült.'
      )
    });
  }


  startRename(): void {
    if (!this.state) return;
    this.buddyName = this.state.companion.name;
    this.editingName = true;
  }

  cancelRename(): void {
    this.editingName = false;
    this.buddyName = this.state?.companion.name ?? '';
  }

  saveName(): void {
    const name = this.buddyName.trim();
    if (!this.state || name.length < 2 || name.length > 24 || this.savingName) {
      this.toast.warning('A Buddy neve 2–24 karakter lehet.');
      return;
    }
    this.savingName = true;
    this.companionService.updatePreferences({ name }).pipe(finalize(() => this.savingName = false)).subscribe({
      next: state => { this.state = state; this.buddyName = state.companion.name; this.editingName = false; this.toast.success(`A Buddy új neve: ${state.companion.name}`); },
      error: err => this.toast.error(err?.error?.errors?.name?.[0] ?? 'A Buddy átnevezése nem sikerült.')
    });
  }

  selectRoom(room: CompanionRoom): void {
    if (!this.state || room.key === this.room) return;
    if (!room.unlocked) {
      this.toast.info('Ez a Buddy szoba Premium előfizetéssel érhető el.');
      return;
    }

    this.companionService.updatePreferences({ room: room.key }).subscribe({
      next: state => this.state = state,
      error: err => this.toast.error(err?.error?.errors?.room?.[0] ?? 'A szoba mentése nem sikerült.')
    });
  }

  selectSkin(skin: CompanionSkin): void {
    if (!this.state) return;
    if (!skin.unlocked) {
      this.toast.info(`${skin.name} Premium előfizetéssel választható.`);
      return;
    }
    if (skin.key === this.state.companion.selected_skin) return;

    this.companionService.updatePreferences({ skin: skin.key }).subscribe({
      next: state => {
        this.state = state;
        this.viewMode = '3d';
        this.emitAction('pet');
        this.toast.success(`${skin.name} lett az új társad.`);
      },
      error: err => this.toast.error(err?.error?.errors?.skin?.[0] ?? 'A Buddy nem választható.')
    });
  }

  playReaction(reaction: CompanionReaction): void {
    if (!reaction.unlocked) {
      if (reaction.premium && !this.premium) {
        this.toast.info(`${reaction.label} Premium funkció. A ${reaction.min_level}. szinttől használható.`);
      } else {
        this.toast.info(`${reaction.label} a ${reaction.min_level}. szinten oldódik fel.`);
      }
      return;
    }

    this.viewMode = '3d';
    this.emitAction(reaction.key);
    const signature = reaction.key === 'signature' ? ` · ${this.selectedSkin?.signature ?? ''}` : '';
    this.toast.success(`${reaction.label}${signature}`);
  }

  roomIcon(room: BuddyRoomKey): string {
    if (room === 'play') return 'bi-controller';
    if (room === 'night') return 'bi-moon-stars';
    if (room === 'aurora') return 'bi-stars';
    if (room === 'cyber') return 'bi-cpu';
    return 'bi-code-square';
  }

/*   behaviorIcon(): string {
    const behavior = this.state?.behavior.key;
    if (behavior === 'hungry') return 'bi-egg-fried';
    if (behavior === 'thirsty') return 'bi-droplet-fill';
    if (behavior === 'tired') return 'bi-moon-stars-fill';
    if (behavior === 'lonely') return 'bi-emoji-frown';
    if (behavior === 'happy') return 'bi-emoji-heart-eyes';
    return 'bi-emoji-smile';
  } */
behaviorIcon(): string {
  const behavior = this.currentBehavior.key;

  if (behavior === 'hungry') return 'bi-egg-fried';
  if (behavior === 'thirsty') return 'bi-droplet-fill';
  if (behavior === 'tired') return 'bi-moon-stars-fill';
  if (behavior === 'lonely') return 'bi-emoji-frown';
  if (behavior === 'happy') return 'bi-emoji-heart-eyes';

  return 'bi-emoji-smile';
}

  pet(): void {
    this.care('pet');
  }

  rest(): void {
    this.care('rest');
  }

  actionCost(action: CompanionActionKey): number {
    return this.state?.actions.find(item => item.key === action)?.cost ?? 0;
  }

  actionCostLabel(action: CompanionActionKey): string {
    const cost = this.actionCost(action);
    return cost > 0 ? `-${cost} pont` : 'ingyenes';
  }

/*   tip(): string {
    if (!this.state) return '';
    return this.state.behavior.message;
  } */
 tip(): string {
  return this.currentBehavior.message;
}

  private emitAction(type: CompanionVisualAction): void {
    this.actionEvent = { id: ++this.actionEventId, type };
  }
}
