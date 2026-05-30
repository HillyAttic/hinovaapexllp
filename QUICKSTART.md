# Quick Start Checklist

Follow these steps to get your contact form working:

## ☐ 1. Login to Cloudflare

```bash
! cd worker && npx wrangler login
```

## ☐ 2. Set Up Firebase

- [ ] Create/select Firebase project at https://console.firebase.google.com/
- [ ] Enable Firestore Database
- [ ] Download service account JSON (Project Settings → Service Accounts → Generate New Private Key)

## ☐ 3. Configure Worker Secrets

```bash
# Paste the entire Firebase JSON when prompted
! cd worker && npx wrangler secret put FIREBASE_SERVICE_ACCOUNT

# Create a strong random token
! cd worker && npx wrangler secret put ADMIN_TOKEN
```

## ☐ 4. Deploy Worker

```bash
! cd worker && npx wrangler deploy
```

**Copy the worker URL from the output!**

## ☐ 5. Update Frontend

Update the API URL in `contact.html` (line 11):

```html
<meta name="api-base" content="YOUR_WORKER_URL_HERE">
```

Replace `YOUR_WORKER_URL_HERE` with the URL from step 4.

## ☐ 6. Test

1. Open your contact page
2. Submit the form
3. Check Firebase Console → Firestore → `contacts` collection

---

**Need help?** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions and troubleshooting.
