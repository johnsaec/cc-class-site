# PRD: Court Surfacing ROI Calculator

## Overview

An interactive calculator embedded on the Pro Court Surfaces website that helps GC estimators like Matt quantify the true cost of choosing a cheap court surfacing sub vs. a quality-first sub like Pro Court Surfaces. The goal is to make the financial case that "cheapest bid" costs more over time — turning a gut feeling about quality into a hard number Matt can show his PM or project owner.

## Target User

**Matt** — Estimator at Fazzon Construction (see persona.md)
- Comparing bids from multiple court surfacing subs
- Knows cheap subs cause problems but needs numbers to justify the higher bid
- Wants to look smart in front of his PM by showing total cost of ownership, not just install cost

## Core Concept

The calculator compares two scenarios side by side:

| | Cheapest Bid Sub | Pro Court Surfaces |
|---|---|---|
| Upfront cost | Lower | Higher |
| Callbacks & rework | Likely | Unlikely |
| Schedule delays | Common | Rare |
| Resurface timeline | Sooner | Later |
| **Total 10-year cost** | **Higher** | **Lower** |

The output is a clear dollar amount showing how much Matt saves over the project lifecycle by going with Pro Court.

## Inputs (User-Adjustable)

| Input | Default Value | Notes |
|---|---|---|
| Number of courts | 2 | Slider or number input (1-8) |
| Court type | Pickleball | Dropdown: Tennis, Pickleball, Multi-Sport |
| Warranty coverage | 2 years | Pro Court's 2-year workmanship warranty + manufacturer material warranty vs. cheap subs who typically offer 0-1 year |
| Cheap sub bid per court | $6,000 | Editable — represents the low-ball competitor |
| Pro Court bid per court | $10,000 | Editable — represents our actual pricing |
| Number of projects per year | 3 | How many projects Matt's GC does annually with courts |

## Calculated Outputs

### 1. Callback / Rework Cost
- **Assumption:** 40% chance a cheap sub requires a callback within 2 years
- **Cost per callback:** $5,000 (based on real resurfacing cost)
- **Formula:** `courts × $5,000 × 0.40`
- Pro Court callback rate: 5%

### 2. Schedule Delay Cost
- **Assumption:** Cheap subs cause an average 3-day delay on 30% of projects
- **Industry estimate:** $1,500/day for GC carrying costs on a multi-family project (supervision, equipment, cascading trade delays)
- **Formula:** `3 days × $1,500 × 0.30`
- Pro Court delay rate: 5%

### 3. Early Resurfacing Cost
- **Cheap surface lifespan:** ~5 years before needing full resurface
- **ATS Acrytech lifespan:** ~10 years (PPA-approved system, built for heavy use)
- **Resurface cost:** $5,000 per court
- **Formula over 10 years:** Cheap = 1 extra resurface per court. Pro Court = 0.
- `courts × $5,000 × 1` for cheap vs. `$0` for Pro Court

### 4. Change Order Risk
- **Assumption:** 25% chance a cheap sub's vague bid leads to a change order averaging $2,000
- **Formula:** `courts × $2,000 × 0.25`
- Pro Court change order rate: 5% (detailed line-item bids)

### 5. Total Cost Comparison (Per Project)

```
Cheap Sub Total = (bid × courts) + callback cost + delay cost + change order cost
Pro Court Total = (bid × courts) + (minimal callback) + (minimal delay) + (minimal CO)
```

### 6. Annual Savings
```
Annual Savings = (Cheap Sub Total - Pro Court Total) × projects per year
```

### 7. 10-Year Total Cost of Ownership
```
10-Year Cheap = Annual cheap cost × 10 + early resurfacing costs
10-Year Pro Court = Annual Pro Court cost × 10
Savings = 10-Year Cheap - 10-Year Pro Court
```

## UI / Display

### Layout
- Lives on the main site as a new section above the quote form
- Inputs on the left, results on the right (stacked on mobile)
- Clean, professional — matches existing site design

### Results Display
- Large hero number: **"You save $XX,XXX over 10 years with Pro Court Surfaces"**
- Breakdown table showing each cost category side by side
- Simple bar chart or visual comparing the two totals
- Color coding: red for cheap sub costs, blue/green for Pro Court

### CTA
- Below the results: "Ready to get a real bid? Request one now." linking to the quote form

## Tone
- Not salesy or gimmicky — Matt will see through that
- Framed as a planning tool: "See the true cost before you award the bid"
- Uses GC language: "callbacks", "change orders", "carrying costs", "closeout"
- Lets the numbers do the talking

## Technical Requirements
- Pure HTML/CSS/JavaScript — no frameworks, no build step
- All calculations run client-side (no backend)
- Responsive — works on desktop and mobile
- Inputs update results in real-time (no submit button needed)
- Accessible: labeled inputs, keyboard navigable

## Assumptions & Defaults Summary

| Metric | Cheap Sub | Pro Court |
|---|---|---|
| Callback rate | 40% | 5% |
| Callback cost | $5,000/court | $5,000/court |
| Delay frequency | 30% of projects | 5% of projects |
| Delay duration | 3 days | 0.5 days |
| Delay cost/day | $1,500 | $1,500 |
| Change order rate | 25% | 5% |
| Avg change order | $2,000 | $2,000 |
| Surface lifespan | 5 years | 10 years |
| Resurface cost | $5,000/court | $5,000/court |

## Success Metric
- Matt uses the calculator, sees a real number, and clicks "Request a Bid" — the calculator is a conversion tool, not a standalone feature.

## Out of Scope
- Saving/exporting results (future enhancement)
- Backend or database
- User accounts or tracking
