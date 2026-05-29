import { Env } from './types';
import { getCORSHeaders, handleCORS } from './middleware/cors';
import { verifyAdminToken } from './middleware/auth';
import { FirestoreClient } from './services/firestore';
import { handleContact } from './routes/contact';
import { handleBlogList, handleBlogBySlug } from './routes/blog';
import { handleNewsletter } from './routes/newsletter';
import { handleAdminPosts } from './routes/admin';

function jsonResponse(data: any, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

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
        const response = await handleContact(request, db);
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

      // Admin endpoints
      if (path.startsWith('/api/admin/')) {
        if (!verifyAdminToken(request, env.ADMIN_TOKEN)) {
          return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }
        const response = await handleAdminPosts(request, db, path);
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
        return response;
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
    } catch (e: any) {
      return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
    }
  },
};
