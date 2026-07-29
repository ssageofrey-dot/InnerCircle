<script type="module">
  /*
    Add these two public values from Supabase: Project Settings > API.
    Never put your sb_secret/service_role key in this file or any browser code.
  */

  window.SUPABASE_URL = "https://jqfyqbbusarolwystrta.supabase.co";
  window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rxAnVVyiypshAFpK6jPjBg_WVVfX8rW";

  // For safety, use correct URL format (no /rest/v1/ in the base URL)
  if (
    !window.SUPABASE_URL.startsWith("YOUR_") &&
    !window.SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_")
  ) {
    window.supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_PUBLISHABLE_KEY
    );
  }
</script>
