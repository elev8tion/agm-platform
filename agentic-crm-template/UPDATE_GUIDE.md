# 🔧 Template Update Guide

This guide explains how the template project was created from the real estate CRM and how to customize it for your industry.

---

## 📁 Project Structure

```
agentic-crm-template/
├── config/                          # Industry & theme configuration
│   ├── industry.json               # Active industry config (generated)
│   ├── theme.json                  # Visual theme config
│   ├── industries/                 # Pre-built industry templates
│   │   ├── real-estate.json
│   │   ├── insurance.json
│   │   ├── recruiting.json
│   │   ├── b2b-sales.json
│   │   └── mortgage.json
│   └── fields/                     # Field definitions (optional)
├── src/
│   ├── app/                        # Next.js app directory (copied from agrm)
│   ├── components/                 # React components (copied from agrm)
│   ├── lib/
│   │   ├── config-loader.ts       # NEW: Loads industry config
│   │   ├── types.ts               # NEW: Generic types for all industries
│   │   ├── mock-data-generator.ts # NEW: Generates mock data per industry
│   │   └── services/
│   │       ├── mock-store.ts      # NEW: In-memory data store
│   │       └── ...                # Other services from agrm
│   └── prisma/                     # Database schema
├── public/                         # Static assets
│   └── assets/                     # Logo, favicon, images
├── scripts/
│   └── setup-industry.sh           # Interactive setup wizard
├── docs/                           # Documentation
│   ├── QUICK_START.md
│   ├── ENTITY_MAPPING_GUIDE.md
│   ├── THEME_GUIDE.md
│   └── DEPLOYMENT_GUIDE.md
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

---

## 🎯 What's Different from the Original Project?

### 1. **Configuration-Driven**

**Before (Hard-coded):**
```typescript
// components/property-card.tsx
export function PropertyCard({ property }: { property: Property }) {
  return <div>{property.address}</div>
}
```

**After (Dynamic):**
```typescript
// components/entity-card.tsx
import { getEntityConfig } from '@/lib/config-loader';

export function EntityCard({ entity }: { entity: PrimaryEntity }) {
  const config = getEntityConfig('primary');
  return <div>{entity[config.fields[0].name]}</div> // Dynamic field
}
```

### 2. **Generic Types**

**Before:**
```typescript
interface Property {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  // ... real estate specific
}
```

**After:**
```typescript
interface PrimaryEntity extends BaseEntity {
  [key: string]: any; // Accepts any fields from config
}
```

### 3. **Mock Data Generation**

**Before:**
```typescript
const mockProperties = [
  { id: '1', address: '123 Main St', price: 500000, ... },
  // Hard-coded data
];
```

**After:**
```typescript
import { generateMockPrimaryEntities } from '@/lib/mock-data-generator';

// Generates data based on industry config
const mockEntities = generateMockPrimaryEntities(20);
```

---

## 🔄 How to Adapt Components

### Step 1: Use Config Loader

In any component that references entities:

```typescript
import { getEntityConfig, getEntityLabel } from '@/lib/config-loader';

export function MyComponent() {
  const primaryConfig = getEntityConfig('primary');
  const label = getEntityLabel('primary', true); // "Properties" or "Policies"

  return <h1>{label}</h1>
}
```

### Step 2: Render Fields Dynamically

Instead of hard-coding fields:

```typescript
// ❌ Don't do this
<div>
  <p>Address: {property.address}</p>
  <p>Price: {property.price}</p>
</div>

// ✅ Do this
import { getEntityConfig } from '@/lib/config-loader';

const config = getEntityConfig('primary');

<div>
  {config.fields.map(field => (
    <p key={field.name}>
      {field.label}: {entity[field.name]}
    </p>
  ))}
</div>
```

### Step 3: Use Terminology Helper

```typescript
import { getTerminology } from '@/lib/config-loader';

// Gets "Agent", "Broker", "Recruiter", etc. based on industry
const agentTerm = getTerminology('agent');

<h2>{agentTerm} Dashboard</h2>
```

### Step 4: Check Feature Flags

```typescript
import { isFeatureEnabled } from '@/lib/config-loader';

{isFeatureEnabled('appointments') && (
  <AppointmentScheduler />
)}
```

---

## 🎨 Styling with Theme Config

### Using Theme Colors

```typescript
import { getColor } from '@/lib/config-loader';

const primaryColor = getColor('primary.DEFAULT');

<button style={{ backgroundColor: primaryColor }}>
  Click Me
</button>
```

### Using Brand Assets

```typescript
import { getBrandAsset } from '@/lib/config-loader';

const logoUrl = getBrandAsset('logo');

<img src={logoUrl} alt="Company Logo" />
```

---

## 📊 Working with Mock Data

### Loading Mock Data

```typescript
import { mockStore } from '@/lib/services/mock-store';

// Get all leads
const leads = mockStore.getLeads();

// Get lead by ID
const lead = mockStore.getLead('lead-1');

// Get leads by stage
const newLeads = mockStore.getLeadsByStage('new');
```

### Creating New Records

```typescript
const newLead = mockStore.createLead({
  name: 'John Doe',
  email: 'john@example.com',
  stage: 'new',
  agencyId: 'agency-1',
});
```

### Updating Records

```typescript
mockStore.updateLead('lead-1', {
  stage: 'contacted',
  lastContactDate: new Date().toISOString(),
});
```

---

## 🔧 Files You'll Need to Update

When adapting for a new industry, you may need to update:

### 1. **Industry Config** (Required)
- `config/industry.json` - Define entities, fields, stages

### 2. **Theme Config** (Required)
- `config/theme.json` - Brand colors, logo, fonts

### 3. **Components** (Optional - if config isn't enough)
- `src/components/*.tsx` - Add industry-specific UI
- `src/app/**/page.tsx` - Customize pages

### 4. **API Routes** (Optional - for custom logic)
- `src/app/api/**/route.ts` - Add custom endpoints

### 5. **Database Schema** (If using real DB)
- `prisma/schema.prisma` - Update for your entities

---

## 🚀 Quick Customization Workflow

### Level 1: Configuration Only (No Code)

```bash
# 1. Run setup wizard
./scripts/setup-industry.sh

# 2. Select industry template
# 3. Edit config/industry.json if needed
# 4. Edit config/theme.json for branding
# 5. Replace logo in public/assets/
# 6. Run the app
npm install
npm run dev
```

**Time:** 10-15 minutes
**Use case:** Industry template fits your needs exactly

---

### Level 2: Field Customization (Minimal Code)

```bash
# 1-5: Same as Level 1

# 6. Edit field definitions in config/industry.json
{
  "entities": {
    "primary": {
      "fields": [
        { "name": "myCustomField", "label": "My Field", "type": "text", "required": true }
      ]
    }
  }
}

# 7. Restart server
```

**Time:** 30-60 minutes
**Use case:** Need a few custom fields

---

### Level 3: Component Customization (Some Code)

```bash
# 1-7: Same as Level 2

# 8. Create custom component
# src/components/custom-entity-card.tsx
import { getEntityConfig } from '@/lib/config-loader';

export function CustomEntityCard({ entity }) {
  const config = getEntityConfig('primary');
  // Your custom rendering logic
  return <div>...</div>;
}

# 9. Use in pages
```

**Time:** 2-4 hours
**Use case:** Need custom UI/UX

---

### Level 4: Full Customization (Deep Code Changes)

```bash
# 1-9: Same as Level 3

# 10. Rename entities throughout codebase
# Search/replace "property" → "policy"

# 11. Update TypeScript interfaces if needed
# src/lib/types.ts

# 12. Add custom business logic
# src/lib/services/custom-logic.ts

# 13. Update database schema
# prisma/schema.prisma
```

**Time:** 1-3 days
**Use case:** Highly specialized industry

---

## 🎓 Best Practices

### 1. **Always Start with Config**
Try to solve your needs through configuration first before writing code.

### 2. **Use the Type System**
The generic types (`PrimaryEntity`, `Lead`, etc.) work with any industry. Use them.

### 3. **Keep Mock Data**
Even in production, keep mock mode as a demo/testing feature.

### 4. **Document Custom Changes**
If you modify core files, document why in comments.

### 5. **Version Control**
Commit after each customization level so you can revert if needed.

### 6. **Test with Mock Data First**
Always test new features with mock data before connecting real systems.

---

## 🔍 Key Files Reference

| File | Purpose | When to Edit |
|------|---------|-------------|
| `config/industry.json` | Define industry entities | Always |
| `config/theme.json` | Visual branding | Always |
| `src/lib/config-loader.ts` | Config utilities | Rarely (it just works) |
| `src/lib/types.ts` | Type definitions | If adding new entity types |
| `src/lib/mock-data-generator.ts` | Generate test data | If custom data needed |
| `src/lib/services/mock-store.ts` | Data store | If custom data operations |
| `src/components/*.tsx` | UI components | For custom UI |
| `src/app/**/page.tsx` | Pages | For custom pages |
| `prisma/schema.prisma` | Database schema | When going to production |

---

## 💡 Common Customizations

### Add a Custom Field

**Edit:** `config/industry.json`
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

### Change Pipeline Stages

**Edit:** `config/industry.json`
```json
{
  "entities": {
    "lead": {
      "stages": [
        { "name": "new", "label": "New", "color": "#3b82f6", "order": 1 },
        { "name": "my-stage", "label": "My Custom Stage", "color": "#10b981", "order": 2 }
      ]
    }
  }
}
```

### Update Branding

**Edit:** `config/theme.json`
```json
{
  "brand": {
    "name": "My Company",
    "tagline": "My Tagline"
  },
  "colors": {
    "primary": { "DEFAULT": "#YOUR_COLOR" }
  }
}
```

**Replace:** `public/assets/logo.svg`

---

## 🆘 Troubleshooting

### "Cannot find module 'config/industry.json'"
- Run `./scripts/setup-industry.sh` to generate the config
- Or manually copy a template from `config/industries/`

### Changes not appearing
- Restart the Next.js dev server
- Clear `.next` cache: `rm -rf .next`

### Type errors in components
- Run `npm run type-check` to see errors
- Ensure `config/industry.json` is valid JSON
- Check that all required fields are present

### Mock data not generating correctly
- Check field types in `config/industry.json`
- Ensure stages are defined for lead/transaction entities
- Verify `src/lib/mock-data-generator.ts` handles your field types

---

This template gives you 80% of a CRM out of the box. The remaining 20% is your industry-specific customization!
