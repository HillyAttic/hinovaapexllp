import { FirestoreClient } from '../services/firestore';
import { ApiResponse } from '../types';

/**
 * Generic CRUD handler for a single content collection.
 * Handles:
 *   GET    /api/admin/:collection
 *   POST   /api/admin/:collection
 *   PUT    /api/admin/:collection/:id
 *   DELETE /api/admin/:collection/:id
 *
 * Optional `requireFields` enforces that certain fields are present on create.
 */
export async function handleAdminCollection(
  request: Request,
  db: FirestoreClient,
  collection: string,
  path: string,
  opts: { requireFields?: string[] } = {}
): Promise<Response> {
  try {
    // GET /api/admin/:collection
    if (request.method === 'GET' && path === `/api/admin/${collection}`) {
      const items = await db.getAll(collection, 'order', 200);
      const response: ApiResponse = { success: true, data: items };
      return json(response, 200);
    }

    // POST /api/admin/:collection
    if (request.method === 'POST' && path === `/api/admin/${collection}`) {
      const body = await request.json() as Record<string, any>;
      const errors: Record<string, string> = {};
      if (opts.requireFields) {
        for (const f of opts.requireFields) {
          if (!body[f] || (typeof body[f] === 'string' && body[f].trim() === '')) {
            errors[f] = `${f} is required`;
          }
        }
      }
      if (Object.keys(errors).length > 0) {
        return json({ success: false, errors }, 400);
      }
      const id = await db.add(collection, {
        ...body,
        order: typeof body.order === 'number' ? body.order : Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return json({ success: true, data: { id } }, 201);
    }

    // PUT/DELETE /api/admin/:collection/:id
    const match = path.match(new RegExp(`^/api/admin/${collection}/(.+)$`));
    if (match) {
      const docId = match[1];
      if (request.method === 'PUT') {
        const body = await request.json() as Record<string, any>;
        body.updated_at = new Date().toISOString();
        await db.update(collection, docId, body);
        return json({ success: true }, 200);
      }
      if (request.method === 'DELETE') {
        await db.delete(collection, docId);
        return json({ success: true }, 200);
      }
    }

    return json({ error: 'Not found' }, 404);
  } catch (e: any) {
    return json({ success: false, error: 'Admin operation failed' }, 500);
  }
}

function json(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
