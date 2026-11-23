import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AuthRequest = {
  action?: unknown;
  username?: unknown;
  password?: unknown;
  fullName?: unknown;
  bird?: unknown;
};

const birdIds = new Set([
  "woodpecker",
  "eagle",
  "parrot",
  "hummingbird",
  "owl",
  "bat",
]);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function normalizeUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const username = value.trim().toLowerCase();
  return /^[a-z0-9_]{3,24}$/.test(username) ? username : null;
}

function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 72;
}

function internalEmail(username: string): string {
  return `${username}@users.bubbles.invalid`;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Username auth function is missing Supabase secrets.");
    return jsonResponse({ error: "Authentication service is unavailable." }, 500);
  }

  let input: AuthRequest;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  const username = normalizeUsername(input.username);
  if (!username) {
    return jsonResponse(
      { error: "Username must be 3–24 letters, numbers, or underscores." },
      400,
    );
  }
  if (!isValidPassword(input.password)) {
    return jsonResponse(
      { error: "Password must be between 8 and 72 characters." },
      400,
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (input.action === "signUp") {
    if (typeof input.bird !== "string" || !birdIds.has(input.bird)) {
      return jsonResponse({ error: "Choose a bird avatar to continue." }, 400);
    }
    const fullName =
      typeof input.fullName === "string" ? input.fullName.trim().slice(0, 100) : "";
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: internalEmail(username),
        password: input.password,
        email_confirm: true,
        user_metadata: {
          username,
          bird: input.bird,
          ...(fullName ? { full_name: fullName } : {}),
        },
      });

    if (createError || !created.user) {
      return jsonResponse(
        { error: "Could not create account. The username may already be taken." },
        409,
      );
    }

    const { error: usernameError } = await admin
      .from("usernames")
      .insert({ username, user_id: created.user.id });
    if (usernameError) {
      await admin.auth.admin.deleteUser(created.user.id);
      if (usernameError.code === "23505") {
        return jsonResponse({ error: "That username is already taken." }, 409);
      }
      console.error("Could not save username mapping.", usernameError.message);
      return jsonResponse({ error: "Could not create account." }, 500);
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: created.user.id,
        username,
        full_name: fullName || null,
        avatar_url: null,
        bird: input.bird,
        primary_clinic_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (profileError) {
      await admin.from("usernames").delete().eq("user_id", created.user.id);
      await admin.auth.admin.deleteUser(created.user.id);
      console.error("Could not create profile.", profileError.message);
      return jsonResponse({ error: "Could not create account." }, 500);
    }

    const { data: signedIn, error: signInError } =
      await publicClient.auth.signInWithPassword({
        email: internalEmail(username),
        password: input.password,
      });
    if (signInError || !signedIn.session) {
      console.error("New username account could not establish a session.");
      return jsonResponse({ error: "Account created. Please sign in." }, 200);
    }

    return jsonResponse({
      access_token: signedIn.session.access_token,
      refresh_token: signedIn.session.refresh_token,
    });
  }

  if (input.action === "signIn") {
    const { data: mapping, error: lookupError } = await admin
      .from("usernames")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (lookupError) {
      console.error("Username lookup failed.", lookupError.message);
      return jsonResponse({ error: "Could not sign in right now." }, 500);
    }
    if (!mapping) {
      return jsonResponse({ error: "Username or password is incorrect." }, 401);
    }

    const { data: account, error: accountError } =
      await admin.auth.admin.getUserById(mapping.user_id);
    if (accountError || !account.user?.email) {
      console.error("Username account is missing its auth identity.");
      return jsonResponse({ error: "Username or password is incorrect." }, 401);
    }

    const { data: signedIn, error: signInError } =
      await publicClient.auth.signInWithPassword({
        email: account.user.email,
        password: input.password,
      });
    if (signInError || !signedIn.session) {
      return jsonResponse({ error: "Username or password is incorrect." }, 401);
    }

    return jsonResponse({
      access_token: signedIn.session.access_token,
      refresh_token: signedIn.session.refresh_token,
    });
  }

  if (input.action === "claimUsername") {
    const authorization = request.headers.get("Authorization");
    const accessToken = authorization?.replace(/^Bearer\s+/i, "");
    if (!accessToken) {
      return jsonResponse({ error: "Sign in before setting a username." }, 401);
    }

    const { data: current, error: currentError } =
      await admin.auth.getUser(accessToken);
    if (currentError || !current.user) {
      return jsonResponse({ error: "Your session has expired. Sign in again." }, 401);
    }

    const { data: existingMapping, error: mappingError } = await admin
      .from("usernames")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    if (mappingError) {
      console.error("Username availability check failed.", mappingError.message);
      return jsonResponse({ error: "Could not save username." }, 500);
    }
    if (
      existingMapping &&
      existingMapping.user_id !== current.user.id
    ) {
      return jsonResponse({ error: "That username is already taken." }, 409);
    }

    if (!existingMapping) {
      const { error: insertError } = await admin
        .from("usernames")
        .insert({ username, user_id: current.user.id });
      if (insertError) {
        return jsonResponse({ error: "That username is already taken." }, 409);
      }
    }

    const metadata = current.user.user_metadata ?? {};
    const fullName =
      typeof input.fullName === "string"
        ? input.fullName.trim().slice(0, 100)
        : typeof metadata.full_name === "string"
          ? metadata.full_name
          : null;
    const { error: updateError } = await admin.auth.admin.updateUserById(
      current.user.id,
      {
        password: input.password,
        user_metadata: { ...metadata, username },
      },
    );
    if (updateError) {
      if (!existingMapping) {
        await admin.from("usernames").delete().eq("user_id", current.user.id);
      }
      return jsonResponse({ error: "Could not update account credentials." }, 400);
    }

    const profileChanges = {
      username,
      full_name: fullName,
      avatar_url:
        typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
      updated_at: new Date().toISOString(),
    };
    const { data: updatedProfile, error: profileUpdateError } = await admin
      .from("profiles")
      .update(profileChanges)
      .eq("id", current.user.id)
      .select("id")
      .maybeSingle();
    let profileError = profileUpdateError;
    if (!profileError && !updatedProfile) {
      const { error } = await admin.from("profiles").insert({
        id: current.user.id,
        ...profileChanges,
      });
      profileError = error;
    }
    if (profileError) {
      console.error("Could not update profile username.", profileError.message);
      if (profileError.code === "23505") {
        return jsonResponse({ error: "That username is already taken." }, 409);
      }
      return jsonResponse(
        { error: "Credentials changed, but the profile did not update. Please try again while signed in." },
        500,
      );
    }
    return jsonResponse({ username });
  }

  return jsonResponse({ error: "Unsupported authentication action." }, 400);
});
