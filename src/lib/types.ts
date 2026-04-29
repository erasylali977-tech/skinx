export type Scan = {
  id: string;
  user_id: string;
  image_path: string;
  body_area: string | null;
  notes: string | null;
  summary: string | null;
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  status: "stable" | "review" | "new";
  abcde: {
    asymmetry: number;
    border: number;
    color: number;
    diameter: number;
    evolution: number;
  };
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  age_range: string | null;
  sex: string | null;
  skin_type: string | null;
  risk_factors: string[] | null;
  onboarded: boolean;
  created_at: string;
};
