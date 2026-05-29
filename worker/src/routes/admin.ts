import { FirestoreClient } from '../services/firestore';
import { BlogPost, ApiResponse } from '../types';

export async function handleAdminPosts(
  request: Request,
  db: FirestoreClient,
  path: string
): Promise<Response> {
  try {
    // POST /api/admin/posts - Create
    if (request.method === 'POST' && path === '/api/admin/posts') {
      const body = await request.json() as BlogPost;

      if (!body.slug || !body.title || !body.category || !body.content_html) {
        const response: ApiResponse = { success: false, error: 'Missing required fields: slug, title, category, content_html' };
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const id = await db.add('blog_posts', {
        slug: body.slug,
        title: body.title,
        description: body.description || '',
        category: body.category,
        author_name: body.author_name || 'Admin',
        author_email: body.author_email || '',
        author_image: body.author_image || '',
        author_description: body.author_description || '',
        cover_image: body.cover_image || '',
        content_html: body.content_html,
        date_published: body.date_published || new Date().toISOString(),
        date_modified: new Date().toISOString(),
      });

      const response: ApiResponse = { success: true, data: { id, slug: body.slug } };
      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // PUT /api/admin/posts/:id - Update
    const putMatch = path.match(/^\/api\/admin\/posts\/(.+)$/);
    if (putMatch && request.method === 'PUT') {
      const docId = putMatch[1];
      const body = await request.json() as Partial<BlogPost>;
      body.date_modified = new Date().toISOString();

      await db.update('blog_posts', docId, body);

      const response: ApiResponse = { success: true };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api/admin/posts/:id - Delete
    if (putMatch && request.method === 'DELETE') {
      const docId = putMatch[1];
      await db.delete('blog_posts', docId);

      const response: ApiResponse = { success: true };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // GET /api/admin/contacts - List contacts
    if (path === '/api/admin/contacts' && request.method === 'GET') {
      const contacts = await db.getAll('contacts', 'created_at', 100);
      const response: ApiResponse = { success: true, data: contacts };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // PUT /api/admin/contacts/:id/read - Mark as read
    const contactMatch = path.match(/^\/api\/admin\/contacts\/(.+)\/read$/);
    if (contactMatch && request.method === 'PUT') {
      const docId = contactMatch[1];
      await db.update('contacts', docId, { is_read: true });

      const response: ApiResponse = { success: true };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    const response: ApiResponse = { success: false, error: 'Admin operation failed' };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
