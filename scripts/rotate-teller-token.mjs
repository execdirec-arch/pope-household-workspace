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
import { get, list, del } from "@vercel/blob";

const env = Object.fromEntries(
  readFileSync(".env.dev", "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="(.*)"$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]])
);
if (!env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN not found in .env.dev");
process.env.BLOB_READ_WRITE_TOKEN = env.BLOB_READ_WRITE_TOKEN;

// 1-2. Read the parked token (private store: SDK get, never raw URLs)
const PARKED = "reconnect/teller-token.json";
const g = await get(PARKED, { access: "private", useCache: false });
if (!g || !g.stream) {
  console.log("No parked token found. Has the relink page shown its green message?");
  process.exit(1);
}
const parkedData = JSON.parse(await new Response(g.stream).text());
const token = parkedData.token;
if (!/^token_[a-z0-9]+$/i.test(token || "")) throw new Error("Parked blob holds no valid token");
console.log("Picked up token (received " + parkedData.receivedAt + ")");

// 3. Rotate the Vercel env var
const run = (cmd, input) => execSync(cmd, { stdio: input ? ["pipe", "inherit", "inherit"] : "inherit", input });
try { run("npx vercel env rm TELLER_TOKEN production --yes"); } catch { /* may not exist */ }
run("npx vercel env add TELLER_TOKEN production", token);
console.log("TELLER_TOKEN rotated.");

// 4. Delete the parked blob (single-use)
const { blobs } = await list({ prefix: PARKED });
const parkedBlob = blobs.find((b) => b.pathname === PARKED);
if (parkedBlob) await del(parkedBlob.url);
console.log("Parked blob deleted.");

// 5. Redeploy so the function picks up the new env var
run("npx vercel --prod --yes");
console.log("Redeployed. Check /api/bank for fresh transactions.");
