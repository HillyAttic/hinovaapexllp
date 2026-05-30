# Hinovaapexllp Worker

Cloudflare Worker backend for contact forms, newsletter subscriptions, and blog API.

## Features

- **Contact Form API** - Validates and stores contact form submissions
- **Newsletter API** - Manages email subscriptions with duplicate checking
- **Blog API** - Serves blog posts with pagination and filtering
- **Admin API** - Protected endpoints for managing content and viewing submissions
- **Firebase Firestore** - Uses REST API for serverless compatibility
- **CORS Support** - Configurable allowed origins

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Configure Secrets

```bash
# Firebase service account (paste entire JSON)
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT

# Admin token (generate a strong random string)
npx wrangler secret put ADMIN_TOKEN
```

### 4. Update Configuration

Edit `wrangler.toml` to set your allowed origins:

```toml
ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
```

### 5. Deploy

```bash
npx wrangler deploy
```

## Development

### Local Development

```bash
npm run dev
```

This starts a local development server. You'll need to set secrets locally:

```bash
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT --env dev
npx wrangler secret put ADMIN_TOKEN --env dev
```

### Type Checking

```bash
npx tsc --noEmit
```

### Seed Blog Posts

Migrate existing blog posts from HTML files to Firestore:

```bash
# Set service account path
$env:FIREBASE_SERVICE_ACCOUNT="path/to/service-account.json"

# Run seed script
npm run seed
```

## API Endpoints

### Public Endpoints

#### POST /api/contact
Submit a contact form.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Inquiry",
  "message": "Hello, I have a question..."
}
```

**Response:**
```json
{
  "success": true,
  "data": { "id": "abc123" }
}
```

#### POST /api/newsletter
Subscribe to newsletter.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET /api/blog
List blog posts with pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Posts per page (default: 6, max: 50)
- `category` - Filter by category

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "total": 10,
    "page": 1,
    "limit": 6,
    "total_pages": 2
  }
}
```

#### GET /api/blog/:slug
Get a single blog post by slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "slug": "post-slug",
    "title": "Post Title",
    "content_html": "<p>...</p>",
    ...
  }
}
```

### Admin Endpoints

All admin endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### GET /api/admin/contacts
List all contact form submissions.

#### PUT /api/admin/contacts/:id/read
Mark a contact submission as read.

#### POST /api/admin/posts
Create a new blog post.

#### PUT /api/admin/posts/:id
Update an existing blog post.

#### DELETE /api/admin/posts/:id
Delete a blog post.

## Project Structure

```
worker/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── middleware/
│   │   ├── auth.ts           # Admin authentication
│   │   └── cors.ts           # CORS handling
│   ├── routes/
│   │   ├── contact.ts        # Contact form handler
│   │   ├── newsletter.ts     # Newsletter handler
│   │   ├── blog.ts           # Blog API
│   │   └── admin.ts          # Admin endpoints
│   └── services/
│       └── firestore.ts      # Firestore REST client
├── scripts/
│   └── seed.js               # Blog migration script
├── package.json
├── tsconfig.json
└── wrangler.toml
```

## Firestore Collections

### contacts
```javascript
{
  name: string,
  email: string,
  phone: string,
  subject: string,
  message: string,
  is_read: boolean,
  created_at: string
}
```

### newsletter_subscribers
```javascript
{
  email: string,
  is_active: boolean,
  created_at: string
}
```

### blog_posts
```javascript
{
  slug: string,
  title: string,
  description: string,
  category: string,
  author_name: string,
  author_email: string,
  author_image: string,
  author_description: string,
  cover_image: string,
  content_html: string,
  date_published: string,
  date_modified: string
}
```

## Environment Variables

Set via `wrangler secret put`:

- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (entire file content)
- `ADMIN_TOKEN` - Bearer token for admin endpoints

Set in `wrangler.toml`:

- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

## Security

- Input validation on all endpoints
- Email format validation
- Length limits on text fields
- CORS protection
- Admin endpoints require Bearer token
- Firebase authentication via service account
- No secrets in code

## Troubleshooting

### "Firebase configuration error"
- Verify `FIREBASE_SERVICE_ACCOUNT` secret is set correctly
- Ensure you pasted the entire JSON file content
- Check that the service account has Firestore permissions

### CORS errors
- Add your domain to `ALLOWED_ORIGINS` in `wrangler.toml`
- Redeploy after making changes

### "Unauthorized" on admin endpoints
- Verify the `Authorization: Bearer TOKEN` header is set
- Ensure the token matches the `ADMIN_TOKEN` secret

## License

Private - All rights reserved
