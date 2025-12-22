import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please create a .env file with SUPABASE_URL and SUPABASE_KEY."
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
