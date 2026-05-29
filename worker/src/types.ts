export interface Env {
  DB: any; // D1Database placeholder - using Firestore instead
  FIREBASE_SERVICE_ACCOUNT: string;
  ADMIN_TOKEN: string;
  ALLOWED_ORIGINS: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author_name: string;
  author_email?: string;
  author_image?: string;
  author_description?: string;
  cover_image: string;
  content_html: string;
  date_published: string;
  date_modified: string;
}

export interface NewsletterData {
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}
