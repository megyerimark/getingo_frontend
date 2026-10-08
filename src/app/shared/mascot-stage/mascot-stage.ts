import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import {
  BuddyRoomKey,
  CompanionActionEvent,
  CompanionState,
  CompanionVisualAction
} from '../../core/models/companion.model';

@Component({
  selector: 'app-mascot-stage',
  imports: [],
  templateUrl: './mascot-stage.html',
  styleUrl: './mascot-stage.scss'
})
export class MascotStage implements OnChanges, OnDestroy {
  @Input() state: CompanionState | null = null;
  @Input() compact = false;
  @Input() room: BuddyRoomKey = 'studio';
  @Input() actionEvent: CompanionActionEvent | null = null;

  reaction: CompanionVisualAction | null = null;
  tiltX = 0;
  tiltY = 0;
  private reactionTimer?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['actionEvent'] && this.actionEvent) {
      this.play(this.actionEvent.type);
    }
  }

  ngOnDestroy(): void {
    if (this.reactionTimer) clearTimeout(this.reactionTimer);
  }

  selectedImage(): string {
    return this.state?.available_skins.find(item => item.key === this.state?.companion.selected_skin)?.image
      ?? '/mascots/getingo-mouse.png';
  }

  selectedName(): string {
    return this.state?.available_skins.find(item => item.key === this.state?.companion.selected_skin)?.name
      ?? 'Getingo Egér';
  }

  onPointerMove(event: PointerEvent): void {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    this.tiltX = Math.max(-5, Math.min(5, x * 4));
    this.tiltY = Math.max(-4, Math.min(4, -y * 3));
  }

  resetTilt(): void {
    this.tiltX = 0;
    this.tiltY = 0;
  }

  pet(): void {
    this.play('pet');
  }

  rest(): void {
    this.play('rest');
  }

  playAction(action: 'water' | 'feed' | 'play'): void {
    this.play(action);
  }

  reactionIcon(): string {
    if (this.reaction === 'water') return '💧';
    if (this.reaction === 'feed') return '🐟';
    if (this.reaction === 'play') return '✨';
    if (this.reaction === 'pet') return '💙';
    if (this.reaction === 'rest') return '🌙';
    if (this.reaction === 'level_up') return '⭐';
    if (this.reaction === 'celebrate') return '✨';
    if (this.reaction === 'focus') return '⚡';
    if (this.reaction === 'signature') return '💫';
    return '';
  }

  private play(action: CompanionVisualAction): void {
    if (this.reactionTimer) clearTimeout(this.reactionTimer);
    this.reaction = null;
    requestAnimationFrame(() => {
      this.reaction = action;
      const duration = action === 'rest' ? 2600 : (action === 'signature' ? 1900 : (action === 'focus' ? 1700 : 1200));
      this.reactionTimer = setTimeout(() => this.reaction = null, duration);
    });
  }
}
