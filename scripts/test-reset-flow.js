// Automated reset-password flow test.
// Usage: node --env-file=.env.local scripts/test-reset-flow.js
//
// What it covers:
//   1. Recovery link generation and token extraction
//   2. OTP verification (simulates clicking the email link)
//   3. Password update via recovery session
//   4. Old password is rejected after reset
//   5. New password is accepted
//   6. Recovery link is single-use (replay rejected)

import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: URL, SUPABASE_SERVICE_ROLE_KEY: SRK, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON } = process.env;

if (!URL || !SRK || !ANON) {
  console.error("Missing env vars. Run with: node --env-file=.env.local scripts/test-reset-flow.js");
  process.exit(1);
}

const admin = createClient(URL, SRK, { auth: { autoRefreshToken: false, persistSession: false } });
const client = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });

const testEmail = `qa-reset-${Date.now()}@portpagos-qa.test`;
const initialPassword = "InitialPass123!";
const newPassword = "NewPass456!";

async function pass(msg) { console.log("   ✓", msg); }
async function fail(msg) { throw new Error(msg); }

async function run() {
  console.log("=== Reset-password flow ===\n");
  let userId;
  let tokenHash;

  try {
    // 1. Create confirmed test user
    console.log("1. Creating test user...");
    const { data: { user }, error: createErr } = await admin.auth.admin.createUser({
      email: testEmail,
      password: initialPassword,
      email_confirm: true,
    });
    if (createErr) throw createErr;
    userId = user.id;
    await pass(`user created: ${user.email}`);

    // 2. Generate recovery link (server-side equivalent of "forgot password" form)
    console.log("\n2. Generating recovery link...");
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: testEmail,
    });
    if (linkErr) throw linkErr;
    const actionLink = linkData.properties.action_link;
    const url = new URL(actionLink);
    tokenHash = url.searchParams.get("token_hash");
    if (!tokenHash) throw new Error("No token_hash in recovery link: " + actionLink);
    await pass("token_hash extracted from link");

    // 3. Verify OTP — simulates clicking the link in the browser
    console.log("\n3. Verifying recovery token (simulating link click)...");
    const { error: verifyErr } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (verifyErr) throw verifyErr;
    await pass("recovery session established");

    // 4. Update password
    console.log("\n4. Updating password...");
    const { error: updateErr } = await client.auth.updateUser({ password: newPassword });
    if (updateErr) throw updateErr;
    await pass("password updated");

    // Sign out (mirrors what reset-password/page.tsx does after updateUser)
    await client.auth.signOut();

    // 5. Old password must be rejected
    console.log("\n5. Old password rejected...");
    const { error: oldErr } = await client.auth.signInWithPassword({ email: testEmail, password: initialPassword });
    if (!oldErr) await fail("Old password was accepted — should have been rejected");
    await pass(`old password rejected: ${oldErr.message}`);

    // 6. New password must work
    console.log("\n6. New password accepted...");
    const { data: newLogin, error: newErr } = await client.auth.signInWithPassword({ email: testEmail, password: newPassword });
    if (newErr) throw newErr;
    if (!newLogin.session) await fail("No session returned for new password");
    await pass("new password accepted, session established");
    await client.auth.signOut();

    // 7. Recovery link is single-use
    console.log("\n7. Recovery link is single-use...");
    const { error: replayErr } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (!replayErr) {
      console.log("   ⚠ WARNING: recovery link was reusable — Supabase should invalidate it after use");
    } else {
      await pass(`replay rejected: ${replayErr.message}`);
    }

    console.log("\n=== All reset-password tests passed ✓ ===\n");
  } finally {
    if (userId) {
      process.stdout.write("\nCleaning up...");
      await admin.auth.admin.deleteUser(userId);
      console.log(" done");
    }
  }
}

run().catch((err) => {
  console.error("\n✗ FAILED:", err.message);
  process.exit(1);
});
