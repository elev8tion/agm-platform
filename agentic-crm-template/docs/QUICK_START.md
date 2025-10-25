# ⚡ Quick Start Guide

Get your industry-customized CRM running in under 10 minutes.

---

## 🚀 5-Minute Setup

### Step 1: Choose Your Industry (1 min)

```bash
# Run the setup wizard
./scripts/setup-industry.sh
```

Select from available templates:
1. Real Estate
2. Insurance
3. Recruiting
4. B2B Sales
5. Mortgage
6. And more...

---

### Step 2: Customize Branding (2 min)

**Update theme colors:**
```bash
# Edit config/theme.json
nano config/theme.json
```

Change primary color:
```json
{
  "colors": {
    "primary": {
      "DEFAULT": "#YOUR_BRAND_COLOR"
    }
  },
  "brand": {
    "name": "Your Company Name",
    "tagline": "Your Tagline"
  }
}
```

**Add your logo:**
```bash
# Copy your logo to assets
cp /path/to/your/logo.svg public/assets/logo.svg
```

---

### Step 3: Install & Run (2 min)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 🎉

---

## 🎯 Common Use Cases

### Scenario 1: Real Estate Agency

**Goal:** CRM for property sales with 5 agents

```bash
# 1. Select real estate template
./scripts/setup-industry.sh
# Choose: Real Estate

# 2. Update theme with your brand color
# Edit config/theme.json - set primary color

# 3. Install and run
npm install && npm run dev

# 4. Customize:
# - Add your agency logo
# - Update property fields if needed
# - Connect Slack workspace
```

**Time:** ~10 minutes
**Result:** Fully functional property CRM

---

### Scenario 2: Insurance Brokerage

**Goal:** Policy management for 3 brokers

```bash
# 1. Select insurance template
./scripts/setup-industry.sh
# Choose: Insurance

# 2. Update branding
# config/theme.json - colors, name, logo

# 3. Install and run
npm install && npm run dev

# 4. Add your policies:
# - Navigate to Policies
# - Click "Add Policy"
# - Start tracking!
```

**Time:** ~8 minutes
**Result:** Policy tracking CRM

---

### Scenario 3: Recruiting Agency

**Goal:** Applicant tracking for 10 recruiters

```bash
# 1. Select recruiting template
./scripts/setup-industry.sh
# Choose: Recruiting & Staffing

# 2. Customize
# config/theme.json - update branding
# config/industry.json - adjust candidate stages if needed

# 3. Install and run
npm install && npm run dev

# 4. Post job openings and track candidates
```

**Time:** ~12 minutes
**Result:** Full ATS (Applicant Tracking System)

---

## 🛠️ Customization Levels

### Level 1: Quick Branding (5 minutes)
**What:** Just change colors and logo
**How:**
1. Edit `config/theme.json` - update colors
2. Replace `public/assets/logo.svg`
3. Run `npm run dev`

**Use when:** You're happy with the default functionality

---

### Level 2: Field Customization (15 minutes)
**What:** Add/remove fields specific to your business
**How:**
1. Edit `config/industry.json`
2. Add custom fields to entities:
```json
{
  "entities": {
    "primary": {
      "fields": [
        {
          "name": "customField",
          "label": "My Custom Field",
          "type": "text",
          "required": true
        }
      ]
    }
  }
}
```
3. Restart server

**Use when:** Default fields don't match your process

---

### Level 3: Pipeline Changes (20 minutes)
**What:** Customize your sales pipeline stages
**How:**
1. Edit `config/industry.json`
2. Update stages:
```json
{
  "entities": {
    "lead": {
      "stages": [
        {"name": "new", "label": "New", "color": "#3b82f6"},
        {"name": "custom-stage", "label": "My Stage", "color": "#10b981"}
      ]
    }
  }
}
```
3. Restart server

**Use when:** Your sales process has unique stages

---

### Level 4: Full Customization (1-2 days)
**What:** Complete entity renaming and custom features
**How:**
1. Follow [Entity Mapping Guide](./ENTITY_MAPPING_GUIDE.md)
2. Rename TypeScript types
3. Update components
4. Modify database schema

**Use when:** Building for a unique industry not in templates

---

## 📋 Cheat Sheet

### Quick Commands

```bash
# Setup industry
./scripts/setup-industry.sh

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Type checking
npm run type-check

# Lint code
npm run lint
```

---

### File Reference

| Need to Change | File |
|----------------|------|
| Industry config | `config/industry.json` |
| Theme/colors | `config/theme.json` |
| Logo | `public/assets/logo.svg` |
| Environment vars | `.env` |
| Package name | `package.json` |

---

### Port Configuration

Default ports:
- **Dev server:** http://localhost:5173
- **Preview:** http://localhost:4173

Change port:
```bash
# Dev
npm run dev -- --port 3000

# Preview
npm run preview -- --port 8080
```

---

## 🎓 Next Steps

After basic setup:

1. **Connect Slack** - [Slack Integration Guide](./SLACK_INTEGRATION.md)
2. **Add Real Data** - Replace mock data with your records
3. **Invite Team** - Add users and assign roles
4. **Customize Dashboard** - Adjust metrics and widgets
5. **Deploy** - [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## 💡 Pro Tips

### Tip 1: Use Mock Data Initially
Don't connect real systems right away. Test with mock data first.

### Tip 2: Start with One Entity
Get your main entity (Property, Policy, Job) working perfectly before moving to others.

### Tip 3: Test on Mobile Early
Don't wait until the end. Check mobile layout from day 1.

### Tip 4: Version Control Everything
Initialize git immediately:
```bash
git init
git add .
git commit -m "Initial setup"
```

### Tip 5: Document Your Changes
Keep notes of customizations for future team members.

---

## 🆘 Troubleshooting

### "Port already in use"
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### "Module not found"
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Theme not updating"
```bash
# Clear cache and rebuild
rm -rf dist .vite
npm run dev
```

### "Environment variables not working"
- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`
- Check `.env` is not in `.gitignore`

---

## 📚 Full Documentation

- [README](../README.md) - Overview and features
- [Entity Mapping Guide](./ENTITY_MAPPING_GUIDE.md) - Customize entities
- [Theme Guide](./THEME_GUIDE.md) - Branding and design
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment

---

## 🎉 You're Ready!

Your CRM is now set up and running. Start adding your data and invite your team!

Questions? Issues? Check our [GitHub Issues](https://github.com/yourrepo/issues) or reach out for support.

**Happy selling!** 🚀
