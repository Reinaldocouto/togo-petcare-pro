import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create user
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: "teste@teste.com",
    password: "123456",
    email_confirm: true,
    user_metadata: { nome: "Teste" },
  });

  if (userError) {
    return new Response(JSON.stringify({ error: userError.message }), { status: 400 });
  }

  const newUserId = userData.user.id;

  // Create profile
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: newUserId, nome: "Teste", email: "teste@teste.com" });

  if (profileError) {
    console.log("Profile error (may already exist):", profileError.message);
  }

  // Get the clinic from the existing user
  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("clinic_id, role")
    .eq("role", "admin")
    .limit(1)
    .single();

  if (!existingRole) {
    return new Response(JSON.stringify({ error: "No existing admin role found" }), { status: 400 });
  }

  // Assign same role
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: newUserId, clinic_id: existingRole.clinic_id, role: "admin" });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true, user_id: newUserId }), {
    headers: { "Content-Type": "application/json" },
  });
});
