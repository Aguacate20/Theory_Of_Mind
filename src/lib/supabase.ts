import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type PlayerRow = {
  id: string;
  name: string;
  height: number;
  zone: number;
  energy: number;
  correct: number;
  total: number;
  updated_at: string;
};
