// One-shot helper to seed the demo login dm@yoso.com / 123456789.
// Safe to call repeatedly — if the user already exists, returns ok:true.
// Delete this function after the demo account is created.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "dm@yoso.com";
const DEMO_PASSWORD = "123456789";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo Buyer", company_name: "YORSO Demo" },
  });

  if (error && !/already registered|already exists/i.test(error.message)) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, userId: created?.user?.id ?? null, alreadyExisted: !created }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
