// Shared Vercel Blob helpers. The store is PRIVATE: every write must use
// access:"private" and every read must go through the SDK with
// useCache:false (the private CDN caches aggressively and serves stale/404
// after overwrites). Public URLs return 403 — never fetch blob.url directly.
// (Leading underscore keeps this out of Vercel's route table.)
const { put, get, list, del } = require("@vercel/blob");

async function readJson(pathname) {
  try {
    const g = await get(pathname, { access: "private", useCache: false });
    if (!g || !g.stream || (g.statusCode && g.statusCode !== 200)) return null;
    const text = await new Response(g.stream).text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeJson(pathname, data) {
  await put(pathname, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function deleteByPathname(pathname) {
  const { blobs } = await list({ prefix: pathname });
  const blob = blobs.find((b) => b.pathname === pathname);
  if (blob) await del(blob.url);
  return !!blob;
}

module.exports = { readJson, writeJson, deleteByPathname };
