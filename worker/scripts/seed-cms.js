/**
 * Seed script: Populates the Phase E CMS collections (team_members, services,
 * projects, testimonials) with the existing static content from the website.
 *
 * Usage:
 *   1. Set FIREBASE_SERVICE_ACCOUNT env var (path to service account JSON)
 *   2. node scripts/seed-cms.js
 *
 * Optional: FORCE=1 to overwrite existing documents.
 */

const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '..', 'service-account.json');
const SITE_ROOT = path.join(__dirname, '..', '..');

// ─── Data ────────────────────────────────────────────────────────────────
// All fields are optional except where marked required. `slug` is auto-derived
// from name/title if not provided. `order` controls display position (lower = first).

const TEAM_MEMBERS = [
  {
    slug: 'rohidas-sharma', name: 'Rohidas R. Sharma', role: 'Managing Director',
    department: 'Management', experience: '26+', qualification: 'Mechanical Engineering',
    bio: 'Mechanical engineering professional with more than 26 years of experience, leading the organisation with expertise in strategic planning, operational management, and team development.',
    is_active: true, order: 1, is_featured: true,
  },
  {
    slug: 'manoj-ap', name: 'Manoj A. P', role: 'Director',
    department: 'Engineering', qualification: 'Chemical Engineering',
    bio: 'Chemical engineering expert leading engineering strategy and innovation, with a focus on building scalable and compliant process systems.',
    is_active: true, order: 2, is_featured: true,
  },
  {
    slug: 'vishal-sakat', name: 'Vishal Sakat', role: 'Production Head',
    department: 'Production', experience: '9+', qualification: 'Mechanical Engineering · Logistics & Supply Chain',
    bio: 'Mechanical engineer with a degree in Logistics and Supply Chain Management and 9+ years of experience in fabrication of pressure vessels, reactors, and process equipment. ASNT Level II certified in RT and LPT.',
    is_active: true, order: 3, is_featured: true,
  },
  {
    slug: 'hardik-panchal', name: 'Hardik Panchal', role: 'Marketing Head',
    department: 'Marketing', experience: '10', qualification: 'Mechanical Engineering',
    bio: 'Mechanical engineer with 10 years of experience, responsible for marketing strategy and business development.',
    is_active: true, order: 4, is_featured: true,
  },
  {
    slug: 'arvind-kumar-sharma', name: 'Arvind Kumar Sharma', role: 'Director',
    department: 'Operations', experience: '20+', qualification: 'Mechanical / Industrial Engineering',
    bio: 'Operations and project management professional with deep expertise driving fabrication excellence, on-time delivery, and customer satisfaction across HI-NOVA\'s project portfolio.',
    is_active: true, order: 5, is_featured: true,
  },
];

const SERVICES = [
  {
    slug: 'pressure-vessels-heat-exchangers',
    title: 'Pressure Vessels & Heat Exchangers',
    category: 'Process Equipment',
    summary: 'ASME U2/U3, IBR, and PED-compliant pressure vessels and heat exchangers for chemical, petrochemical, and pharmaceutical applications.',
    features: [
      'Shell & tube, plate, and air-cooled heat exchangers',
      'Reactor vessels, separators, and accumulators',
      'IBR & ASME U2/U3-stamp certification',
      'In-house NDT (RT, UT, MPT, DPT) and hydrostatic testing',
    ],
    order: 1, is_featured: true,
  },
  {
    slug: 'industrial-drying-and-heating',
    title: 'Industrial Drying & Heating Systems',
    category: 'Process Equipment',
    summary: 'Paddle dryers, rotary dryers, and thermal processing systems for chemicals, pharmaceuticals, and food industries.',
    features: [
      'Paddle dryers for slurries, pastes, and wet cakes',
      'Rotary and tray dryers for bulk solids',
      'Heat exchangers and reboilers',
      'Skid-mounted thermal packages',
    ],
    order: 2, is_featured: true,
  },
  {
    slug: 'reactors-columns-storage-tanks',
    title: 'Reactors, Columns & Storage Tanks',
    category: 'Process Equipment',
    summary: 'Custom-engineered reactors, distillation columns, and storage tanks built to ASME / IBR / EN standards for diverse process industries.',
    features: [
      'SS304, SS316, SS316L, and exotic alloy reactors',
      'Distillation and absorption columns with internals',
      'Atmospheric and pressure storage tanks',
      'API 650, IS 803, and custom storage solutions',
    ],
    order: 3, is_featured: true,
  },
  {
    slug: 'skid-packages-and-process-piping',
    title: 'Skid Packages & Process Piping',
    category: 'Process Equipment',
    summary: 'Pre-engineered modular skid packages and complete process piping solutions for oil & gas, pharmaceutical, and chemical industries.',
    features: [
      'Pre-engineered modular skid packages',
      'Sterile and high-purity piping',
      'Process piping per ASME B31.3 and PED',
      'Integrated structural engineering',
    ],
    order: 4, is_featured: true,
  },
  {
    slug: 'turnkey-project-execution',
    title: 'Turnkey Project Execution',
    category: 'Project Execution',
    summary: 'End-to-end project management from concept engineering through commissioning, with single-point accountability.',
    features: [
      'Concept engineering and FEED',
      'Detailed engineering and procurement',
      'Construction management and commissioning',
      'Lifecycle support and optimization',
    ],
    order: 5, is_featured: true,
  },
  {
    slug: 'maintenance-and-revamping',
    title: 'Maintenance & Revamping',
    category: 'Lifecycle Services',
    summary: 'Planned shutdown, revamp, and capacity-upgrade services for existing process plants and equipment.',
    features: [
      'Plant turnaround and shutdown management',
      'Equipment revamp and capacity upgrades',
      'Spare parts supply and obsolescence management',
      'Performance audits and reliability engineering',
    ],
    order: 6, is_featured: true,
  },
];

const PROJECTS = [
  {
    slug: 'metal-production',
    title: 'Metal Production',
    category: 'Process Equipment',
    client: 'Leading steel manufacturer', location: 'Maharashtra, India', year: '2024',
    summary: 'Design, fabrication, and supply of pressure vessels and process reactors for a metal production facility expansion.',
    order: 1, is_featured: true,
  },
  {
    slug: 'manufacturing',
    title: 'Manufacturing Facility',
    category: 'Heavy Fabrication',
    client: 'Industrial client', location: 'India', year: '2024',
    summary: 'Heavy fabrication work for a new manufacturing facility — structural steel, process piping, and equipment integration.',
    order: 2, is_featured: true,
  },
  {
    slug: 'energy-power-project',
    title: 'Energy Power Project',
    category: 'Thermal Systems',
    client: 'Power generation utility', location: 'India', year: '2023',
    summary: 'Design, supply, and commissioning of heat exchangers and auxiliary pressure equipment for a power plant.',
    order: 3, is_featured: true,
  },
  {
    slug: 'factory-remodeling',
    title: 'Factory Remodeling',
    category: 'Modular Skids',
    client: 'Process plant operator', location: 'India', year: '2023',
    summary: 'Modular skid packages and process integration for a factory modernization project.',
    order: 4, is_featured: true,
  },
  {
    slug: 'warehouse-support',
    title: 'Warehouse Support',
    category: 'Project Execution',
    client: 'Logistics & warehousing', location: 'India', year: '2023',
    summary: 'Storage tanks, transfer systems, and structural steelwork for a warehouse support facility.',
    order: 5, is_featured: true,
  },
  {
    slug: 'finishing-coating',
    title: 'Finishing & Coating',
    category: 'Drying & Solid Processing',
    client: 'Coatings manufacturer', location: 'India', year: '2024',
    summary: 'Process equipment for finishing and coating lines including agitated vessels and thermal exchangers.',
    order: 6, is_featured: true,
  },
  {
    slug: 'chemical-refinery',
    title: 'Chemical Refinery',
    category: 'Process Equipment',
    client: 'Chemical refinery', location: 'India', year: '2023',
    summary: 'Columns, condensers, and pressure vessels for a chemical refinery expansion project.',
    order: 7, is_featured: true,
  },
  {
    slug: 'thermal-processing',
    title: 'Thermal Processing',
    category: 'Thermal Systems',
    client: 'Process industry client', location: 'India', year: '2024',
    summary: 'Heat recovery systems, thermal oxidizers, and process heat exchangers for thermal processing facilities.',
    order: 8, is_featured: true,
  },
];

const TESTIMONIALS = [
  {
    author_name: 'Rajesh Menon', author_role: 'Plant Director', author_company: 'Leading chemical manufacturer',
    body: 'HI-NOVA APEX delivered our paddle dryer system on schedule and to exact specification. Their engineering team understood our process requirements and the build quality was excellent.',
    rating: 5, order: 1, is_featured: true,
  },
  {
    author_name: 'Anita Deshpande', author_role: 'Procurement Head', author_company: 'Pharmaceutical major',
    body: 'We trusted HI-NOVA with SS316L reactors for a pharmaceutical project. The fabrication, documentation, and IBR compliance were handled professionally from start to commissioning.',
    rating: 5, order: 2, is_featured: true,
  },
  {
    author_name: 'Sanjay Kulkarni', author_role: 'Process Engineering Manager', author_company: 'Refinery operator',
    body: 'Their heat exchangers and skid-mounted process piping arrived exactly as designed, with full traceability and documentation. We have since placed repeat orders with HI-NOVA.',
    rating: 5, order: 3, is_featured: true,
  },
];

// ─── Seeder ─────────────────────────────────────────────────────────────

async function seed() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Service account file not found: ${SERVICE_ACCOUNT_PATH}`);
    console.error('Set FIREBASE_SERVICE_ACCOUNT env var or place service-account.json in worker/');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  const projectId = serviceAccount.project_id;
  const token = await getAccessToken(serviceAccount);
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const force = process.env.FORCE === '1';

  const sections = [
    { name: 'team_members', items: TEAM_MEMBERS },
    { name: 'services', items: SERVICES },
    { name: 'projects', items: PROJECTS },
    { name: 'testimonials', items: TESTIMONIALS },
  ];

  let total = { created: 0, updated: 0, skipped: 0, failed: 0 };

  for (const section of sections) {
    console.log(`\n--- ${section.name} ---`);
    for (const item of section.items) {
      const result = await writeDoc(baseUrl, token, section.name, item, force);
      total[result]++;
    }
  }

  console.log(`\nSeed complete! Created: ${total.created}, Updated: ${total.updated}, Skipped: ${total.skipped}, Failed: ${total.failed}`);
}

async function writeDoc(baseUrl, token, collection, item, force) {
  const docId = item.slug;
  const docPath = `${baseUrl}/${collection}/${encodeURIComponent(docId)}`;

  // Add timestamps
  const docData = Object.assign({}, item, {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (!force) {
    try {
      const checkRes = await fetch(docPath, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        console.log(`  Skipped (exists): ${item.name || item.title || item.author_name} (id: ${docId})`);
        return 'skipped';
      }
    } catch (e) { /* fall through to write attempt */ }
  }

  // Encode fields for Firestore REST API
  const fields = {};
  for (const [key, value] of Object.entries(docData)) {
    if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: String(v) })) } };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: String(value) };
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
    console.log(`  ${force ? 'Updated' : 'Created'}: ${item.name || item.title || item.author_name} (id: ${docId})`);
    return force ? 'updated' : 'created';
  } else {
    const err = await res.text();
    console.error(`  Failed: ${item.name || item.title || item.author_name} — ${err}`);
    return 'failed';
  }
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
