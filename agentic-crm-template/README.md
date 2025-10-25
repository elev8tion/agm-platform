# 🎯 Multi-Industry CRM Template

**Transform this CRM for any industry in 1-2 days**

This template system allows you to quickly adapt the Agentic CRM for different industries by changing configuration files instead of rewriting code.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Industry Configuration](#industry-configuration)
3. [Theme Customization](#theme-customization)
4. [Entity Mapping](#entity-mapping)
5. [Deployment Steps](#deployment-steps)
6. [Industry Examples](#industry-examples)

---

## 🚀 Quick Start

### Step 1: Choose Your Industry
```bash
# Copy an industry config template
cp config/industries/real-estate.json config/industry.json
```

### Step 2: Customize Theme
```bash
# Edit theme configuration
nano config/theme.json
```

### Step 3: Update Branding
```bash
# Update branding assets
./scripts/update-branding.sh
```

### Step 4: Run Setup Script
```bash
# Generate all necessary files
npm run setup:industry
```

---

## 🏢 Industry Configuration

All industry-specific terminology, fields, and workflows are defined in `config/industry.json`.

### Configuration Structure

```json
{
  "industry": {
    "name": "real-estate",
    "displayName": "Real Estate",
    "description": "Property sales and leasing CRM"
  },
  "entities": {
    "primary": {
      "singular": "Property",
      "plural": "Properties",
      "icon": "building",
      "fields": []
    },
    "lead": {
      "singular": "Lead",
      "plural": "Leads",
      "stages": []
    },
    "transaction": {
      "singular": "Transaction",
      "plural": "Transactions",
      "stages": []
    }
  },
  "terminology": {
    "agent": "Agent",
    "client": "Client",
    "deal": "Transaction"
  }
}
```

**Files to modify:**
- `config/industry.json` - Main configuration
- `config/fields/*.json` - Field definitions for each entity

---

## 🎨 Theme Customization

All visual styling is controlled through `config/theme.json`.

### Theme Structure

```json
{
  "brand": {
    "name": "Your Company Name",
    "tagline": "Your Tagline",
    "logo": "/assets/logo.svg",
    "favicon": "/assets/favicon.ico"
  },
  "colors": {
    "primary": "#2563eb",
    "secondary": "#64748b",
    "accent": "#f59e0b",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "background": "#ffffff",
    "surface": "#f8fafc",
    "text": {
      "primary": "#0f172a",
      "secondary": "#475569",
      "disabled": "#94a3b8"
    }
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "headingFamily": "Inter, system-ui, sans-serif"
  }
}
```

**Files to modify:**
- `config/theme.json` - Color scheme, fonts, spacing
- `src/styles/theme.css` - Generated from theme.json
- `public/assets/` - Logo, favicon, images

---

## 🔄 Entity Mapping

Map your industry entities to the CRM's core structure.

### Core Entities

| CRM Entity | Purpose | Maps To |
|------------|---------|---------|
| Property | Primary asset/product | Property, Policy, Job Opening, Product |
| Lead | Potential customer | Lead, Candidate, Prospect |
| Transaction | Deal in progress | Sale, Placement, Contract, Application |
| Contact | Person | Client, Candidate, Customer |
| Agent | Sales person | Agent, Recruiter, Rep, Advisor |

### Example Mappings by Industry

**Insurance:**
- Property → Policy
- Lead → Insurance Lead
- Transaction → Policy Sale
- Agent → Broker

**Recruiting:**
- Property → Job Opening
- Lead → Candidate
- Transaction → Placement
- Agent → Recruiter

**B2B Sales:**
- Property → Product/Service
- Lead → Prospect
- Transaction → Deal
- Agent → Sales Rep

---

## 📦 Deployment Steps

### Pre-Production Checklist

- [ ] Configure industry settings in `config/industry.json`
- [ ] Customize theme in `config/theme.json`
- [ ] Replace branding assets (logo, favicon)
- [ ] Update environment variables
- [ ] Configure Slack workspace
- [ ] Test all workflows
- [ ] Set up domain and SSL
- [ ] Configure backup strategy

### Deployment Commands

```bash
# 1. Install dependencies
npm install

# 2. Run industry setup
npm run setup:industry

# 3. Build for production
npm run build

# 4. Test production build
npm run preview

# 5. Deploy (example: Vercel)
vercel deploy --prod

# 6. Run database migrations
npm run db:migrate

# 7. Seed initial data
npm run db:seed
```

### Environment Variables

Copy `.env.example` to `.env.production`:

```bash
# Slack Configuration
VITE_SLACK_CLIENT_ID=your_client_id
VITE_SLACK_CLIENT_SECRET=your_client_secret
VITE_SLACK_SIGNING_SECRET=your_signing_secret

# Application
VITE_APP_NAME=Your CRM Name
VITE_APP_URL=https://yourcrm.com

# Database (if using real backend)
DATABASE_URL=postgresql://...

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...
```

---

## 📚 Industry Examples

Pre-configured templates for popular industries.

### Available Templates

1. **Real Estate** - `config/industries/real-estate.json`
2. **Insurance** - `config/industries/insurance.json`
3. **Recruiting** - `config/industries/recruiting.json`
4. **B2B Sales** - `config/industries/b2b-sales.json`
5. **Mortgage** - `config/industries/mortgage.json`
6. **Solar Sales** - `config/industries/solar.json`
7. **Financial Advisory** - `config/industries/financial.json`

### Using a Template

```bash
# Copy template to active config
cp config/industries/insurance.json config/industry.json

# Run setup
npm run setup:industry

# Start development
npm run dev
```

---

## 🛠️ Customization Guide

### Adding New Fields

Edit `config/fields/primary-entity.json`:

```json
{
  "fields": [
    {
      "name": "customField",
      "label": "Custom Field",
      "type": "text|number|select|date|textarea",
      "required": true,
      "options": [] // for select type
    }
  ]
}
```

### Modifying Pipelines

Edit stages in `config/industry.json`:

```json
{
  "entities": {
    "lead": {
      "stages": [
        {"name": "new", "label": "New", "color": "#3b82f6"},
        {"name": "contacted", "label": "Contacted", "color": "#8b5cf6"},
        {"name": "qualified", "label": "Qualified", "color": "#10b981"}
      ]
    }
  }
}
```

### Custom Integrations

Add integration configs to `config/integrations.json`:

```json
{
  "integrations": {
    "slack": {
      "enabled": true,
      "events": ["lead.created", "transaction.closed"]
    },
    "zapier": {
      "enabled": true,
      "webhookUrl": "https://..."
    }
  }
}
```

---

## 🎓 Video Tutorials

- **5-Minute Setup:** Quick industry adaptation
- **Theme Customization:** Branding and colors
- **Advanced Configuration:** Custom fields and workflows
- **Deployment Guide:** Production deployment walkthrough

---

## 🆘 Support

- **Documentation:** `/docs`
- **Issues:** GitHub Issues
- **Community:** Discord/Slack channel
- **Email:** support@yourcompany.com

---

## 📄 License

MIT License - Use freely for commercial projects
