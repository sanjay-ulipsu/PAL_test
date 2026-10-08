// Domain types — MongoDB-aligned, no Supabase dependency

export interface Profile {
  id: string;
  email?: string;
  display_name: string;
  handle?: string | null;
  yol: number;
  content_focus: string;
  avatar_url: string | null;
  selected_skill_ids?: string[];
  onboarded?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  code?: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  theme_code: string;
  is_global: boolean;
  sort_order: number;
}

export interface ILM {
  id: string;
  ilm_id: string;
  ilm_code?: string;
  skill_id: string;
  title: string;
  topic: string;
  learning_outcome: string;
  project_detail: string | null;
  program_name: string;
  yol: number;
  level: number;
  ilm_number: number;
  theme_code: string;
  is_global: boolean;
  sort_order: number;
}

export interface Mission {
  id: string;
  student_id: string;
  ilm_id: string;
  rank: Rank;
  status: "active" | "completed" | "applet_pending" | "failed";
  current_ruah_block: "R" | "U" | "A" | "H";
  block_correct_streak: number;
  ru_count: number;
  a_count: number;
  h_count: number;
  total_questions_answered: number;
  score: number;
  ideal_distribution_reached: boolean;
  applet_triggered: boolean;
  applet_completed: boolean;
  started_at?: string;
  completed_at?: string | null;
}

export interface RankProgress {
  id: string;
  student_id: string;
  ilm_id: string;
  rank: string;
  unlocked: boolean;
  best_score: number;
  attempts: number;
  unlocked_at: string | null;
}

export type Rank = "Cadet" | "Agent" | "Specialist" | "Operator" | "Commander";
export const RANKS: Rank[] = ["Cadet", "Agent", "Specialist", "Operator", "Commander"];
export const RANK_ORDER: Record<Rank, number> = {
  Cadet: 0,
  Agent: 1,
  Specialist: 2,
  Operator: 3,
  Commander: 4,
};
