# 🏢 Industry Comparison Matrix

Quick comparison of how the CRM adapts across different industries.

---

## Entity Mapping Comparison

| Industry | Primary Entity | Lead Entity | Transaction Entity | Agent Term | Commission Model |
|----------|----------------|-------------|-------------------|------------|------------------|
| **Real Estate** | Property | Lead | Transaction | Agent | % of sale price |
| **Insurance** | Policy | Lead | Sale | Broker | % of premium |
| **Recruiting** | Job Opening | Candidate | Placement | Recruiter | % of salary or flat fee |
| **B2B Sales** | Product | Prospect | Deal | Sales Rep | % of deal value |
| **Mortgage** | Loan Product | Borrower | Application | Loan Officer | Points + flat fee |
| **Solar** | System/Project | Lead | Installation | Consultant | % of contract |
| **Legal** | Case/Matter | Client | Matter | Attorney | Hourly or contingency |
| **Financial** | Investment | Client | Account | Advisor | AUM % or commission |

---

## Pipeline Stages Comparison

### Real Estate Lead Pipeline
```
New → Contacted → Qualified → Showing Scheduled → Offer Made → Converted/Lost
```

### Insurance Lead Pipeline
```
New → Contacted → Quote Sent → Follow Up → Negotiation → Converted/Lost
```

### Recruiting Candidate Pipeline
```
New → Screening → Phone Screen → Interview → Client Submission → Offer → Placed/Rejected
```

### B2B Sales Pipeline
```
New → Contacted → Discovery → Qualified → Demo → Proposal → Negotiation → Closed Won/Lost
```

### Mortgage Borrower Pipeline
```
New → Pre-Qualification → Application → Documentation → Processing → Approved/Lost
```

---

## Transaction Stages Comparison

### Real Estate Transaction
```
Pending → Under Contract → Inspection → Appraisal → Financing → Closing → Closed/Cancelled
```

### Insurance Sale
```
Application → Underwriting → Approval → Payment Pending → Issued → Declined/Cancelled
```

### Recruiting Placement
```
Offer Pending → Offer Accepted → Background Check → Onboarding → Started → Completed/Fell Through
```

### B2B Deal
```
Proposal → Negotiation → Legal Review → Contract Sent → Signed → Onboarding → Live/Lost
```

### Mortgage Application
```
Application → Processing → Underwriting → Conditional Approval → Clear to Close → Closing → Funded/Denied
```

---

## Key Fields by Industry

### Real Estate - Property Fields
- Address, City, State, ZIP
- Price
- Property Type (Single Family, Condo, etc.)
- Bedrooms, Bathrooms
- Square Feet
- MLS Number
- Status

### Insurance - Policy Fields
- Policy Number
- Policy Type (Auto, Home, Life, etc.)
- Carrier
- Premium (Annual)
- Coverage Amount
- Effective Date, Expiration Date
- Deductible
- Payment Frequency

### Recruiting - Job Opening Fields
- Job Title
- Company
- Location
- Employment Type (Full-Time, Contract, etc.)
- Salary Range
- Remote/Hybrid/On-Site
- Experience Level
- Number of Openings
- Job Description
- Requirements

### B2B Sales - Product Fields
- Product Name
- SKU
- Category
- Base Price
- Pricing Model (One-Time, Monthly, etc.)
- Description
- Features
- Minimum Order Quantity
- Contract Length

### Mortgage - Loan Product Fields
- Product Name
- Loan Type (Conventional, FHA, VA, etc.)
- Lender
- Interest Rate
- APR
- Term (15, 20, 30 years)
- Maximum Loan Amount
- Minimum Down Payment %
- Minimum Credit Score

---

## Timeline Comparison

### Average Sales Cycle Length

| Industry | Typical Cycle | Why It Matters |
|----------|---------------|----------------|
| Real Estate | 30-90 days | Property search → closing |
| Insurance | 7-30 days | Quote → policy issued |
| Recruiting | 30-60 days | Post job → candidate starts |
| B2B Sales | 30-180 days | Depends on deal size |
| Mortgage | 30-45 days | Application → funding |
| Solar | 60-120 days | Consultation → installation |
| Legal | Varies widely | Case-dependent |
| Financial | 7-60 days | Onboarding dependent |

---

## Document Types by Industry

### Real Estate
- Purchase Agreement
- Listing Agreement
- Disclosure Forms
- Inspection Report
- Appraisal
- Title Report
- Closing Statement (HUD-1)

### Insurance
- Application
- Policy Document
- Quote
- Declaration Page
- Claims Form
- Medical Records (for health/life)

### Recruiting
- Resume/CV
- Offer Letter
- Employment Contract
- Background Check
- W-4/W-9
- NDA

### B2B Sales
- Proposal
- Contract
- MSA (Master Service Agreement)
- SOW (Statement of Work)
- NDA
- Order Form
- Invoice

### Mortgage
- Loan Application (1003)
- Pre-Approval Letter
- Loan Estimate
- Closing Disclosure
- Appraisal
- Tax Returns
- Bank Statements
- Pay Stubs
- W-2s

---

## Appointment Types by Industry

### Real Estate
- Property Showing
- Client Consultation
- Open House
- Closing

### Insurance
- Initial Consultation
- Policy Review
- Renewal Meeting
- Claims Assistance

### Recruiting
- Phone Screen
- Interview
- Client Meeting
- Offer Discussion

### B2B Sales
- Discovery Call
- Demo
- Follow-Up Meeting
- Contract Review
- Kickoff Meeting

### Mortgage
- Initial Consultation
- Document Review
- Closing
- Follow-Up

---

## Integration Needs by Industry

### Real Estate
- ✅ MLS data feed
- ✅ Zillow/Realtor.com leads
- ✅ DocuSign
- ✅ Title company systems
- ✅ Google Maps

### Insurance
- ✅ Insurance carrier APIs
- ✅ Multi-carrier quoting
- ✅ Claims management systems
- ✅ Policy administration systems

### Recruiting
- ✅ Job boards (Indeed, LinkedIn)
- ✅ Background check services
- ✅ Applicant Tracking System (ATS)
- ✅ Calendar integration

### B2B Sales
- ✅ Salesforce/HubSpot sync
- ✅ Marketing automation
- ✅ DocuSign/PandaDoc
- ✅ Payment processors

### Mortgage
- ✅ Loan Origination System (LOS)
- ✅ Credit bureaus
- ✅ Document management
- ✅ E-signature platforms
- ✅ Automated underwriting

---

## Metrics & KPIs by Industry

### Real Estate
- Total Sales Volume
- Commission Earned
- Properties Sold
- Average Days on Market
- Conversion Rate (Lead → Sale)
- Average Sale Price

### Insurance
- Total Premium Written
- Commission Earned
- Policies Sold
- Renewal Rate
- Loss Ratio
- Average Policy Value

### Recruiting
- Total Placements
- Revenue
- Average Time to Fill
- Candidate Conversion Rate
- Client Satisfaction Score
- Placement Retention Rate

### B2B Sales
- Total Revenue
- Annual Recurring Revenue (ARR)
- Deal Velocity
- Win Rate
- Average Deal Size
- Sales Cycle Length

### Mortgage
- Total Loans Funded
- Total Volume
- Average Loan Size
- Time to Close
- Pull-Through Rate (Apps → Funded)
- Units per Month

---

## Customization Difficulty

| Industry | Setup Time | Complexity | Notes |
|----------|------------|------------|-------|
| Real Estate | 1 day | ⭐ Easy | Template ready, minimal changes |
| Insurance | 1-2 days | ⭐⭐ Easy | Similar to real estate |
| Recruiting | 2 days | ⭐⭐ Easy | Job-candidate matching |
| B2B Sales | 2-3 days | ⭐⭐⭐ Medium | Product catalog needed |
| Mortgage | 3-4 days | ⭐⭐⭐⭐ Medium-Hard | Complex compliance, many docs |
| Solar | 3-5 days | ⭐⭐⭐ Medium | Project management features |
| Legal | 5-7 days | ⭐⭐⭐⭐⭐ Hard | Heavy compliance, time tracking |
| Financial | 5-7 days | ⭐⭐⭐⭐⭐ Hard | Compliance, reporting requirements |

---

## Regulatory Considerations

### High Compliance Industries
**Mortgage, Insurance, Financial, Legal**
- Data encryption required
- Audit trails necessary
- Document retention policies
- Privacy law compliance (GDPR, CCPA)
- Industry-specific regulations

### Medium Compliance
**Recruiting, B2B Sales**
- GDPR/CCPA for personal data
- Standard data protection
- Document storage

### Lower Compliance
**Real Estate, Solar**
- Standard business practices
- Disclosure requirements
- Contract management

---

## Recommended Deployment by Industry

| Industry | Recommended Platform | Why |
|----------|---------------------|-----|
| Real Estate | Vercel/Netlify | Simple, fast, cost-effective |
| Insurance | AWS/Azure | Compliance, security, scalability |
| Recruiting | DigitalOcean | Good balance of cost and control |
| B2B Sales | Vercel/Heroku | Easy deployment, integrations |
| Mortgage | AWS with RDS | Compliance, security, backups |
| Solar | DigitalOcean | Project tracking, good pricing |
| Legal | AWS with encryption | Security, compliance, backups |
| Financial | AWS/Azure | Enterprise-grade security |

---

## Pricing Model Suggestions

### Real Estate
- Per-agent pricing ($50-100/agent/month)
- Commission-based (% of each closed deal)

### Insurance
- Per-broker pricing ($40-80/broker/month)
- Transaction fees per policy sold

### Recruiting
- Per-recruiter pricing ($60-120/recruiter/month)
- Per-placement fee ($100-500 per placement)

### B2B Sales
- Per-user pricing ($30-80/user/month)
- Tiered pricing by company size

### Mortgage
- Per-loan-officer pricing ($80-150/LO/month)
- Enterprise pricing for large brokerages

---

## Quick Decision Guide

**Choose Real Estate if:**
- Selling physical properties
- Geographic-based business
- Showing appointments critical

**Choose Insurance if:**
- Selling policies
- Renewal business important
- Multi-carrier quoting needed

**Choose Recruiting if:**
- Matching people to jobs
- Resume management needed
- Interview scheduling critical

**Choose B2B Sales if:**
- Selling to businesses
- Long sales cycles
- Proposal/contract heavy

**Choose Mortgage if:**
- Loan origination
- Heavy documentation
- Compliance critical

**Custom Build if:**
- None of the above fit
- Unique workflow
- Specialized requirements

---

This matrix helps you quickly understand which industry template is closest to your needs and what customizations might be required.
