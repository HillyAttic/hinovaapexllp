import { FirestoreClient } from '../services/firestore';
import { ApiResponse } from '../types';

/**
 * Public (no-auth) GET endpoint for a content collection.
 * Supports:
 *   GET /api/content/:collection        -> all items, sorted by `order` ascending
 *   GET /api/content/:collection/:id    -> single item
 *
 * For team_members, also supports ?slug=... lookup.
 * For services, also supports ?featured=true filter.
 * For projects, also supports ?category=... filter.
 */
export async function handlePublicContent(
  request: Request,
  db: FirestoreClient,
  collection: string,
  path: string
): Promise<Response> {
  try {
    if (request.method !== 'GET') {
      return json({ success: false, error: 'Method not allowed' }, 405);
    }

    const basePath = `/api/content/${collection}`;
    const url = new URL(request.url);

    // Single item by id
    const idMatch = path.match(new RegExp(`^${basePath}/(.+)$`));
    if (idMatch && path !== basePath + '/') {
      const id = idMatch[1];
      const item = await db.get(collection, id);
      if (!item) {
        return json({ success: false, error: 'Not found' }, 404);
      }
      return json({ success: true, data: item }, 200);
    }

    // List with optional filters
    let items = await db.getAll(collection, 'order', 200);

    // ?slug=<slug> lookup (team_members)
    const slug = url.searchParams.get('slug');
    if (slug) {
      items = items.filter((it: any) => it.slug === slug);
      return json({ success: true, data: items[0] || null }, 200);
    }

    // ?featured=true (services, testimonials, projects)
    if (url.searchParams.get('featured') === 'true') {
      items = items.filter((it: any) => it.featured === true || it.is_featured === true);
    }

    // ?category=<cat> (projects)
    const category = url.searchParams.get('category');
    if (category) {
      items = items.filter((it: any) => it.category === category);
    }

    // Sort ascending by `order` (then by `name` for stability)
    items.sort((a: any, b: any) => {
      const ao = typeof a.order === 'number' ? a.order : 9999;
      const bo = typeof b.order === 'number' ? b.order : 9999;
      if (ao !== bo) return ao - bo;
      return String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''));
    });

    return json({ success: true, data: items }, 200);
  } catch (e: any) {
    return json({ success: false, error: 'Failed to load content' }, 500);
  }
}

function json(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
