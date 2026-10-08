export type CompanionActionKey = 'water' | 'feed' | 'play' | 'rest' | 'pet';
export type CompanionVisualAction = CompanionActionKey | 'celebrate' | 'focus' | 'signature' | 'level_up';
export interface CompanionActionEvent { id: number; type: CompanionVisualAction; }

export type CompanionStageKey =
  | 'era-1'
  | 'era-2'
  | 'era-3'
  | 'era-4'
  | 'era-5'
  | 'era-6'
  | 'era-7'
  | 'era-8'
  | 'era-9'
  | 'era-10';
export type BuddyRoomKey = 'studio' | 'play' | 'night' | 'aurora' | 'cyber';
export type CompanionSpecies = 'mouse' | 'sloth' | 'reindeer' | 'shark' | 'dragon';
export type CompanionBehaviorKey = 'idle' | 'hungry' | 'thirsty' | 'tired' | 'lonely' | 'happy';

export interface CompanionSkin {
  key: string;
  name: string;
  premium: boolean;
  unlocked: boolean;
  species: CompanionSpecies;
  image: string;
  model_url: string;
  description: string;
  personality: string;
  signature: string;
  accent: string;
}

export interface CompanionRoom {
  key: BuddyRoomKey;
  name: string;
  premium: boolean;
  unlocked: boolean;
}

export type CompanionMoodKey = 'wilted' | 'calm' | 'happy' | 'radiant';

export interface Companion {
  id: number;
  name: string;
  care_points: number;
  growth_points: number;
  water: number;
  hunger: number;
  happiness: number;
  energy: number;
  bond: number;
  selected_skin: string;
  selected_room: BuddyRoomKey;
  last_interaction_at: string | null;
}

export interface CompanionGrowth {
  key: CompanionStageKey;
  level: number;
  max_level: number;
  era: number;
  name: string;
  progress_percentage: number;
  current_level_points: number;
  next_level_points: number | null;
  points_to_next_level: number;
  next_stage_points: number | null;
  points_to_next_stage: number;
  knowledge_growth_points: number;
  care_growth_points: number;
  total_growth_points: number;
  size_percentage: number;
  curriculum_points: number;
  curriculum_max_points: number;
  completed_lessons: number;
  total_lessons: number;
  completed_quizzes: number;
  total_quizzes: number;
  curriculum_percentage: number;
  evolution_stage: number;
  evolution_name: string;
}

export interface CompanionMood {
  key: CompanionMoodKey;
  name: string;
  score: number;
}

export interface CompanionBehavior {
  key: CompanionBehaviorKey;
  name: string;
  message: string;
  animation: string;
}

export interface CompanionAction {
  key: CompanionActionKey;
  label: string;
  icon: string;
  cost: number;
  boost: number;
  growth: number;
  bond: number;
  effects: Partial<Record<'water' | 'hunger' | 'happiness' | 'energy', number>>;
}

export interface CompanionReaction {
  key: 'celebrate' | 'focus' | 'signature';
  label: string;
  icon: string;
  description: string;
  premium: boolean;
  min_level: number;
  unlocked: boolean;
}

export interface CompanionMilestone {
  level: number;
  title: string;
  reward: string;
  icon: string;
  premium: boolean;
  unlocked: boolean;
  current: boolean;
}

export interface CompanionAnimationContract {
  preferred_clips: string[];
  fallback_enabled: boolean;
}

export interface CompanionState {
  companion: Companion;
  growth: CompanionGrowth;
  mood: CompanionMood;
  behavior: CompanionBehavior;
  xp_points: number;
  actions: CompanionAction[];
  reactions: CompanionReaction[];
  milestones: CompanionMilestone[];
  next_unlock: CompanionMilestone | null;
  available_skins: CompanionSkin[];
  available_rooms: CompanionRoom[];
  animation_contract: CompanionAnimationContract;
}

export interface CompanionActionResponse {
  message: string;
  state: CompanionState;
}
