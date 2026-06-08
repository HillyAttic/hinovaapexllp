/**
 * Seed script: Migrates existing blog posts from HTML files to Firebase Firestore.
 *
 * Usage:
 *   1. Set FIREBASE_SERVICE_ACCOUNT env var (path to service account JSON)
 *   2. node scripts/seed.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '..', 'service-account.json');
const SITE_ROOT = path.join(__dirname, '..', '..');

const POSTS = [
  {
    slug: 'metals-which-shape-our-world-a-greater-look',
    file: 'metals-which-shape-our-world-a-greater-look.html',
  },
  {
    slug: 'gaining-proficiency-in-metallurgy-quality-control',
    file: 'gaining-proficiency-in-metallurgy-quality-control.html',
  },
  {
    slug: 'interactive-technologies-in-manufacturing-facilities',
    file: 'interactive-technologies-in-manufacturing-facilities.html',
  },
  {
    slug: 'future-developments-and-trends-in-metallurgy',
    file: 'future-developments-and-trends-in-metallurgy.html',
  },
  {
    slug: 'revealing-the-mysteries-around-steel-grades',
    file: 'revealing-the-mysteries-around-steel-grades.html',
  },
  {
    slug: 'learning-more-about-heat-treatment-methods',
    file: 'learning-more-about-heat-treatment-methods.html',
  },
];

function extractJsonLd(html) {
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function extractRichText(html) {
  const match = html.match(/<div class="w-richtext">([\s\S]*?)<\/div>\s*(?:<\/div>|<div class="author-box")/);
  return match ? match[1].trim() : '';
}

function extractTitle(html) {
  const match = html.match(/<h4[^>]*class="blog-detail-title"[^>]*>([\s\S]*?)<\/h4>/);
  return match ? match[1].trim() : '';
}

async function seed() {
  // Load service account
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Service account file not found: ${SERVICE_ACCOUNT_PATH}`);
    console.error('Set FIREBASE_SERVICE_ACCOUNT env var or place service-account.json in worker/');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  const projectId = serviceAccount.project_id;

  // Get access token
  const token = await getAccessToken(serviceAccount);
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const force = process.env.FORCE === '1';

  let created = 0, updated = 0, skipped = 0, failed = 0;

  for (const post of POSTS) {
    const filePath = path.join(SITE_ROOT, 'post', post.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found, skipping: ${post.file}`);
      skipped++;
      continue;
    }

    const html = fs.readFileSync(filePath, 'utf-8');
    const jsonLd = extractJsonLd(html);
    const contentHtml = extractRichText(html);
    const title = extractTitle(html);

    if (!jsonLd) {
      console.warn(`No JSON-LD found in ${post.file}, skipping`);
      skipped++;
      continue;
    }

    const docData = {
      slug: post.slug,
      title: title || jsonLd.headline,
      description: jsonLd.description || '',
      category: jsonLd.articleSection || '',
      author_name: jsonLd.author?.name || 'Admin',
      author_email: jsonLd.author?.email || '',
      author_image: jsonLd.author?.image || '',
      author_description: jsonLd.author?.description || '',
      cover_image: jsonLd.image || '',
      content_html: contentHtml,
      date_published: jsonLd.datePublished || new Date().toISOString(),
      date_modified: jsonLd.dateModified || new Date().toISOString(),
    };

    // Encode fields for Firestore REST API
    const fields = {};
    for (const [key, value] of Object.entries(docData)) {
      if (typeof value === 'string') {
        fields[key] = { stringValue: value };
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value };
      }
    }

    // Idempotency: use slug as the document id, and skip if the doc already
    // exists (unless FORCE=1 is set).
    const docId = post.slug;
    const docPath = `${baseUrl}/blog_posts/${encodeURIComponent(docId)}`;

    if (!force) {
      try {
        const checkRes = await fetch(docPath, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (checkRes.ok) {
          console.log(`Skipped (exists): ${docData.title} (id: ${docId}). Set FORCE=1 to overwrite.`);
          skipped++;
          continue;
        }
      } catch (e) {
        // Network or auth issue — let the write attempt fail with a clear error.
      }
    }

    const res = await fetch(docPath, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (res.ok) {
      const existed = !force; // if we passed the skip check, we just overwrote via PATCH
      console.log(`${existed ? 'Updated' : 'Created'}: ${docData.title} (id: ${docId})`);
      if (existed) updated++; else created++;
    } else {
      const err = await res.text();
      console.error(`Failed to write ${post.slug}: ${err}`);
      failed++;
    }
  }

  console.log(`\nSeed complete! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
}

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

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key
  const crypto = require('crypto');
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

  const data = await res.json();
  return data.access_token;
}

seed().catch(console.error);
