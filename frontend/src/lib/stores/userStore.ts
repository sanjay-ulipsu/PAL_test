import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, Skill } from "@/lib/types";

interface UserState {
  profile: Profile | null;
  selectedSkills: Skill[];
  setProfile: (profile: Profile | null) => void;
  setSelectedSkills: (skills: Skill[]) => void;
  addSelectedSkill: (skill: Skill) => void;
  removeSelectedSkill: (skillId: string) => void;
  canAddMoreSkills: () => boolean;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      selectedSkills: [],

      setProfile: (profile) => set({ profile }),

      setSelectedSkills: (skills) => set({ selectedSkills: skills }),

      addSelectedSkill: (skill) => {
        const current = get().selectedSkills;
        if (current.length >= 1) return; // 1-skill cap in POC
        if (current.find((s) => s.id === skill.id)) return;
        set({ selectedSkills: [...current, skill] });
      },

      removeSelectedSkill: (skillId) => {
        set({ selectedSkills: get().selectedSkills.filter((s) => s.id !== skillId) });
      },

      canAddMoreSkills: () => get().selectedSkills.length < 1,

      reset: () => set({ profile: null, selectedSkills: [] }),
    }),
    {
      name: "pal2-user",
      partialize: (state) => ({ selectedSkills: state.selectedSkills }),
    }
  )
);
