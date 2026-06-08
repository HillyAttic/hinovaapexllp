/**
 * Seed the existing static blog posts into Firestore (collection: blog_posts).
 *
 * - Reads the Firebase service account from worker/.dev.vars (FIREBASE_SERVICE_ACCOUNT).
 * - Parses each HTML file in /post for title, category, date, cover image and body.
 * - Idempotent: if a post with the same slug already exists it is updated, not duplicated.
 *
 * Run:  node scripts/seed-blogs.js        (from the worker/ folder)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKER_DIR = path.join(__dirname, '..');
const SITE_ROOT = path.join(WORKER_DIR, '..');
const POST_DIR = path.join(SITE_ROOT, 'post');

// ---- Load service account from .dev.vars ----
function loadServiceAccount() {
  const devVarsPath = path.join(WORKER_DIR, '.dev.vars');
  if (!fs.existsSync(devVarsPath)) {
    throw new Error('.dev.vars not found in worker/. Cannot read FIREBASE_SERVICE_ACCOUNT.');
  }
  const text = fs.readFileSync(devVarsPath, 'utf8');
  // Match FIREBASE_SERVICE_ACCOUNT='...{json}...'
  const m = text.match(/FIREBASE_SERVICE_ACCOUNT\s*=\s*'([\s\S]*?)'\s*(?:\r?\n|$)/);
  if (!m) throw new Error('FIREBASE_SERVICE_ACCOUNT not found in .dev.vars');
  return JSON.parse(m[1]);
}

// ---- OAuth access token via JWT (service account) ----
async function getAccessToken(sa) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const dataToSign = `${enc(header)}.${enc(payload)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(dataToSign);
  sign.end();
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${dataToSign}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error('Token request failed: ' + (await res.text()));
  const data = await res.json();
  return data.access_token;
}

// ---- HTML extraction helpers ----
function extractJsonLd(html) {
  const m = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return {};
  try { return JSON.parse(m[1]); }
  catch {
    // The JSON-LD in these files has raw newlines inside strings; sanitise them.
    try { return JSON.parse(m[1].replace(/\r?\n/g, ' ')); }
    catch { return {}; }
  }
}
function extractTitle(html) {
  const m = html.match(/<h4[^>]*class="blog-detail-title"[^>]*>([\s\S]*?)<\/h4>/);
  return m ? m[1].trim() : '';
}
function extractContent(html) {
  const m = html.match(/<div class="w-richtext">([\s\S]*?)<\/div>\s*<div class="author-box"/);
  return m ? m[1].trim() : '';
}
function extractCover(html) {
  // The main blog image carries alt="Blog Image"; src is a "../..." relative path.
  const m = html.match(/<img[^>]*alt="Blog Image"[^>]*\ssrc="([^"]+)"/);
  if (!m) return '';
  return m[1].replace(/^\.\.\//, ''); // make root-relative for the live site
}

// ---- Firestore REST helpers ----
const POSTS = [
  'metals-which-shape-our-world-a-greater-look',
  'gaining-proficiency-in-metallurgy-quality-control',
  'interactive-technologies-in-manufacturing-facilities',
  'future-developments-and-trends-in-metallurgy',
  'revealing-the-mysteries-around-steel-grades',
  'learning-more-about-heat-treatment-methods',
];

function encodeFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (typeof v === 'number') fields[k] = { integerValue: String(v) };
    else fields[k] = { stringValue: String(v) };
  }
  return fields;
}

async function findExistingId(projectId, token, slug) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'blog_posts' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: slug },
        },
      },
      limit: 1,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Query failed: ' + (await res.text()));
  const rows = await res.json();
  const hit = rows.find((r) => r.document);
  return hit ? hit.document.name.split('/').pop() : null;
}

async function createDoc(projectId, token, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/blog_posts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error('Create failed: ' + (await res.text()));
  return (await res.json()).name.split('/').pop();
}

async function updateDoc(projectId, token, id, fields) {
  // updateMask ensures only provided fields are written.
  const mask = Object.keys(fields).map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/blog_posts/${id}?${mask}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error('Update failed: ' + (await res.text()));
}

async function main() {
  const sa = loadServiceAccount();
  const projectId = sa.project_id;
  const token = await getAccessToken(sa);
  console.log(`Connected to Firestore project: ${projectId}\n`);

  let created = 0, updated = 0, skipped = 0;

  for (const slug of POSTS) {
    const file = path.join(POST_DIR, `${slug}.html`);
    if (!fs.existsSync(file)) { console.warn(`! Missing file, skipping: ${slug}`); skipped++; continue; }

    const html = fs.readFileSync(file, 'utf8');
    const ld = extractJsonLd(html);
    const doc = {
      slug,
      title: extractTitle(html) || ld.headline || slug,
      description: ld.description || '',
      category: ld.articleSection || '',
      author_name: (ld.author && ld.author.name) || 'Admin',
      cover_image: extractCover(html),
      content_html: extractContent(html),
      date_published: ld.datePublished || new Date().toISOString(),
      date_modified: ld.dateModified || ld.datePublished || new Date().toISOString(),
      source: 'seed',
    };

    if (!doc.content_html) { console.warn(`! No content extracted for ${slug} (skipping)`); skipped++; continue; }

    const fields = encodeFields(doc);
    const existingId = await findExistingId(projectId, token, slug);
    if (existingId) {
      await updateDoc(projectId, token, existingId, fields);
      console.log(`~ Updated: ${doc.title}`);
      updated++;
    } else {
      await createDoc(projectId, token, fields);
      console.log(`+ Created: ${doc.title}`);
      created++;
    }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch((e) => { console.error('\nSEED FAILED:', e.message); process.exit(1); });
