# 🗺️ Entity Mapping Guide

Complete guide to mapping your industry's business model to the CRM architecture.

---

## Overview

The CRM has 5 core entities that can be mapped to any industry:

1. **Primary Entity** - Your main asset/product (Property, Policy, Job, Product)
2. **Lead Entity** - Potential customers (Leads, Candidates, Prospects)
3. **Transaction Entity** - Deals in progress (Sales, Placements, Contracts)
4. **Contact Entity** - People in your network
5. **Agent Entity** - Your sales team members

---

## 🏗️ Core Entity Mapping

### 1. Primary Entity (The Thing You're Selling)

**What it represents:**
The core asset, product, or service your business revolves around.

**Database Schema:**
Located in: `src/data/mockData/properties.ts` or `database/schema/primary_entities.sql`

**Configuration:**
```json
{
  "entities": {
    "primary": {
      "singular": "YourEntity",
      "plural": "YourEntities",
      "icon": "icon-name",
      "fields": [...]
    }
  }
}
```

**Industry Examples:**

| Industry | Maps To | Key Fields |
|----------|---------|------------|
| Real Estate | Property | address, price, bedrooms, sqft |
| Insurance | Policy | policyNumber, premium, coverage |
| Recruiting | Job Opening | title, salary, location, requirements |
| B2B Sales | Product/Service | name, price, features, category |
| Mortgage | Loan Product | loanType, rate, term, amount |
| Solar | System/Project | systemSize, cost, savings, address |
| Legal | Case/Matter | caseNumber, type, court, filing date |
| Financial | Investment Product | productType, minimumInvestment, returns |

**Code Changes Required:**

1. **Data Model** - `src/data/mockData/properties.ts`:
```typescript
// Change from:
export const properties: Property[] = [...]

// To:
export const policies: Policy[] = [...]
// or
export const jobOpenings: JobOpening[] = [...]
```

2. **Type Definitions** - `src/types/index.ts`:
```typescript
export interface Policy {
  id: string;
  policyNumber: string;
  policyType: string;
  premium: number;
  // ... industry-specific fields
}
```

3. **Components** - Rename/update:
   - `src/components/properties/` → `src/components/policies/`
   - Update imports and references throughout

---

### 2. Lead Entity (Potential Customers)

**What it represents:**
People or companies in your sales pipeline who haven't converted yet.

**Configuration:**
```json
{
  "entities": {
    "lead": {
      "singular": "Lead",
      "plural": "Leads",
      "stages": [
        {"name": "new", "label": "New", "color": "#3b82f6"},
        {"name": "contacted", "label": "Contacted", "color": "#8b5cf6"}
      ],
      "fields": [...]
    }
  }
}
```

**Pipeline Stages by Industry:**

**Real Estate:**
New → Contacted → Qualified → Showing Scheduled → Offer Made → Converted/Lost

**Insurance:**
New → Contacted → Quote Sent → Follow Up → Negotiation → Converted/Lost

**Recruiting:**
New Applicant → Screening → Phone Screen → Interview → Client Submission → Offer → Placed/Rejected

**B2B Sales:**
New Lead → Discovery → Qualification → Demo → Proposal → Negotiation → Closed Won/Lost

**Code Changes Required:**

1. **Pipeline Configuration** - `src/data/mockData/leads.ts`:
```typescript
export const leadStages = [
  { id: '1', name: 'new', label: 'New', color: '#3b82f6' },
  // Add your industry's stages
];
```

2. **Lead Status Logic** - Update status transitions in components

---

### 3. Transaction Entity (Active Deals)

**What it represents:**
Deals that are actively being worked on, past the initial lead stage.

**Configuration:**
```json
{
  "entities": {
    "transaction": {
      "singular": "Transaction",
      "plural": "Transactions",
      "stages": [...],
      "fields": [...]
    }
  }
}
```

**Transaction Stages by Industry:**

**Real Estate:**
Pending → Under Contract → Inspection → Appraisal → Financing → Closing → Closed/Cancelled

**Insurance:**
Application → Underwriting → Approval → Payment Pending → Issued → Declined/Cancelled

**Recruiting:**
Offer Pending → Offer Accepted → Background Check → Onboarding → Started → Completed/Fell Through

**B2B Sales:**
Contract Draft → Legal Review → Signature → Implementation → Live → Churned

**Code Changes Required:**

1. **Transaction Model** - `src/data/mockData/transactions.ts`:
```typescript
export interface Sale {
  id: string;
  leadId: string;
  policyId: string;
  applicationDate: string;
  quotedPremium: number;
  stage: string;
  // industry-specific fields
}
```

---

### 4. Contact Entity (All People)

**What it represents:**
Everyone in your network - clients, vendors, partners, etc.

**Generic enough to work for most industries without major changes.**

**Optional customizations:**
- Add industry-specific contact types
- Add custom fields (license numbers, certifications, etc.)

**Code Changes Required:**

1. **Contact Types** - `src/types/index.ts`:
```typescript
export type ContactRole =
  | 'Client'
  | 'Lender'        // Real Estate
  | 'Carrier'       // Insurance
  | 'Hiring Manager' // Recruiting
  | 'Decision Maker' // B2B
  | 'Custom';
```

---

### 5. Agent Entity (Your Team)

**What it represents:**
Your sales team, account managers, or service providers.

**Terminology Mapping:**

| Industry | Term |
|----------|------|
| Real Estate | Agent / Realtor |
| Insurance | Broker / Agent |
| Recruiting | Recruiter |
| B2B Sales | Sales Rep / Account Executive |
| Mortgage | Loan Officer |
| Solar | Sales Consultant |
| Legal | Attorney / Paralegal |
| Financial | Financial Advisor |

**Code Changes Required:**

1. **Update terminology** - Global search/replace:
   - "Agent" → "Broker" or "Recruiter"
   - Update UI labels and text

---

## 🔄 Field Type Reference

When defining custom fields in `config/industry.json`:

```json
{
  "fields": [
    {"name": "fieldName", "label": "Display Label", "type": "text", "required": true},
    {"name": "amount", "type": "currency", "required": false},
    {"name": "quantity", "type": "number", "required": false},
    {"name": "startDate", "type": "date", "required": false},
    {"name": "description", "type": "textarea", "required": false},
    {"name": "category", "type": "select", "options": ["A", "B", "C"], "required": true},
    {"name": "tags", "type": "multiselect", "options": ["X", "Y"], "required": false},
    {"name": "isActive", "type": "boolean", "required": false},
    {"name": "website", "type": "url", "required": false},
    {"name": "email", "type": "email", "required": false},
    {"name": "phone", "type": "phone", "required": false},
    {"name": "contactId", "type": "reference", "reference": "contact", "required": false}
  ]
}
```

**Available Field Types:**
- `text` - Single line text
- `textarea` - Multi-line text
- `number` - Numeric input
- `currency` - Money amount (formatted with $)
- `date` - Date picker
- `datetime` - Date and time picker
- `select` - Dropdown (single choice)
- `multiselect` - Multiple choice
- `boolean` - True/false checkbox
- `email` - Email validation
- `phone` - Phone number
- `url` - URL validation
- `reference` - Link to another entity

---

## 📋 Mapping Checklist

Use this checklist when adapting to a new industry:

### Phase 1: Planning
- [ ] Identify your Primary Entity (what are you selling?)
- [ ] Define Lead stages (how do prospects progress?)
- [ ] Define Transaction stages (deal lifecycle)
- [ ] List custom fields needed for each entity
- [ ] Map terminology (Agent → Broker, etc.)

### Phase 2: Configuration
- [ ] Copy industry template or create custom config
- [ ] Update `config/industry.json` with entities
- [ ] Define all custom fields
- [ ] Set up pipeline stages
- [ ] Configure terminology

### Phase 3: Code Updates
- [ ] Rename primary entity files and types
- [ ] Update TypeScript interfaces
- [ ] Modify mock data or database schema
- [ ] Update component imports
- [ ] Search/replace terminology

### Phase 4: Testing
- [ ] Test entity CRUD operations
- [ ] Verify pipeline stage transitions
- [ ] Check field validation
- [ ] Test relationships between entities
- [ ] Verify analytics calculations

### Phase 5: UI/UX
- [ ] Update navigation labels
- [ ] Customize dashboard widgets
- [ ] Update form layouts
- [ ] Adjust list/table columns
- [ ] Test responsive design

---

## 🎯 Quick Reference: Where to Change What

| What to Change | File Location |
|----------------|---------------|
| Entity names | `config/industry.json` |
| Field definitions | `config/industry.json` → entities → fields |
| Pipeline stages | `config/industry.json` → entities → stages |
| TypeScript types | `src/types/index.ts` |
| Mock data | `src/data/mockData/*.ts` |
| Database schema | `database/schema/*.sql` |
| UI components | `src/components/{entity}/*.tsx` |
| Navigation | `src/components/Navigation.tsx` |
| Dashboard | `src/pages/Dashboard.tsx` |
| Terminology | Global search/replace + `config/industry.json` |

---

## 💡 Pro Tips

1. **Start with a similar industry template** - Adapt existing config rather than starting from scratch
2. **Keep entity relationships simple** - Lead → Transaction → Closed Deal
3. **Use standard field types when possible** - Easier to maintain
4. **Test with real data early** - Validates your field choices
5. **Document custom logic** - Especially for commission calculations
6. **Version control your configs** - Easy to revert changes
7. **Use industry-standard terminology** - Makes onboarding easier

---

## 🆘 Common Mapping Challenges

### Challenge: Complex Multi-Step Process
**Solution:** Break into Lead stages (pre-contract) and Transaction stages (post-contract)

### Challenge: Multiple Product Types
**Solution:** Use a `productType` or `category` field on Primary Entity

### Challenge: Team Hierarchy (Managers, Agents)
**Solution:** Add `role` and `managerId` fields to Agent entity

### Challenge: Revenue Splits
**Solution:** Add commission tracking fields to Transaction entity

### Challenge: Document Management
**Solution:** Use built-in document system, just customize document types

---

## 📚 Additional Resources

- [Industry Examples](./INDUSTRY_EXAMPLES.md)
- [Theme Customization](./THEME_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [API Documentation](./API_REFERENCE.md)

---

Need help with your specific industry? Check out the pre-built templates in `config/industries/` or reach out for support!
