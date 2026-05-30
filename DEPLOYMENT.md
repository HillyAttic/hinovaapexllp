# Deployment Guide

This guide will help you deploy your contact form backend to Cloudflare Workers and connect it to Firebase Firestore.

## Prerequisites

- A Cloudflare account (free tier works)
- A Firebase project with Firestore enabled
- Node.js installed on your machine

## Step 1: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Firestore Database**:
   - Go to Build → Firestore Database
   - Click "Create database"
   - Choose production mode
   - Select a location close to your users

4. Create a service account:
   - Go to Project Settings (gear icon) → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely (you'll need it in Step 3)

## Step 2: Login to Cloudflare

Open your terminal in the project directory and run:

```bash
! cd worker && npx wrangler login
```

This will open a browser window. Log in with your Cloudflare account and authorize Wrangler.

## Step 3: Configure Secrets

You need to set two secrets for your worker:

### 3.1 Set Firebase Service Account

```bash
! cd worker && npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
```

When prompted, paste the **entire contents** of the JSON file you downloaded in Step 1. It should look like:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  ...
}
```

### 3.2 Set Admin Token

Create a strong random token for admin endpoints:

```bash
! cd worker && npx wrangler secret put ADMIN_TOKEN
```

When prompted, enter a secure random string (e.g., generate one with a password manager). Save this token - you'll need it to access admin endpoints.

## Step 4: Deploy the Worker

```bash
! cd worker && npx wrangler deploy
```

After deployment, you'll see output like:

```
Published hinovaapexllp-worker (X.XX sec)
  https://hinovaapexllp-worker.your-subdomain.workers.dev
```

**Copy this URL** - you'll need it in the next step.

## Step 5: Update Frontend Configuration

Update the API base URL in your HTML file:

1. Open `contact.html` in your editor
2. Find this line in the `<head>` section:
   ```html
   <meta name="api-base" content="https://hinovaapexllp-worker.your-subdomain.workers.dev">
   ```
3. Replace `your-subdomain` with the actual URL from Step 4

**OR** if you want to use a custom domain:

1. In Cloudflare dashboard, go to Workers & Pages → your worker
2. Click "Settings" → "Triggers" → "Add Custom Domain"
3. Add your domain (e.g., `api.hinovaapexllp.com`)
4. Update the meta tag to use your custom domain

## Step 6: Update CORS Origins

If your website domain is different from what's in `wrangler.toml`, update it:

1. Open `worker/wrangler.toml`
2. Update the `ALLOWED_ORIGINS` line:
   ```toml
   ALLOWED_ORIGINS = "https://hinovaapexllp.com,https://www.hinovaapexllp.com"
   ```
3. Add any additional domains you need (comma-separated)
4. Redeploy: `! cd worker && npx wrangler deploy`

## Step 7: Test Your Forms

### Test Contact Form

1. Open your website's contact page
2. Fill out the form and submit
3. Check Firebase Console → Firestore Database → `contacts` collection
4. You should see your submission

### Test Newsletter Form

1. Scroll to the footer on any page
2. Enter an email and submit
3. Check Firebase Console → Firestore Database → `newsletter_subscribers` collection
4. You should see the subscription

## Troubleshooting

### Form submission fails with CORS error

- Check that your domain is listed in `ALLOWED_ORIGINS` in `wrangler.toml`
- Redeploy after making changes

### "Firebase configuration error"

- Verify the `FIREBASE_SERVICE_ACCOUNT` secret is set correctly
- Make sure you pasted the entire JSON file content
- Check that the service account has Firestore permissions

### "Network error. Please try again."

- Check that the API base URL in `contact.html` matches your deployed worker URL
- Verify the worker is deployed and accessible
- Check browser console for detailed error messages

### Worker not found (404)

- Make sure you deployed the worker: `! cd worker && npx wrangler deploy`
- Check that the URL in the meta tag matches the deployed worker URL

## Viewing Submissions

### Via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database
4. Browse the `contacts` and `newsletter_subscribers` collections

### Via Admin API (Optional)

You can create an admin dashboard to view submissions. The worker includes admin endpoints:

- `GET /api/admin/contacts` - List all contact submissions
- `GET /api/admin/newsletter` - List all newsletter subscribers

Include the admin token in the Authorization header:
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

## Updating the Worker

Whenever you make changes to the worker code:

```bash
! cd worker && npx wrangler deploy
```

Changes take effect immediately (no need to update secrets unless they changed).

## Cost

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **Firebase Firestore**: Free tier includes 50,000 reads + 20,000 writes/day

For a typical small business website, you'll stay well within the free tier.

## Next Steps

- Set up email notifications when forms are submitted (using Cloudflare Email Workers or a service like SendGrid)
- Create an admin dashboard to manage submissions
- Add spam protection (reCAPTCHA, rate limiting)
- Set up automated backups of Firestore data

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Cloudflare Workers logs: Dashboard → Workers & Pages → your worker → Logs
3. Check Firebase logs in the Firebase Console
