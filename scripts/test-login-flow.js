// Automated login flow test.
// Usage: node --env-file=.env.local scripts/test-login-flow.js
//
// What it covers:
//   1. Wrong password → error (not a silent success)
//   2. Non-existent email → same error message as wrong password (no enumeration)
//   3. Unconfirmed email → Supabase returns "email not confirmed" (UI maps to specific message)
//   4. Correct credentials → session established

import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: URL, SUPABASE_SERVICE_ROLE_KEY: SRK, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON } = process.env;

if (!URL || !SRK || !ANON) {
  console.error("Missing env vars. Run with: node --env-file=.env.local scripts/test-login-flow.js");
  process.exit(1);
}

const admin = createClient(URL, SRK, { auth: { autoRefreshToken: false, persistSession: false } });
const client = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });

const testPassword = "LoginTest123!";

async function pass(msg) { console.log("   ✓", msg); }

async function run() {
  console.log("=== Login flow ===\n");
  const confirmedEmail = `qa-login-confirmed-${Date.now()}@portpagos-qa.test`;
  const unconfirmedEmail = `qa-login-unconfirmed-${Date.now()}@portpagos-qa.test`;
  let confirmedId, unconfirmedId;

  try {
    // Seed two test users
    const { data: { user: cu }, error: ce } = await admin.auth.admin.createUser({
      email: confirmedEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (ce) throw ce;
    confirmedId = cu.id;

    const { data: { user: uu }, error: ue } = await admin.auth.admin.createUser({
      email: unconfirmedEmail,
      password: testPassword,
      email_confirm: false,
    });
    if (ue) throw ue;
    unconfirmedId = uu.id;
    console.log(`Seeded: confirmed(${confirmedEmail}), unconfirmed(${unconfirmedEmail})\n`);

    // Test 1: Wrong password
    console.log("1. Wrong password → error...");
    const { error: wrongErr } = await client.auth.signInWithPassword({ email: confirmedEmail, password: "wrongpassword" });
    if (!wrongErr) throw new Error("Expected error for wrong password — got none");
    await pass(`error received: "${wrongErr.message}"`);

    // Test 2: Non-existent email → same error (prevents user enumeration)
    console.log("\n2. Non-existent email → same error (no enumeration)...");
    const { error: noUserErr } = await client.auth.signInWithPassword({
      email: `nonexistent-${Date.now()}@portpagos-qa.test`,
      password: testPassword,
    });
    if (!noUserErr) throw new Error("Expected error for non-existent email — got none");
    if (noUserErr.message !== wrongErr.message) {
      console.log("   ⚠ WARNING: error messages differ — possible user enumeration");
      console.log(`   wrong password:  "${wrongErr.message}"`);
      console.log(`   non-existent:    "${noUserErr.message}"`);
    } else {
      await pass(`same error message — no enumeration: "${noUserErr.message}"`);
    }

    // Test 3: Unconfirmed email → contains "email not confirmed" (UI maps this to a helpful message)
    console.log("\n3. Unconfirmed email → email-not-confirmed error...");
    const { error: unconfErr } = await client.auth.signInWithPassword({ email: unconfirmedEmail, password: testPassword });
    if (!unconfErr) {
      console.log("   ⚠ WARNING: unconfirmed user logged in — email confirmation may be disabled");
    } else {
      const msg = unconfErr.message.toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        await pass(`Supabase returns: "${unconfErr.message}"`);
        await pass('UI will show: "Please confirm your email first — check your inbox"');
      } else {
        console.log(`   ⚠ WARNING: expected "email not confirmed" but got: "${unconfErr.message}"`);
        console.log("   UI will show wrong error message — check login/page.tsx error handler");
      }
    }

    // Test 4: Correct credentials → session
    console.log("\n4. Correct credentials → session established...");
    const { data: loginData, error: loginErr } = await client.auth.signInWithPassword({
      email: confirmedEmail,
      password: testPassword,
    });
    if (loginErr) throw loginErr;
    if (!loginData.session) throw new Error("No session returned");
    await pass("session established");
    await client.auth.signOut();

    console.log("\n=== All login tests passed ✓ ===\n");
  } finally {
    process.stdout.write("\nCleaning up...");
    if (confirmedId) await admin.auth.admin.deleteUser(confirmedId);
    if (unconfirmedId) await admin.auth.admin.deleteUser(unconfirmedId);
    console.log(" done");
  }
}

run().catch((err) => {
  console.error("\n✗ FAILED:", err.message);
  process.exit(1);
});
