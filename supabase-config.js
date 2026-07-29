// ==========================================
// INNER CIRCLE - SUPABASE CONFIGURATION
// ==========================================

// Your Supabase Project URL (NO /rest/v1/)
const SUPABASE_URL = "https://jqfyqbbusarolwystrta.supabase.co";

// Your Publishable (Anon) Key
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rxAnVVyiypshAFpK6jPjBg_WVVfX8rW";

// Create Supabase Client
window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// Optional: Make globally accessible
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;

console.log("✅ Inner Circle connected to Supabase successfully.");
