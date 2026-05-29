import { FirestoreClient } from '../services/firestore';
import { NewsletterData, ApiResponse } from '../types';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function handleNewsletter(
  request: Request,
  db: FirestoreClient
): Promise<Response> {
  try {
    const body = await request.json() as NewsletterData;

    if (!body.email || !validateEmail(body.email)) {
      const response: ApiResponse = { success: false, error: 'Valid email is required' };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already subscribed
    const existing = await db.query('newsletter_subscribers', 'email', 'EQUAL', body.email.trim());
    if (existing.length > 0) {
      const response: ApiResponse = { success: false, error: 'Already subscribed' };
      return new Response(JSON.stringify(response), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.add('newsletter_subscribers', {
      email: body.email.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    });

    const response: ApiResponse = { success: true };
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    const response: ApiResponse = { success: false, error: 'Failed to subscribe' };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
