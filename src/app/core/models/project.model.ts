export type ProjectValidationType = 'console_exact' | 'console_contains' | 'html_contains' | 'css_contains' | 'javascript_contains' | 'source_contains';

export interface Project {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: number;
  xp_reward: number;
  is_completed: boolean;
  timer_started?: boolean;
  started_at?: string | null;
  expires_at?: string | null;
  remaining_seconds?: number | null;
  is_expired?: boolean;
  starter_html?: string;
  starter_css?: string;
  starter_javascript?: string;
  validation_type?: ProjectValidationType;
  validation_configured?: boolean;
  validation_trusted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectSubmission {
  html_code: string;
  css_code: string;
  javascript_code: string;
  started_at?: string | null;
  expires_at?: string | null;
  completed_at?: string | null;
  xp_awarded: number;
}

export interface ProjectListResponse {
  projects: Project[];
}

export interface ProjectResponse {
  project: Project;
  submission: ProjectSubmission | null;
}


export interface ProjectTimingResponse {
  message: string;
  timer_started: boolean;
  started_at: string | null;
  expires_at: string | null;
  remaining_seconds: number | null;
  is_expired: boolean;
}

export interface ProjectWorkspacePayload {
  html_code: string;
  css_code: string;
  javascript_code: string;
}

export interface ProjectCheckPayload extends ProjectWorkspacePayload {
  console_output: string[];
}

export interface ProjectCheckResponse {
  passed: boolean;
  verified?: boolean;
  message: string;
  earned_xp?: number;
  already_completed?: boolean;
  completed_at?: string | null;
  is_completed: boolean;
  timer_started?: boolean;
  started_at?: string | null;
  expires_at?: string | null;
  remaining_seconds?: number | null;
  is_expired?: boolean;
  xp_points?: number;
  console_output?: string[];
  unlocked_achievements?: ProjectUnlockedAchievement[];
}

export interface ProjectUnlockedAchievement {
  slug: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface ProjectMentorResponse {
  tier: 'standard' | 'pro';
  tone: 'idle' | 'tip' | 'warning' | 'success';
  summary: string;
  focus_tab: 'html' | 'css' | 'javascript' | 'console';
  suggestions: string[];
}
