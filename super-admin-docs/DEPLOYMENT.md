# Deployment Guide

Guide for deploying the Super Admin application to Vercel.

## Prerequisites

- ✅ Vercel account
- ✅ GitHub repository with Super Admin code
- ✅ Supabase database access (same as CRM app)
- ✅ Stripe and/or Razorpay API keys
- ✅ Custom domain (optional but recommended)

## Step 1: Prepare for Deployment

### 1.1 Environment Variables

Collect all required environment variables from `.env.local`:

```bash
# Required
- DATABASE_URL
- DIRECT_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPER_ADMIN_JWT_SECRET
- SUPER_ADMIN_SESSION_SECRET

# Billing
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RAZORPAY_KEY_SECRET

# Optional
- REDIS_URL
- RESEND_API_KEY
```

### 1.2 Build Test

Test production build locally:

```bash
npm run build
npm run start
```

Visit http://localhost:3001 and verify everything works.

## Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

### 2.3 Initial Deployment

From your project directory:

```bash
# Deploy to preview
vercel

# Or deploy to production
vercel --prod
```

### 2.4 Configure Environment Variables

Add environment variables in Vercel dashboard:

1. Go to your project on https://vercel.com
2. Click **Settings** → **Environment Variables**
3. Add all variables from your `.env.local`
4. Make sure to add them for **Production**, **Preview**, and **Development**

**Critical variables:**
```
DATABASE_URL
DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
SUPER_ADMIN_JWT_SECRET
SUPER_ADMIN_SESSION_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

### 2.5 Configure Build Settings

In Vercel dashboard:

1. **Framework Preset**: Next.js
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

## Step 3: Configure Custom Domain

### 3.1 Add Domain in Vercel

1. Go to **Settings** → **Domains**
2. Add your domain: `admin.hrplatform.com`
3. Follow Vercel's DNS configuration instructions

### 3.2 Update DNS Records

Add these DNS records in your domain registrar:

**Option A: Using Vercel nameservers (Recommended)**
```
Type: NS
Host: @
Value: ns1.vercel-dns.com
Value: ns2.vercel-dns.com
```

**Option B: Using A/CNAME records**
```
Type: A
Host: admin
Value: 76.76.21.21

Type: CNAME
Host: www.admin
Value: cname.vercel-dns.com
```

### 3.3 Wait for SSL Certificate

Vercel automatically provisions an SSL certificate. Wait 5-10 minutes.

### 3.4 Update Environment Variables

Update URLs in environment variables:

```bash
NEXT_PUBLIC_APP_URL=https://admin.hrplatform.com
NEXT_PUBLIC_API_URL=https://admin.hrplatform.com/api
```

Redeploy after updating:

```bash
vercel --prod
```

## Step 4: Configure Webhooks

### 4.1 Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. Enter URL: `https://admin.hrplatform.com/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret**
6. Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

### 4.2 Razorpay Webhooks

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Enter URL: `https://admin.hrplatform.com/api/webhooks/razorpay`
3. Select events: `payment.captured`, `subscription.charged`, etc.
4. Copy the **Secret**
5. Add to Vercel env vars as `RAZORPAY_WEBHOOK_SECRET`

## Step 5: Verify Deployment

### 5.1 Health Check

Visit your deployment and verify:

- [ ] Login page loads
- [ ] Can login with Super Admin credentials
- [ ] Dashboard displays data
- [ ] Company list loads
- [ ] Can create new company
- [ ] Billing pages work
- [ ] Analytics dashboard loads

### 5.2 Test Webhooks

Use Stripe/Razorpay test mode to verify webhooks:

1. Create test subscription
2. Verify webhook is received
3. Check database for updates

### 5.3 Performance Check

Use Vercel Analytics:

1. Enable Analytics in Vercel dashboard
2. Monitor page load times
3. Check for errors

## Step 6: Security Configuration

### 6.1 Environment Variables Security

Verify sensitive variables are:
- ✅ Not in git repository
- ✅ Set in Vercel dashboard only
- ✅ Marked as "Sensitive" in Vercel

### 6.2 CORS Configuration

Update CORS origins if needed:

```typescript
// middleware.ts or api routes

const allowedOrigins = [
  'https://admin.hrplatform.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null
].filter(Boolean);
```

### 6.3 IP Whitelist (Optional)

For extra security, restrict access by IP:

```typescript
// middleware.ts

const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [];

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for');

  if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(ip)) {
    return new Response('Forbidden', { status: 403 });
  }

  // ... rest of middleware
}
```

## Step 7: Monitoring & Logging

### 7.1 Enable Vercel Logs

1. Go to **Deployments** → Select deployment → **Functions**
2. View real-time logs
3. Set up log drains if needed

### 7.2 Error Tracking (Sentry)

Install Sentry:

```bash
npm install @sentry/nextjs
```

Configure:

```bash
npx @sentry/wizard@latest -i nextjs
```

Add `SENTRY_DSN` to Vercel env vars.

### 7.3 Uptime Monitoring

Use services like:
- Better Uptime
- Pingdom
- UptimeRobot

Monitor: `https://admin.hrplatform.com/api/health`

## Step 8: CI/CD Setup

### 8.1 GitHub Integration

Vercel automatically deploys on git push:

1. Connect repository in Vercel dashboard
2. **Production** branch: `main`
3. **Preview** branches: All other branches
4. Enable automatic deployments

### 8.2 Deployment Protection

Enable deployment protection:

1. Go to **Settings** → **Deployment Protection**
2. Enable **Vercel Authentication** for preview deployments
3. Add team members

## Troubleshooting

### Build Fails

**Error: Cannot find module**
```bash
# Solution: Ensure all dependencies in package.json
npm install
```

**Error: Prisma client not generated**
```bash
# Solution: Add postinstall script to package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Database Connection Fails

**Error: P1001 - Can't reach database**
- Verify `DIRECT_URL` is correct
- Check Supabase allows connections from Vercel IPs
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Webhooks Not Working

- Verify webhook URL is correct
- Check webhook secret is set
- View Vercel function logs for errors
- Test with Stripe CLI: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`

### Authentication Issues

- Verify `SUPER_ADMIN_JWT_SECRET` is set
- Check cookie domain settings
- Verify HTTPS is enabled

## Rollback Strategy

### Instant Rollback

If issues occur:

1. Go to Vercel dashboard → **Deployments**
2. Find last working deployment
3. Click **⋯** → **Promote to Production**

### Manual Rollback

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

## Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Custom domain configured with SSL
- [ ] Webhooks configured and tested
- [ ] Database connection verified
- [ ] Super Admin user created
- [ ] Analytics enabled
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team notified of new URL

## Post-Deployment

1. **Update CRM app** with Super Admin URL if needed
2. **Create Super Admin users** for your team
3. **Test all critical features** in production
4. **Monitor logs** for first 24 hours
5. **Set up alerts** for errors and downtime

## Maintenance

### Regular Tasks

- **Weekly**: Review error logs
- **Monthly**: Check performance metrics
- **Quarterly**: Review and update dependencies
- **As needed**: Database schema updates

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update
npm update

# Test locally
npm run build
npm run start

# Deploy
vercel --prod
```

## Support

For deployment issues:
- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Community Discord: https://vercel.com/discord

## Next Steps

After deployment:
- Review [INTEGRATION.md](./INTEGRATION.md) for CRM app integration
- See [SHARED-CONCERNS.md](./SHARED-CONCERNS.md) for coordination with CRM repo
