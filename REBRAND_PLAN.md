# HI-NOVA APEX LLP Website Rebrand Implementation Plan

## Overview
Transform the "Induztry" Webflow template into a fully branded HI-NOVA APEX LLP website with authentic content from the company profile documents.

## Phase 1: Global Brand Replacements (High Priority)

### 1.1 Brand Name & Tagline
- **Find:** "Induztry"
- **Replace with:** "HI-NOVA APEX LLP"
- **Tagline:** "Engineering Innovation. Industrial Reliability."
- **Subtitle:** "Advanced Process Equipment & Engineered Industrial Solutions"

### 1.2 Logo Updates
- **Dark logo:** `67512b0c631970a86b689dc8/676b880319e51f09656cefd3_logo-dark.svg` → `67512b0c631970a86b689dc8/hinova-logo-dark.png`
- **White logo:** `67512b0c631970a86b689dc8/676b88036eff336bac421e4f_logo-white.svg` → `67512b0c631970a86b689dc8/hinova-logo-white.png`
- **Favicon:** `67512b0c631970a86b689dc8/676ba2d84376fcc55aae6365_favicon-01.png` → `67512b0c631970a86b689dc8/hinova-favicon.png`

### 1.3 Contact Information (Template → HI-NOVA)
- **Email:** `contact@pbmit.com` → `info@hinovainternational.com`
- **Phone:** Template numbers → TBD (client to provide)
- **Address:** Template address → TBD (client to provide)
- **Website:** → `www.hinovainternational.com`

### 1.4 Meta Tags & SEO
- **Title:** "Induztry - Webflow HTML website template" → "HI-NOVA APEX LLP - Engineering Innovation. Industrial Reliability."
- **Description:** Update to reflect HI-NOVA's positioning as a global engineering partner
- **Schema.org:** Update Organization data with HI-NOVA details

## Phase 2: Content Replacement by Page

### 2.1 Homepage (index.html)
- **Hero Section:** 
  - Tagline: "Engineering Innovation. Industrial Reliability."
  - Subtitle: "Advanced Process Equipment & Engineered Industrial Solutions"
- **About Section:** Company overview from brochure content
- **Services Preview:** Process Equipment, Thermal Systems, Drying Technology
- **Value Proposition:** "We deliver solutions — not just equipment"

### 2.2 About Us (about-us.html)
- **Company Overview:** From "Content for Website.docx.txt" PAGE 3
- **Vision:** "To emerge as a globally trusted engineering organization..."
- **Mission:** "To design and manufacture world-class process equipment..."
- **Core Values:** Engineering Excellence, Integrity & Trust, Innovation with Purpose, Quality Without Compromise, Safety & Sustainability
- **Leadership Message:** From PAGE 2 - Founder's Message

### 2.3 Services/Products (services.html)
Replace with HI-NOVA's product portfolio:
1. **Process Equipment Systems** - Reactors, Vessels, Tanks, Mixing Systems
2. **Thermal Engineering Solutions** - Heat Exchangers, Evaporators, Coolers
3. **Drying & Solid Processing** - Paddle Dryers, Rotary Dryers, Spray Dryers
4. **Modular Skid & Turnkey Systems** - Process Skids, CIP/SIP Units
5. **Heavy Fabrication & Custom Engineering** - Pressure Vessels, Exotic Alloys

### 2.4 Industries Served (new section or page)
- Food Processing, Dairy & Brewery
- Pharmaceutical & Biotechnology
- Oil & Gas, Petrochemicals & Refineries
- Chemical & Fertilizer
- Steel, Power & Energy
- Marine, Shipbuilding, Defence & Aerospace
- Desalination & Water Treatment
- And 10+ other sectors

### 2.5 Contact Page (contact.html)
- Update contact form heading
- Replace contact information cards
- Update map location (if applicable)
- Update schema.org ContactPage data

### 2.6 Footer (all pages)
- Company description
- Contact details
- Social media links (if provided)
- Copyright: "© 2024 HI-NOVA APEX LLP"

## Phase 3: Schema.org Structured Data

Update JSON-LD on all pages:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "HI-NOVA APEX LLP",
  "url": "https://www.hinovainternational.com",
  "logo": "https://[domain]/67512b0c631970a86b689dc8/hinova-logo-dark.png",
  "description": "HI-NOVA APEX LLP is a globally oriented engineering organization specializing in customized process equipment, advanced thermal systems, and integrated industrial solutions.",
  "email": "info@hinovainternational.com",
  "sameAs": [
    "https://www.linkedin.com/company/hinova-apex-llp"
  ]
}
```

## Phase 4: Image Replacement Strategy

### Current Status
- ✅ Logos created and placed in asset directory
- ⏳ Product/equipment images available in "reference sent by the client/Final Photos/"
- ⏳ Need to map template images to client images

### Image Categories
1. **Hero/Banner Images** - Use powerful equipment shots from Final Photos
2. **Service Icons** - Keep or replace with custom icons
3. **Team Photos** - Replace with actual team (if provided)
4. **Project Gallery** - Use client's equipment installations
5. **Client Logos** - Replace with actual client logos (if provided)

## Phase 5: Content Tone & Language

### Replace Weak Language
- ❌ "Manufacturer" → ✅ "Engineering Partner"
- ❌ "Supplier" → ✅ "Solution Provider"
- ❌ "Fabrication" → ✅ "Precision Manufacturing"

### Power Phrases to Use
- "Engineered for Performance"
- "Designed for Reliability"
- "Built for Industry"
- "Delivering Process Excellence"
- "Engineering Confidence. Delivering Global Excellence."

## Implementation Order

1. ✅ **Logos placed** - Already done
2. **Global text replacements** - Brand name, contact info
3. **Homepage** - Most visible, highest priority
4. **About Us** - Company credibility
5. **Services/Products** - Core offering
6. **Contact** - Lead generation
7. **Other pages** - Team, Projects, Blog
8. **Footer & Schema** - Consistency across all pages

## Files to Update (Priority Order)

### High Priority
1. `index.html` - Homepage
2. `about-us.html` - Company overview
3. `services.html` - Product portfolio
4. `contact.html` - Contact information

### Medium Priority
5. `our-team.html` - Leadership
6. `projects.html` - Case studies
7. `homepage-2.html`, `homepage-3.html` - Alternative layouts

### Low Priority (Template pages)
8. `pricing-plan.html` - May not be needed
9. `faq-page.html` - Update with HI-NOVA FAQs
10. Blog pages - Update or remove

## Notes & Decisions Needed

### From Client
- [ ] Actual phone numbers
- [ ] Physical address(es) - Registered office & Manufacturing facility
- [ ] Social media URLs (LinkedIn, Facebook, etc.)
- [ ] Specific client logos for "Clients" section
- [ ] Team member photos and bios
- [ ] Specific project case studies with photos

### Technical
- [ ] Update Cloudflare Worker API base URL in meta tag
- [ ] Test contact form integration
- [ ] Test newsletter form integration
- [ ] Verify all internal links work after rebrand

## Success Criteria

- ✅ No "Induztry" references remain
- ✅ All logos updated to HI-NOVA branding
- ✅ Content reflects HI-NOVA's positioning as engineering partner
- ✅ Contact information is accurate
- ✅ Schema.org data is correct
- ✅ All forms work correctly
- ✅ Site maintains responsive design
- ✅ No broken links or images
