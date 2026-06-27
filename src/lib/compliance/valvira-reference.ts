// src/lib/compliance/valvira-reference.ts
// ============================================================================
// VALVIRA GUIDELINE REFERENCE — Section-by-section citation utility
// ============================================================================
//
// Maps each compliance rule to the specific section of the Valvira guideline
// where the rule originates. Used by the AI prompt builder and reference
// panel to produce authoritative citations.
//
// When the PDF is placed at docs/compliance/valvira-alcohol-marketing-guideline-2018.pdf,
// these section references enable exact lookups in the 53-page document.
//
// Source: Valvira Guideline on Alcohol Marketing, V/5394/2018 (20 Feb 2018)
// ============================================================================

export interface ValviraSection {
  /** Chapter number (1-6) */
  chapter: number;
  /** Chapter title */
  chapterTitle: string;
  /** Section heading within the chapter */
  section: string;
  /** Approximate page range in the PDF */
  pages: string;
  /** Key quote or principle from this section */
  principle: string;
}

// ---------------------------------------------------------------------------
// Complete chapter index (for reference panel and documentation)
// ---------------------------------------------------------------------------

export const VALVIRA_CHAPTERS: Array<{
  chapter: number;
  title: string;
  pages: string;
  summary: string;
}> = [
  {
    chapter: 1,
    title: "Strong alcoholic beverages (>22% ABV)",
    pages: "5–16",
    summary:
      "General prohibition on marketing strong alcoholic beverages to consumers. " +
      "Exceptions: advertising at licensed premises (indoor only), uniform price lists and " +
      "catalogues, advertising to verified industry professionals, foreign publications.",
  },
  {
    chapter: 2,
    title: "Mild alcoholic beverages (≤22% ABV)",
    pages: "16–28",
    summary:
      "Marketing of mild alcoholic beverages is permitted by default but subject to " +
      "11 prohibitions under §50(2): targeting minors, vehicle associations, alcohol content " +
      "as positive, heavy consumption as positive, performance/sexual success claims, " +
      "medical claims, immorality/misleading ads, time/place restrictions, " +
      "games/contests/raffles, and consumer-produced content.",
  },
  {
    chapter: 3,
    title: "Marketing in restaurants",
    pages: "28–33",
    summary:
      "Rules specific to licensed serving premises: advertising on windows/awnings/parasols, " +
      "free servings at closed events, customer loyalty and staff discounts, " +
      "product presentations and tastings at restaurants.",
  },
  {
    chapter: 4,
    title: "Price notices, pricing, and rebates",
    pages: "33–38",
    summary:
      "§51 rules: joint discount price bans, rebate prohibitions, special offer validity " +
      "requirements (minimum 2 months for advertisements outside retail outlets), " +
      "permitted price notices at licensed premises.",
  },
  {
    chapter: 5,
    title: "Particular issues",
    pages: "38–48",
    summary:
      "Displaying beverages, 1.2–2.8% ABV products, free gifts and combined offers, " +
      "sports advertising and sponsorship, tastings, business gifts, tax-free shops, " +
      "foreign publications, and online/social media marketing.",
  },
  {
    chapter: 6,
    title: "Supervision and sanctions",
    pages: "48–53",
    summary:
      "Enforcement by Regional State Administrative Agencies and Valvira: prohibition " +
      "orders, conditional fines, correction orders, Market Court appeals, criminal " +
      "penalties (fines or up to 6 months imprisonment under Criminal Code Ch.30 §1a).",
  },
];

// ---------------------------------------------------------------------------
// Rule → Valvira section mapping
// ---------------------------------------------------------------------------

/**
 * Maps each compliance rule ID to the exact Valvira guideline section
 * where the rule is explained in detail.
 */
export const RULE_TO_VALVIRA_SECTION: Record<string, ValviraSection> = {
  "happy-hour-alcohol": {
    chapter: 4,
    chapterTitle: "Price notices, pricing, and rebates",
    section: "Special offers, discount prices, and joint discount price bans",
    pages: "33–38",
    principle:
      "Temporary price reductions on alcoholic beverages are prohibited. " +
      "Special offer advertisements outside retail premises must be valid for at least 2 months. " +
      "Joint discount pricing (where buying more reduces unit price) is prohibited.",
  },
  "excessive-consumption": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Depicting abundant use positively or sobriety negatively (§50(2) para 4)",
    pages: "19–21",
    principle:
      "Advertising must not depict heavy consumption positively or moderate consumption " +
      "negatively. It must not encourage excessive or irresponsible alcohol consumption. " +
      "Unlimited alcohol packages are considered contrary to good practice.",
  },
  "targeting-minors": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Marketing to minors and depicting minors (§50(2) para 1)",
    pages: "16–19",
    principle:
      "Alcohol advertising must not target minors or persons to whom alcohol may not be sold. " +
      "It must not depict minors, cartoon characters, fairy-tale figures, youth idols, or " +
      "sports figures popular with adolescents. Advertising in content directed at minors " +
      "is prohibited.",
  },
  "games-contests-alcohol": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Games, raffles, prize draws, and competitions (§50(2) para 10)",
    pages: "26–27",
    principle:
      "Advertising must not include games, prize draws, or contests related to identifiable " +
      "alcoholic beverages or where the prize is an alcoholic beverage. Social media giveaways " +
      "of alcohol are prohibited. General trivia/bingo nights with non-alcohol prizes are permitted.",
  },
  "strong-alcohol": {
    chapter: 1,
    chapterTitle: "Strong alcoholic beverages (>22% ABV)",
    section: "General prohibition and exceptions for licensed premises",
    pages: "5–16",
    principle:
      "Marketing of strong alcoholic beverages (>22% ABV) to consumers is generally prohibited. " +
      "Exceptions: indoor advertising at licensed premises (not visible from outside), " +
      "uniform price lists/catalogues, and advertising to verified professionals. " +
      "Indirect advertising using established brand identifiers is treated as actual advertising.",
  },
  "misleading-health": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Medicinal or therapeutic claims (§50(2) para 6)",
    pages: "22–23",
    principle:
      "Advertising must not claim that alcoholic beverages have medicinal or therapeutic effects. " +
      "No health claims of any kind may be attached to alcoholic beverages. This includes " +
      "claims about nutritional benefits, detoxification, immune boosting, or calorie content.",
  },
  "consumer-content-sharing": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Consumer-produced content in advertising (§50(2) para 11)",
    pages: "27–28",
    principle:
      "Advertising must not use consumer-generated content (photos, videos) or encourage " +
      "consumers to share advertising for alcoholic beverages. Share/forward buttons on " +
      "alcohol ads are prohibited. 'Like' functions are permitted. Consumer comments " +
      "that constitute alcohol advertising must be moderated or deleted.",
  },
  "social-success-promise": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Promising performance or social/sexual success (§50(2) para 5)",
    pages: "21–22",
    principle:
      "Advertising must not promise that alcoholic beverages increase performance or " +
      "bring about social or sexual success. Language suggesting alcohol makes one more " +
      "attractive, confident, or socially successful is prohibited.",
  },
  "vehicle-association": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Associating alcohol with operating a vehicle (§50(2) para 2)",
    pages: "19",
    principle:
      "Advertising must not associate the consumption of alcoholic beverages with " +
      "the operation of a vehicle. Any suggestion linking alcohol and driving, boating, " +
      "or operating any vehicle is prohibited. Pure logistical transport information " +
      "is permitted if not connected to drinking.",
  },
  "alcohol-content-positive": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Presenting alcohol content as a positive feature (§50(2) para 3)",
    pages: "19",
    principle:
      "Advertising must not highlight the alcohol content of a beverage as a positive " +
      "feature. Emphasizing high ABV, strength, or potency as a desirable quality is " +
      "prohibited. Standard product information (ABV in menus) is permitted.",
  },
  "intoxication-depiction": {
    chapter: 2,
    chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
    section: "Depicting intoxicated persons (§50(2) para 1)",
    pages: "16–19",
    principle:
      "Advertising must not depict intoxicated persons or present intoxication as " +
      "desirable, humorous, or normal. Euphemisms for intoxication (tipsy, buzzed) " +
      "in advertising are also prohibited.",
  },
  "suggestive-price-reduction": {
    chapter: 4,
    chapterTitle: "Price notices, pricing, and rebates",
    section: "Price notices and advertising at licensed premises",
    pages: "33–36",
    principle:
      "Price advertising that makes low alcohol prices the primary appeal may be " +
      "considered contrary to good practice. Standard pricing information is permitted. " +
      "Aggressive price advertising for alcohol is discouraged.",
  },
  "quantity-promotion": {
    chapter: 4,
    chapterTitle: "Price notices, pricing, and rebates",
    section: "Joint discount price ban and quantity-based promotions (§51)",
    pages: "33–35",
    principle:
      "Quantity discounts on alcoholic beverages (where buying more reduces unit price) " +
      "are prohibited. Bucket/pitcher/tower promotions implying excessive consumption " +
      "are treated as violating both §50 and §51. Tasting flights focused on variety " +
      "(not quantity) are permitted.",
  },
};

// ---------------------------------------------------------------------------
// Helper: Get full citation for a rule
// ---------------------------------------------------------------------------

/**
 * Build a full citation string for a given rule ID.
 * Example output:
 *   "Valvira Guideline V/5394/2018, Chapter 4: Price notices, pricing, and rebates,
 *    Section: Special offers, discount prices, and joint discount price bans (pp. 33–38)"
 */
export function getCitation(ruleId: string): string | null {
  const section = RULE_TO_VALVIRA_SECTION[ruleId];
  if (!section) return null;

  return `Valvira Guideline V/5394/2018, Chapter ${section.chapter}: ${section.chapterTitle}, Section: ${section.section} (pp. ${section.pages})`;
}

/**
 * Build the citation header used in AI prompts to establish authority.
 */
export function getCitationHeader(): string {
  return `Valvira Guideline on Alcohol Marketing (V/5394/2018, 20 February 2018)
National Supervisory Authority for Welfare and Health (Valvira), Finland
53 pages, 6 chapters — implementing Alcohol Act (1102/2017) Chapter 7`;
}

/**
 * Get all Valvira section references for a list of triggered rule IDs.
 * Used in compliance fix prompts to show the AI exactly which sections
 * of the guideline the violations relate to.
 */
export function getCitationsForViolations(ruleIds: string[]): string {
  const uniqueIds = [...new Set(ruleIds)];
  return uniqueIds
    .map((id) => {
      const section = RULE_TO_VALVIRA_SECTION[id];
      if (!section) return null;
      return `[${id}] Chapter ${section.chapter}, "${section.section}" (pp. ${section.pages}): ${section.principle}`;
    })
    .filter(Boolean)
    .join("\n\n");
}
