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
  differential_diagnosis?: Array<{ name: string; probability: number }>;
  lesion_bbox?: { x: number; y: number; w: number; h: number } | null;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar: string | null;
  age_range: string | null;
  sex: string | null;
  skin_type: string | null;
  skin_texture: string | null;
  risk_factors: string[] | null;
  onboarded: boolean;
  created_at: string;
};
