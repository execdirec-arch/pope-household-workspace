/* Picks up the Teller token parked by bank-relink.html (Vercel Blob),
   rotates the TELLER_TOKEN env var on Vercel, deletes the blob, and
   triggers a production redeploy so the new token takes effect.

   Run from the project root after Lauren completes the relink:
     node scripts/rotate-teller-token.mjs

   Needs BLOB_READ_WRITE_TOKEN (read from .env.dev) and a logged-in
   Vercel CLI (npx vercel whoami).
*/
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const env = Object.fromEntries(
  readFileSync(".env.dev", "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="(.*)"$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]])
);
const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN not found in .env.dev");

const auth = { headers: { authorization: `Bearer ${BLOB_TOKEN}` } };

// 1. Find the parked token blob
const listRes = await fetch("https://blob.vercel-storage.com/?prefix=reconnect/", auth);
const { blobs = [] } = await listRes.json();
const parked = blobs.find((b) => b.pathname === "reconnect/teller-token.json");
if (!parked) {
  console.log("No parked token found. Has the relink page shown its green message?");
  process.exit(1);
}

// 2. Read it
const token = (await (await fetch(parked.url)).json()).token;
if (!/^token_[a-z0-9]+$/i.test(token)) throw new Error("Parked blob holds no valid token");
console.log("Picked up token (received " + JSON.parse(await (await fetch(parked.url)).text()).receivedAt + ")");

// 3. Rotate the Vercel env var
const run = (cmd, input) => execSync(cmd, { stdio: input ? ["pipe", "inherit", "inherit"] : "inherit", input });
try { run("npx vercel env rm TELLER_TOKEN production --yes"); } catch { /* may not exist */ }
run("npx vercel env add TELLER_TOKEN production", token);
console.log("TELLER_TOKEN rotated.");

// 4. Delete the parked blob (single-use)
await fetch("https://blob.vercel-storage.com/delete", {
  method: "POST",
  headers: { ...auth.headers, "content-type": "application/json" },
  body: JSON.stringify({ urls: [parked.url] }),
});
console.log("Parked blob deleted.");

// 5. Redeploy so the function picks up the new env var
run("npx vercel --prod --yes");
console.log("Redeployed. Check /api/bank for fresh transactions.");
