import { FirestoreClient } from '../services/firestore';
import { ContactFormData, ApiResponse } from '../types';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function handleContact(
  request: Request,
  db: FirestoreClient
): Promise<Response> {
  try {
    const body = await request.json() as ContactFormData;

    const errors: Record<string, string> = {};
    if (!body.name || body.name.trim().length === 0) errors.name = 'Name is required';
    if (!body.email || !validateEmail(body.email)) errors.email = 'Valid email is required';
    if (!body.message || body.message.trim().length === 0) errors.message = 'Message is required';
    if (body.name && body.name.length > 256) errors.name = 'Name must be under 256 characters';
    if (body.message && body.message.length > 5000) errors.message = 'Message must be under 5000 characters';

    if (Object.keys(errors).length > 0) {
      const response: ApiResponse = { success: false, errors };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = await db.add('contacts', {
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || '',
      subject: body.subject?.trim() || '',
      message: body.message.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    });

    const response: ApiResponse = { success: true, data: { id } };
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    const response: ApiResponse = { success: false, error: 'Failed to submit contact form' };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
