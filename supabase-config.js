/*
  Add these two public values from Supabase: Project Settings > API.
  Never put your sb_secret/service_role key in this file or any browser code.
*/
window.SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
window.SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

if (!window.SUPABASE_URL.startsWith("YOUR_") && !window.SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_")) {
  window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
}
