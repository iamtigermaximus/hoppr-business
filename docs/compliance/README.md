# Valvira Alcohol Marketing Guideline — Local Reference

## Download Instructions

The official English-language Valvira guideline must be downloaded manually and
placed in this directory. The file is then referenced by the compliance engine
and AI prompts as the authoritative source for Finnish alcohol marketing rules.

### Step 1: Download the PDF

Visit this URL in your browser:
https://www.valvira.fi/documents/14444/221693/Guideline+on+alcohol+marketing.pdf/59790eee-4f0b-fbb2-f534-85e8127f3240

Save the file as `valvira-alcohol-marketing-guideline-2018.pdf` in this directory.

### Step 2: Verify

After downloading, this directory should contain:
- `README.md` (this file)
- `valvira-alcohol-marketing-guideline-2018.pdf` (53 pages, V/5394/2018)

### Step 3: The file is now referenced by

- `src/lib/compliance/rules.ts` — each rule cites specific Valvira sections
- `src/lib/compliance/prompts.ts` — AI prompts reference the guideline by section
- `src/lib/compliance/valvira-reference.ts` — citation utility for section lookups

## Document Details

- **Title:** Guideline on alcohol marketing
- **Registration:** V/5394/2018
- **Date:** 20 February 2018
- **Authority:** Valvira (National Supervisory Authority for Welfare and Health)
- **Pages:** 53
- **Chapters:** 6

### Table of Contents

| Chapter | Title | Pages |
|---------|-------|-------|
| 1 | Strong alcoholic beverages (>22% ABV) | 5–16 |
| 2 | Mild alcoholic beverages (≤22% ABV) | 16–28 |
| 3 | Marketing in restaurants | 28–33 |
| 4 | Price notices, pricing, and rebates | 33–38 |
| 5 | Particular issues | 38–48 |
| 6 | Supervision and sanctions | 48–53 |

## Updating

When Valvira publishes an updated guideline:
1. Download the new PDF following the instructions above
2. Replace the existing file
3. Review and update `src/lib/compliance/rules.ts` if any rules have changed
4. Run the test suite to verify compliance scans still pass
