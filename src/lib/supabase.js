import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Enforced at sign-up/sign-in in LoginPage — keep the domain check server-side
// too (Supabase Auth > Auth Hooks) before this ships past the hackathon.
export const ALLOWED_EMAIL_DOMAIN = "my.centennialcollege.ca";
