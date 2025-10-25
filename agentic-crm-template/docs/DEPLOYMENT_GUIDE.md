# 🚀 Deployment & Branding Guide

Complete step-by-step guide to deploy your industry-customized CRM to production.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Branding Setup](#branding-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Platforms](#deployment-platforms)
5. [Domain & SSL Setup](#domain--ssl-setup)
6. [Post-Deployment Tasks](#post-deployment-tasks)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## ✅ Pre-Deployment Checklist

Before deploying to production, complete these tasks:

### Configuration
- [ ] Industry config finalized (`config/industry.json`)
- [ ] Theme customized (`config/theme.json`)
- [ ] All branding assets uploaded
- [ ] Environment variables configured
- [ ] Database schema updated (if using real DB)
- [ ] Slack workspace connected
- [ ] Email templates customized

### Testing
- [ ] All CRUD operations tested
- [ ] Pipeline stage transitions work
- [ ] Forms validate correctly
- [ ] Mobile responsive design verified
- [ ] Cross-browser testing completed
- [ ] Performance testing done (Lighthouse score > 90)
- [ ] Security audit passed

### Documentation
- [ ] User guide written
- [ ] Admin documentation ready
- [ ] API documentation complete (if exposing APIs)
- [ ] Onboarding materials prepared

---

## 🎨 Branding Setup

### Step 1: Update Theme Colors

Edit `config/theme.json`:

```json
{
  "colors": {
    "primary": {
      "DEFAULT": "#YOUR_PRIMARY_COLOR"
    },
    "secondary": {
      "DEFAULT": "#YOUR_SECONDARY_COLOR"
    }
  }
}
```

**Where colors appear:**
- **Primary** - Buttons, links, active states, highlights
- **Secondary** - Headers, sidebars, secondary buttons
- **Accent** - Badges, notifications, special callouts
- **Success** - Success messages, completed states
- **Warning** - Warning messages, pending states
- **Error** - Error messages, failed states

**Pro tip:** Use a color palette generator like [Coolors](https://coolors.co) or [Adobe Color](https://color.adobe.com)

### Step 2: Create Logo Assets

Required assets to place in `public/assets/`:

```
public/assets/
├── logo.svg              # Main logo (used in header)
├── logo-light.svg        # Light version (for dark backgrounds)
├── logo-dark.svg         # Dark version (for light backgrounds)
├── favicon.ico           # Browser tab icon (32x32)
├── apple-touch-icon.png  # iOS home screen icon (180x180)
├── og-image.png          # Social media preview (1200x630)
└── logo-full.svg         # Full logo with text (optional)
```

**Logo specifications:**
- **Format:** SVG (preferred) or PNG with transparency
- **Main logo:** 200px width max, maintains aspect ratio
- **Favicon:** 32x32 or 64x64 pixels, ICO or PNG
- **Apple touch icon:** 180x180 pixels, PNG
- **OG image:** 1200x630 pixels, PNG or JPG

**Design tools:**
- [Canva](https://canva.com) - Easy online design
- [Figma](https://figma.com) - Professional design tool
- [Looka](https://looka.com) - AI logo generator
- [Favicon.io](https://favicon.io) - Favicon generator

### Step 3: Update Brand Information

Edit `config/theme.json`:

```json
{
  "brand": {
    "name": "Your Company Name",
    "tagline": "Your Compelling Tagline",
    "logo": "/assets/logo.svg",
    "favicon": "/assets/favicon.ico"
  }
}
```

This updates:
- Browser title
- Meta tags
- Email signatures
- Footer text
- Login screen
- Marketing pages

### Step 4: Customize Typography

Edit `config/theme.json`:

```json
{
  "typography": {
    "fontFamily": {
      "sans": "Your Font, system-ui, sans-serif",
      "heading": "Your Heading Font, system-ui, sans-serif"
    }
  }
}
```

**Popular font combinations:**
- **Modern SaaS:** Inter + Inter
- **Professional:** Roboto + Roboto Slab
- **Creative:** Poppins + Merriweather
- **Tech:** JetBrains Mono + Space Grotesk

**Google Fonts setup:**
1. Choose fonts at [Google Fonts](https://fonts.google.com)
2. Add to `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Step 5: Run Branding Script

```bash
# Generate all themed files from config
npm run generate:theme

# This creates:
# - src/styles/theme.css (CSS variables)
# - src/styles/tailwind-theme.js (Tailwind config)
# - Updates manifest.json and meta tags
```

---

## ⚙️ Environment Configuration

### Development Environment

Create `.env.development`:

```bash
# Application
VITE_APP_NAME="Your CRM Dev"
VITE_APP_URL=http://localhost:5173
VITE_APP_ENV=development

# Slack (use test workspace)
VITE_SLACK_CLIENT_ID=your_dev_client_id
VITE_SLACK_CLIENT_SECRET=your_dev_secret
VITE_SLACK_SIGNING_SECRET=your_dev_signing_secret
VITE_SLACK_REDIRECT_URI=http://localhost:5173/auth/slack/callback

# OpenAI (optional, for AI features)
VITE_OPENAI_API_KEY=sk-your-dev-key

# Database (if using real backend)
DATABASE_URL=postgresql://user:pass@localhost:5432/crm_dev

# Feature Flags
VITE_ENABLE_AI=true
VITE_ENABLE_SLACK=true
VITE_ENABLE_ANALYTICS=false
```

### Production Environment

Create `.env.production`:

```bash
# Application
VITE_APP_NAME="Your CRM"
VITE_APP_URL=https://yourcrm.com
VITE_APP_ENV=production

# Slack (production workspace)
VITE_SLACK_CLIENT_ID=your_prod_client_id
VITE_SLACK_CLIENT_SECRET=your_prod_secret
VITE_SLACK_SIGNING_SECRET=your_prod_signing_secret
VITE_SLACK_REDIRECT_URI=https://yourcrm.com/auth/slack/callback

# OpenAI
VITE_OPENAI_API_KEY=sk-your-prod-key

# Database
DATABASE_URL=postgresql://user:pass@prod-host:5432/crm_prod

# Security
VITE_ENABLE_HTTPS_ONLY=true
VITE_SESSION_SECRET=your-long-random-secret-string

# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
VITE_ENABLE_AI=true
VITE_ENABLE_SLACK=true
VITE_ENABLE_ANALYTICS=true
```

**Security best practices:**
- Never commit `.env` files to git
- Use different credentials for dev/prod
- Rotate secrets regularly
- Use secret management tools (AWS Secrets Manager, Vault)

---

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended for Quick Deploy)

**Best for:** Prototypes, demos, small teams

**Steps:**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

4. **Set environment variables:**
```bash
# Via CLI
vercel env add VITE_SLACK_CLIENT_ID production

# Or via Vercel Dashboard:
# https://vercel.com/your-project/settings/environment-variables
```

5. **Custom domain:**
- Go to Project Settings → Domains
- Add your domain (yourcrm.com)
- Update DNS records as shown

**Pros:**
- ✅ Instant deploys
- ✅ Auto SSL
- ✅ Free tier available
- ✅ Built-in CDN

**Cons:**
- ❌ Limited backend support (serverless only)
- ❌ Cold starts

---

### Option 2: Netlify

**Best for:** Static sites, JAMstack apps

**Steps:**

1. **Connect Git repo:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect GitHub/GitLab

2. **Build settings:**
```
Build command: npm run build
Publish directory: dist
```

3. **Environment variables:**
   - Go to Site settings → Environment variables
   - Add all VITE_* variables

4. **Deploy:**
   - Push to main branch = auto deploy

**Pros:**
- ✅ Great for static sites
- ✅ Form handling
- ✅ Free SSL

**Cons:**
- ❌ Limited database support

---

### Option 3: AWS (Scalable Production)

**Best for:** Large deployments, full backend control

**Architecture:**
- **Frontend:** S3 + CloudFront
- **Backend:** ECS or Lambda
- **Database:** RDS PostgreSQL
- **Queue:** SQS for background jobs

**Steps:**

1. **Setup S3 bucket:**
```bash
aws s3 mb s3://yourcrm-frontend
aws s3 website s3://yourcrm-frontend --index-document index.html
```

2. **Build and upload:**
```bash
npm run build
aws s3 sync dist/ s3://yourcrm-frontend
```

3. **Setup CloudFront:**
```bash
aws cloudfront create-distribution \
  --origin-domain-name yourcrm-frontend.s3.amazonaws.com
```

4. **Database (RDS):**
```bash
aws rds create-db-instance \
  --db-instance-identifier yourcrm-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123
```

**Pros:**
- ✅ Full control
- ✅ Highly scalable
- ✅ Enterprise-ready

**Cons:**
- ❌ Complex setup
- ❌ Higher cost

---

### Option 4: Docker + DigitalOcean/Heroku

**Best for:** Mid-size deployments, custom backend

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

**Deploy to DigitalOcean:**

1. **Create droplet** (Ubuntu 22.04)

2. **Install Docker:**
```bash
sudo apt update
sudo apt install docker.io docker-compose
```

3. **Clone and build:**
```bash
git clone https://github.com/yourrepo/crm.git
cd crm
docker build -t yourcrm .
docker run -d -p 80:3000 --env-file .env.production yourcrm
```

4. **Setup nginx** (optional, for SSL):
```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d yourcrm.com
```

**Deploy to Heroku:**
```bash
heroku login
heroku create yourcrm
git push heroku main
heroku config:set VITE_SLACK_CLIENT_ID=your_id
```

---

## 🌍 Domain & SSL Setup

### Step 1: Purchase Domain

**Domain registrars:**
- [Namecheap](https://namecheap.com) - Affordable, easy to use
- [Google Domains](https://domains.google) - Clean interface
- [Cloudflare](https://cloudflare.com) - Free WHOIS privacy

### Step 2: Configure DNS

Point your domain to deployment:

**For Vercel:**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**For AWS CloudFront:**
```
Type: A
Name: @
Value: [CloudFront distribution domain]
Alias: Yes
```

**For DigitalOcean:**
```
Type: A
Name: @
Value: [Your droplet IP]
```

### Step 3: SSL Certificate

**Automatic SSL (Vercel/Netlify):**
- SSL automatically provisioned
- Auto-renewal

**Manual SSL (nginx):**
```bash
sudo certbot --nginx -d yourcrm.com -d www.yourcrm.com
```

**Verify SSL:**
- Visit https://yourcrm.com
- Check for padlock icon
- Test at [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## ✅ Post-Deployment Tasks

### 1. Verify Deployment

```bash
# Check if site is live
curl -I https://yourcrm.com

# Test API endpoints (if applicable)
curl https://yourcrm.com/api/health

# Run E2E tests
npm run test:e2e -- --baseUrl=https://yourcrm.com
```

### 2. Setup Monitoring

**Application Monitoring (Sentry):**
```bash
npm install @sentry/react
```

```javascript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
});
```

**Uptime Monitoring:**
- [UptimeRobot](https://uptimerobot.com) - Free, simple
- [Pingdom](https://pingdom.com) - Advanced monitoring
- [StatusCake](https://statuscake.com) - Good free tier

**Analytics:**
```bash
# Google Analytics
npm install react-ga4
```

### 3. Setup Backups

**Database backups (PostgreSQL):**
```bash
# Daily backup cron job
0 2 * * * pg_dump crm_prod > /backups/crm_$(date +\%Y\%m\%d).sql
```

**File backups (S3):**
```bash
# Backup uploads to S3
aws s3 sync /var/uploads/ s3://yourcrm-backups/uploads/
```

### 4. Configure CORS (if using API)

```javascript
// backend/server.js
app.use(cors({
  origin: 'https://yourcrm.com',
  credentials: true
}));
```

### 5. Setup CI/CD Pipeline

**GitHub Actions example:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Monitoring & Maintenance

### Performance Monitoring

**Key metrics to track:**
- Page load time (target: < 2s)
- Time to Interactive (target: < 3s)
- Lighthouse score (target: > 90)
- API response time (target: < 500ms)

**Tools:**
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WebPageTest](https://webpagetest.org)
- [Google PageSpeed Insights](https://pagespeed.web.dev)

### Error Tracking

**Setup Sentry alerts:**
```javascript
Sentry.init({
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.level === 'info') return null;
    return event;
  },
});
```

### Regular Maintenance Tasks

**Weekly:**
- [ ] Review error logs
- [ ] Check uptime reports
- [ ] Monitor disk space

**Monthly:**
- [ ] Update dependencies (`npm update`)
- [ ] Review security advisories
- [ ] Optimize database (VACUUM, REINDEX)
- [ ] Review analytics

**Quarterly:**
- [ ] Penetration testing
- [ ] Backup restore test
- [ ] Capacity planning review
- [ ] User feedback review

---

## 🔒 Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] SQL injection protection (use parameterized queries)
- [ ] XSS protection enabled
- [ ] Rate limiting on API endpoints
- [ ] Authentication tokens expire
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Access logs enabled

---

## 🆘 Troubleshooting

### Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment variables not working
- Ensure variables start with `VITE_` for Vite projects
- Restart dev server after changing `.env`
- Check variable names for typos

### Slack integration not working
- Verify redirect URI matches exactly
- Check Slack app is installed to workspace
- Verify client ID and secret

### Database connection fails
- Check firewall rules
- Verify connection string format
- Test connection with psql/mysql client

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [AWS Documentation](https://docs.aws.amazon.com)
- [Let's Encrypt](https://letsencrypt.org)
- [Web.dev Performance Guide](https://web.dev/performance)

---

**Need help?** Check out our [community forum](https://yourforum.com) or [email support](mailto:support@yourcompany.com).
