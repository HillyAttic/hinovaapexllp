import { FirestoreClient } from '../services/firestore';
import { ApiResponse } from '../types';

export async function handleBlogList(
  request: Request,
  db: FirestoreClient
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '6')));

    let posts;
    if (category) {
      posts = await db.query('blog_posts', 'category', 'EQUAL', category, 'date_published', 100);
    } else {
      posts = await db.getAll('blog_posts', 'date_published', 100);
    }

    // Sort by date descending
    posts.sort((a: any, b: any) => {
      const dateA = new Date(a.date_published || 0).getTime();
      const dateB = new Date(b.date_published || 0).getTime();
      return dateB - dateA;
    });

    const total = posts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedPosts = posts.slice(start, start + limit);

    // Remove content_html from list response for lighter payload
    const lightweightPosts = paginatedPosts.map(({ content_html, ...rest }: any) => rest);

    const response: ApiResponse = {
      success: true,
      data: {
        posts: lightweightPosts,
        total,
        page,
        limit,
        total_pages: totalPages,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    const response: ApiResponse = { success: false, error: 'Failed to fetch blog posts' };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleBlogBySlug(
  slug: string,
  db: FirestoreClient
): Promise<Response> {
  try {
    const results = await db.query('blog_posts', 'slug', 'EQUAL', slug);
    const post = results[0];

    if (!post) {
      const response: ApiResponse = { success: false, error: 'Post not found' };
      return new Response(JSON.stringify(response), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response: ApiResponse = { success: true, data: post };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    const response: ApiResponse = { success: false, error: 'Failed to fetch blog post' };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
