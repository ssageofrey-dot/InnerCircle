import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = request.headers.get("Authorization") ?? "";
  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  const { data: caller } = await callerClient.from("profiles").select("role, status").eq("id", user.id).single();
  if (!caller || caller.role !== "admin" || caller.status !== "active") return Response.json({ error: "Forbidden" }, { status: 403, headers });
  const { memberId } = await request.json();
  if (!memberId || memberId === user.id) return Response.json({ error: "Invalid member" }, { status: 400, headers });
  const adminClient = createClient(url, adminKey);
  const { error } = await adminClient.auth.admin.deleteUser(memberId);
  return error ? Response.json({ error: error.message }, { status: 400, headers }) : Response.json({ ok: true }, { headers });
});
