import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Buddy } from './buddy';
import { Auth } from '../../services/auth';
import { CompanionService } from '../../services/companion';
import { ToastService } from '../../services/toast';
import { CompanionState } from '../../core/models/companion.model';

const state: CompanionState = {
  companion: { id: 1, name: 'Byte', care_points: 20, growth_points: 100, water: 80, hunger: 80, happiness: 80, energy: 80, bond: 20, selected_skin: 'getingo-mouse', selected_room: 'studio', last_interaction_at: null },
  growth: { key: 'era-1', level: 1, max_level: 100, era: 1, name: 'Kezdő', progress_percentage: 0, current_level_points: 0, next_level_points: 100, points_to_next_level: 100, next_stage_points: 1000, points_to_next_stage: 1000, knowledge_growth_points: 0, care_growth_points: 0, total_growth_points: 0, size_percentage: 100, curriculum_points: 0, curriculum_max_points: 100, completed_lessons: 0, total_lessons: 10, completed_quizzes: 0, total_quizzes: 10, curriculum_percentage: 0, evolution_stage: 1, evolution_name: 'Kezdő' },
  mood: { key: 'happy', name: 'Boldog', score: 80 },
  behavior: { key: 'idle', name: 'Nyugodt', message: 'Minden rendben.', animation: 'idle' },
  xp_points: 0,
  actions: [{ key: 'pet', label: 'Simogatás', icon: 'heart', cost: 0, boost: 1, growth: 1, bond: 1, effects: {} }],
  reactions: [], milestones: [], next_unlock: null,
  available_skins: [{ key: 'getingo-mouse', name: 'Egér', premium: false, unlocked: true, species: 'mouse', image: '', model_url: '/models/getingo-buddies/getingo-mouse.glb', description: '', personality: '', signature: '', accent: '#fff' }],
  available_rooms: [{ key: 'studio', name: 'Stúdió', premium: false, unlocked: true }],
  animation_contract: { preferred_clips: [], fallback_enabled: true }
};

describe('Buddy', () => {
  let component: Buddy;
  let fixture: ComponentFixture<Buddy>;
  const auth = { currentUser: () => ({ is_premium: false }) };
  const companion = jasmine.createSpyObj<CompanionService>('CompanionService', ['getState', 'performAction', 'updatePreferences']);
  const toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'warning', 'info']);

  beforeEach(async () => {
    companion.getState.and.returnValue(of(state));
    companion.performAction.and.returnValue(of({ message: 'Jó!', state }));
    companion.updatePreferences.and.returnValue(of(state));
    await TestBed.configureTestingModule({
      imports: [Buddy],
      providers: [{ provide: Auth, useValue: auth }, { provide: CompanionService, useValue: companion }, { provide: ToastService, useValue: toast }]
    }).overrideComponent(Buddy, { set: { template: '' } }).compileComponents();
    fixture = TestBed.createComponent(Buddy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads companion state and resolves the selected 3D model', () => {
    expect(component.state?.companion.name).toBe('Byte');
    expect(component.selectedModelUrl).toContain('getingo-mouse.glb');
  });

  it('updates the state after a care action', () => {
    component.care('pet');
    expect(companion.performAction).toHaveBeenCalledWith('pet');
    expect(toast.success).toHaveBeenCalledWith('Jó!');
    expect(component.actionEvent?.type).toBe('pet');
  });
});
