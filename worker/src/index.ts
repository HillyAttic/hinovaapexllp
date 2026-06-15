import { Env } from './types';
import { getCORSHeaders, handleCORS } from './middleware/cors';
import { verifyAdminToken } from './middleware/auth';
import { FirestoreClient } from './services/firestore';
import { handleContact } from './routes/contact';
import { handleBlogList, handleBlogBySlug } from './routes/blog';
import { handleNewsletter } from './routes/newsletter';
import { handleAdminPosts } from './routes/admin';
import { handleAdminCollection } from './routes/content';
import { handlePublicContent } from './routes/content-public';

function jsonResponse(data: any, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// Public CMS collections (no auth needed, read-only)
const PUBLIC_CONTENT_COLLECTIONS = ['team_members', 'services', 'projects', 'testimonials', 'industries'];

// Admin CMS collections (Bearer token required)
const ADMIN_CONTENT_COLLECTIONS = {
  team_members: { requireFields: ['name', 'role'] },
  services: { requireFields: ['title'] },
  projects: { requireFields: ['title'] },
  testimonials: { requireFields: ['author_name', 'body'] },
  industries: { requireFields: ['title'] },
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin');
    const corsHeaders = getCORSHeaders(env.ALLOWED_ORIGINS, origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(env.ALLOWED_ORIGINS, request);
    }

    // Initialize Firestore client
    let db: FirestoreClient;
    try {
      db = new FirestoreClient(env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      return jsonResponse({ error: 'Firebase configuration error' }, 500, corsHeaders);
    }

    try {
      // POST /api/contact
      if (path === '/api/contact' && request.method === 'POST') {
        const response = await handleContact(request, db, { RESEND_API_KEY: env.RESEND_API_KEY });
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      // POST /api/newsletter
      if (path === '/api/newsletter' && request.method === 'POST') {
        const response = await handleNewsletter(request, db);
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      // GET /api/blog
      if (path === '/api/blog' && request.method === 'GET') {
        const response = await handleBlogList(request, db);
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      // GET /api/blog/:slug
      const slugMatch = path.match(/^\/api\/blog\/([^/]+)$/);
      if (slugMatch && request.method === 'GET') {
        const response = await handleBlogBySlug(slugMatch[1], db);
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      // ─── PUBLIC CMS endpoints (no auth, GET only) ──────────────────────
      //   GET /api/content/:collection
      //   GET /api/content/:collection/:id
      for (const collection of PUBLIC_CONTENT_COLLECTIONS) {
        if (path === `/api/content/${collection}` ||
            path.startsWith(`/api/content/${collection}/`)) {
          const response = await handlePublicContent(request, db, collection, path);
          Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
          return response;
        }
      }

      // ─── Admin blog endpoints (existing) ──────────────────────────────
      //   GET    /api/admin/contacts
      //   POST   /api/admin/posts
      //   PUT    /api/admin/posts/:id
      //   DELETE /api/admin/posts/:id
      //   PUT    /api/admin/contacts/:id/read
      if (path === '/api/admin/posts' ||
          path.match(/^\/api\/admin\/posts\/[^/]+$/) ||
          path === '/api/admin/contacts' ||
          path.match(/^\/api\/admin\/contacts\/[^/]+\/read$/)) {
        if (!verifyAdminToken(request, env.ADMIN_TOKEN)) {
          return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }
        const response = await handleAdminPosts(request, db, path);
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      // ─── Admin CMS endpoints (new collections) ────────────────────────
      //   GET    /api/admin/team_members
      //   POST   /api/admin/team_members
      //   PUT    /api/admin/team_members/:id
      //   DELETE /api/admin/team_members/:id
      // (same for services, projects, testimonials)
      for (const [collection, opts] of Object.entries(ADMIN_CONTENT_COLLECTIONS)) {
        if (path === `/api/admin/${collection}` ||
            path.startsWith(`/api/admin/${collection}/`)) {
          if (!verifyAdminToken(request, env.ADMIN_TOKEN)) {
            return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
          }
          const response = await handleAdminCollection(request, db, collection, path, opts);
          Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
          return response;
        }
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
    } catch (e: any) {
      return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
    }
  },
};
