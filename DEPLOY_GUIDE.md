# Deployment Guide - Ewige Melodien

## Option 1: Render.com (Recommended - FREE)

### Step 1: Prepare Your Project
1. Download the project ZIP
2. Extract it to a folder
3. Make sure `.env` has your real keys (for production)

### Step 2: Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ewige-melodien.git
git push -u origin main
```

### Step 3: Deploy on Render
1. Go to https://render.com and sign up (free)
2. Click New + -> Web Service
3. Connect your GitHub repository
4. Configure:
   - Name: `ewige-melodien`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: Free
5. Add Environment Variables:
   - `JWT_SECRET` = a long random string
   - `STRIPE_SECRET_KEY` = your Stripe key
   - `STRIPE_PUBLISHABLE_KEY` = your Stripe publishable key
   - `PAYPAL_CLIENT_ID` = your PayPal ID
   - `PAYPAL_CLIENT_SECRET` = your PayPal secret
6. Click Create Web Service

### Step 4: Your Site is Live!
- URL will be: `https://ewige-melodien.onrender.com`
- Custom domain: Add your `EwigeMelodien.de` in Render settings

---

## Option 2: Railway.app (FREE $5/month credit)

1. Go to https://railway.app
2. New Project -> Deploy from GitHub repo
3. Add variables in Settings -> Variables
4. Deploy automatically

---

## Option 3: Glitch.com (FREE, good for testing)

1. Go to https://glitch.com
2. New Project -> Import from GitHub
3. Edit `.env` file in Glitch editor
4. Your app gets a free URL instantly

---

## Option 4: Cyclic.sh (FREE)

1. Go to https://cyclic.sh
2. Connect GitHub repo
3. Add environment variables
4. Deploy

---

## Adding Your Music Files

Since free tiers don't have persistent file storage for uploads, you have 2 options:

### Option A: Git LFS (Git Large File Storage)
```bash
git lfs track "public/music/*.mp3"
git lfs track "public/music/covers/*.jpg"
git add .gitattributes
git add public/music/
git commit -m "Add music files"
git push
```

### Option B: Cloud Storage (Recommended)
Upload MP3 files to:
- AWS S3 (free tier: 5GB)
- Cloudinary (free tier: 25GB)
- Firebase Storage (free tier: 5GB)

Then update the `file_path` and `cover` fields in the database to point to cloud URLs.

---

## Connecting Your Domain (EwigeMelodien.de)

### On Render:
1. Go to your Web Service -> Settings -> Custom Domains
2. Add `EwigeMelodien.de`
3. Copy the DNS target (CNAME record)
4. In your Namecheap DNS settings:
   - Add CNAME record: `www` -> pointing to Render DNS target
   - Or use A record for root domain

### On Railway:
1. Settings -> Domains -> Add custom domain
2. Follow DNS instructions

---

## Setting Up Payments

### Stripe:
1. Create account at https://stripe.com
2. Get API keys from Dashboard -> Developers -> API keys
3. Add to environment variables
4. For testing, use test cards like `4242 4242 4242 4242`

### PayPal:
1. Create developer account at https://developer.paypal.com
2. Create an app to get Client ID and Secret
3. Add to environment variables and `index.html` script tag

---

## Database Notes

SQLite is file-based and works perfectly for small-medium sites.
- On Render Free: Database persists between deploys but may reset if instance restarts
- For production with heavy traffic, consider upgrading to PostgreSQL (Render offers free PostgreSQL too!)

---

## Free Tier Limits

| Platform | Limit | Sleep Mode |
|----------|-------|------------|
| Render | 750 hrs/month | After 15 min idle |
| Railway | $5 credit/month | None |
| Glitch | Unlimited (with limits) | None |
| Cyclic | 100K requests/month | None |

---

## Checklist Before Going Live

- [ ] SSL/HTTPS active (required for payments)
- [ ] Real Stripe keys in production
- [ ] Real PayPal keys in production
- [ ] Music files uploaded
- [ ] Logo file in place
- [ ] Contact email updated
- [ ] Domain connected
- [ ] Database backed up

Your site will be FREE until you get traffic, then easily move to Namecheap hosting!
