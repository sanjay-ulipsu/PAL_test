// Mock data for POC demo mode — Finance & Entrepreneurship (FE) skill only

import { setToken } from "@/lib/api/client";

let selectedSkillIds: string[] = ["skill-fe"];

const MOCK_PROFILE = {
  id: "demo-user",
  display_name: "Demo Student",
  yol: 1,
  content_focus: "global",
  avatar_url: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const MOCK_SKILLS = [
  {
    id: "skill-fe",
    code: "FE",
    name: "Finance & Entrepreneurship",
    description: "Business, Money & Entrepreneurial Thinking",
    icon_url: null,
    theme_code: "amber",
    is_global: true,
    sort_order: 1,
  },
];

const MOCK_ILMS: Record<string, any[]> = {
  "skill-fe": [
    {
      id: "L2FE15",
      ilm_id: "L2FE15",
      ilm_code: "FE-215",
      skill_id: "skill-fe",
      title: "Budgeting & Saving",
      topic: "Budgeting, Needs vs Wants, Saving Money",
      learning_outcome: "Understand how to plan spending, distinguish needs from wants, and develop saving habits",
      project_detail: "Create a personal budget plan and identify saving opportunities",
      program_name: "PAL",
      yol: 1,
      level: 2,
      ilm_number: 1,
      theme_code: "amber",
      is_global: true,
      sort_order: 1,
    },
    {
      id: "L2FE16",
      ilm_id: "L2FE16",
      ilm_code: "FE-216",
      skill_id: "skill-fe",
      title: "Entrepreneurship Basics",
      topic: "Entrepreneurship, Business Ideas, Starting a Business",
      learning_outcome: "Explore entrepreneurial thinking, identify business opportunities, and understand how businesses start",
      project_detail: "Pitch a simple business idea and identify target customers",
      program_name: "PAL",
      yol: 1,
      level: 2,
      ilm_number: 2,
      theme_code: "amber",
      is_global: true,
      sort_order: 2,
    },
    {
      id: "L2FE17",
      ilm_id: "L2FE17",
      ilm_code: "FE-217",
      skill_id: "skill-fe",
      title: "Money Management",
      topic: "Money Management, Financial Planning, Spending Wisely",
      learning_outcome: "Learn to manage money responsibly through planning and mindful spending decisions",
      project_detail: "Analyse a spending scenario and suggest improvements",
      program_name: "PAL",
      yol: 1,
      level: 2,
      ilm_number: 3,
      theme_code: "amber",
      is_global: true,
      sort_order: 3,
    },
    {
      id: "L2FE18",
      ilm_id: "L2FE18",
      ilm_code: "FE-218",
      skill_id: "skill-fe",
      title: "Growing Money",
      topic: "Growing Money, Investment Basics, Financial Goals",
      learning_outcome: "Understand basic investment concepts and how setting financial goals leads to wealth growth",
      project_detail: "Set a financial goal and map out steps to achieve it",
      program_name: "PAL",
      yol: 1,
      level: 2,
      ilm_number: 4,
      theme_code: "amber",
      is_global: true,
      sort_order: 4,
    },
    {
      id: "L2FE19",
      ilm_id: "L2FE19",
      ilm_code: "FE-219",
      skill_id: "skill-fe",
      title: "Banking & Accounts",
      topic: "Banking, Accounts, Financial Services",
      learning_outcome: "Discover how banks work, the types of accounts available, and the range of financial services they offer",
      project_detail: "Compare savings and current accounts and explain when to use each",
      program_name: "PAL",
      yol: 1,
      level: 2,
      ilm_number: 5,
      theme_code: "amber",
      is_global: true,
      sort_order: 5,
    },
    {
      id: "L2FE20",
      ilm_id: "L2FE20",
      ilm_code: "FE-220",
      skill_id: "skill-fe",
      title: "Markets & Economics",
      topic: "Markets, Economics Basics, Supply and Demand",
      learning_outcome: "Understand how markets work, the law of supply and demand, and the basics of economics",
      project_detail: "Observe a real market and explain how supply/demand affects prices",
      program_name: "PAL",
      yol: 1,
      level: 2,
      ilm_number: 6,
      theme_code: "amber",
      is_global: true,
      sort_order: 6,
    },
  ],
};

const MOCK_RANK_PROGRESS = [
  {
    id: "rp-fe-1",
    profile_id: "demo-user",
    ilm_id: "ilm-fe-1",
    rank: "Cadet",
    unlocked: true,
    best_score: 85,
    attempts: 2,
    unlocked_at: "2024-01-15T00:00:00Z",
  },
];

type Filter = { type: "eq" | "in"; col: string; val: any };

function getTableData(table: string, filters: Filter[]): any[] {
  let data: any[] = [];
  switch (table) {
    case "profiles":
      data = [MOCK_PROFILE];
      break;
    case "skills":
      data = MOCK_SKILLS;
      break;
    case "selected_skills":
      data = selectedSkillIds.map((skill_id, i) => ({
        id: `ss-${i}`,
        profile_id: "demo-user",
        skill_id,
        selected_at: new Date().toISOString(),
        sort_order: i,
      }));
      break;
    case "ilms": {
      const skillFilter = filters.find((f) => f.col === "skill_id");
      if (skillFilter) {
        data = MOCK_ILMS[skillFilter.val] ?? [];
      } else {
        data = Object.values(MOCK_ILMS).flat();
      }
      break;
    }
    case "rank_progress":
      data = MOCK_RANK_PROGRESS;
      break;
    default:
      data = [];
  }

  return data.filter((row) =>
    filters.every((f) => {
      if (f.type === "eq") return row[f.col] === f.val;
      if (f.type === "in") return f.val.includes(row[f.col]);
      return true;
    })
  );
}

class MockBuilder {
  private table: string;
  private operation: "select" | "delete" = "select";
  private filters: Filter[] = [];

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string) { return this; }
  order(_col: string) { return this; }

  eq(col: string, val: any) {
    this.filters.push({ type: "eq", col, val });
    return this;
  }

  in(col: string, vals: any[]) {
    this.filters.push({ type: "in", col, val: vals });
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  insert(data: any): Promise<{ data: null; error: null }> {
    if (this.table === "selected_skills") {
      selectedSkillIds = (Array.isArray(data) ? data : [data]).map(
        (r: any) => r.skill_id
      );
    }
    return Promise.resolve({ data: null, error: null });
  }

  upsert(_data: any, _opts?: any): Promise<{ data: null; error: null }> {
    // Mock upsert — in-memory store doesn't need merging for POC
    return Promise.resolve({ data: null, error: null });
  }

  single(): Promise<{ data: any; error: null }> {
    const rows = getTableData(this.table, this.filters);
    return Promise.resolve({ data: rows[0] ?? null, error: null });
  }

  maybeSingle(): Promise<{ data: any; error: null }> {
    const rows = getTableData(this.table, this.filters);
    return Promise.resolve({ data: rows[0] ?? null, error: null });
  }

  private _resolve(): Promise<{ data: any; error: null }> {
    if (this.operation === "delete") {
      if (this.table === "selected_skills") selectedSkillIds = [];
      return Promise.resolve({ data: null, error: null });
    }
    const data = getTableData(this.table, this.filters);
    return Promise.resolve({ data, error: null });
  }

  then<TResult1 = { data: any; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._resolve().then(onfulfilled as any, onrejected as any);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<{ data: any; error: null } | TResult> {
    return this._resolve().catch(onrejected as any);
  }
}

export const mockSupabase = {
  from: (table: string) => new MockBuilder(table),
  auth: {
    getSession: () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("pal2_token") : null;
      if (!token) return Promise.resolve({ data: { session: null }, error: null });
      const session = { user: { id: "demo-user", email: "demo@pal.app" }, access_token: token };
      return Promise.resolve({ data: { session }, error: null });
    },
    getUser: () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("pal2_token") : null;
      if (!token) return Promise.resolve({ data: { user: null }, error: { message: "No session" } });
      return Promise.resolve({ data: { user: { id: "demo-user", email: "demo@pal.app" } }, error: null });
    },
    signInWithPassword: (_creds: { email: string; password: string }) => {
      setToken("demo-jwt-token");
      const session = { user: { id: "demo-user", email: "demo@pal.app" }, access_token: "demo-jwt-token" };
      return Promise.resolve({ data: { session }, error: null });
    },
    signUp: (_creds: { email: string; password: string }) => {
      setToken("demo-jwt-token");
      const session = { user: { id: "demo-user", email: "demo@pal.app" }, access_token: "demo-jwt-token" };
      return Promise.resolve({ data: { session }, error: null });
    },
    signOut: () => {
      if (typeof window !== "undefined") localStorage.removeItem("pal2_token");
      return Promise.resolve({ error: null });
    },
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
};
