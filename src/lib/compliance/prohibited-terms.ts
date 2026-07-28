// src/lib/compliance/prohibited-terms.ts
// ============================================================================
// SINGLE SOURCE OF TRUTH — Finnish alcohol advertising prohibited terms
// ============================================================================
//
// Every prohibited word list, substitution map, and blocked regex pattern
// lives here. All consumers (compliance prompts, image compliance, persona
// review, compliance scanner) import from this module. When a term needs to
// be added, removed, or adjusted, this is the only file that changes.
//
// Previously these were scattered across:
//   - compliance/prompts.ts    (FI_PROHIBITED_MAP, FI_APPROVED_MAP)
//   - compliance/image-compliance.ts (BLOCKED_PATTERNS, BLOCKED_PATTERNS_FI)
//   - compliance/persona.ts    (duplicated Finnish terms in quality checklist)
//   - compliance/rules.ts      (ALL_PROHIBITED, ALL_APPROVED — aggregated from rules)
//
// ============================================================================

// ---- Types ----

/** A compliance rule for blocking/warning on prompt patterns */
export interface ComplianceRule {
  pattern: RegExp;
  reason: string;
  severity: "block" | "warn";
}

// ============================================================================
// 1. Finnish Prohibited → Approved Translation Maps
//    Used by buildComplianceSystemPrompt() in compliance/prompts.ts to
//    generate bilingual compliance instructions for the AI.
// ============================================================================

/** Maps English prohibited phrases to their Finnish equivalents.
 *  The AI uses this as a bilingual reference — when it sees an English
 *  prohibited phrase, it substitutes the Finnish equivalent (which may
 *  be the same word or a compliant alternative). */
export const FI_PROHIBITED_MAP: Record<string, string> = {
  "happy hour": "happy hour",
  "half price drinks": "puoleen hintaan juomat",
  "2 for 1": "2 yhden hinnalla",
  "buy one get one": "osta yksi saat toisen",
  "free drinks": "ilmaiset juomat",
  "complimentary drinks": "ilmaiset juomat",
  "drinks on the house": "talon tarjoamat juomat",
  "open bar": "avoin baari",
  "free flowing drinks": "vapaasti virtaavat juomat",
  "first drink free": "ensimmäinen juoma ilmaiseksi",
  "unlimited drinks": "rajattomasti juomia",
  "all you can drink": "juo niin paljon kuin haluat",
  "get wasted": "känniin / humalaan",
  "get drunk": "juovu / humallu",
  "drinking game": "juomapeli",
  "beer pong": "beer pong",
  "shot challenge": "shottihaaste",
  "student discount": "opiskelija-alennus",
  "student night": "opiskelijailta",
  "under 18": "alle 18",
  "win free drinks": "voita ilmaisia juomia",
  "alcohol prize draw": "alkoholiarpajaiset",
  "beer giveaway": "olutarjonta / olutarvonta",
  "vodka": "vodka",
  "whiskey": "viski",
  "whisky": "viski",
  "tequila": "tequila",
  "cognac": "konjakki",
  "brandy": "brandy",
  "schnapps": "snapsi",
  "healthy cocktail": "terveellinen cocktail",
  "low-calorie drink": "vähäkalorinen juoma",
  "detox drink": "detox-juoma",
  "share your drink photo": "jaa juomakuvasi",
  "tag us with your cocktail": "tägää meidät cocktailisi kanssa",
  "post your beer": "postaa oluesi",
  "get lucky": "saada seuraa",
  "get laid": "saada / pokata",
  "boost your confidence": "lisää itseluottamusta",
  "designated driver": "kuskille ilmainen",
  "park and drink": "pysäköi ja juo",
  "high ABV": "korkea alkoholipitoisuus",
  "extra strong": "extra vahva",
  "tipsy": "hiprakassa",
  "buzzed": "pienessä sievässä",
  "cheapest drinks": "halvimmat juomat",
  "lowest price": "alin hinta",
  "bucket of beer": "ämpäri olutta",
  "pitcher deal": "kannutarjous",
  "tower of drinks": "juomatorni",
};

/** Maps English approved/compliant phrases to their Finnish equivalents.
 *  The AI uses this as a reference for safe alternatives when the
 *  prohibited terms can't be used. */
export const FI_APPROVED_MAP: Record<string, string> = {
  "After-work special": "After-work tarjous",
  "Evening pricing": "Illan hinnoittelu",
  "Featured selection": "Päivän valikoima",
  "House specials": "Talon erikoisuudet",
  "Signature serves": "Signature-annokset",
  "Daily selection": "Päivittäinen valikoima",
  "Evening menu": "Illan menu",
  "Generous pours": "Reilut annokset",
  "Extended service": "Pidennetty tarjoilu",
  "Curated drinks menu": "Kuratoitu juomalista",
  "Bar classics": "Baariklassikot",
  "Seasonal pours": "Kauden annokset",
  "Young adult offer (20+)": "Nuorten aikuisten tarjous (20+)",
  "Valid ID required": "Henkilöllisyystodistus vaaditaan",
  "Trivia night": "Tietovisailta",
  "Premium spirits": "Premium-viinat",
  "House pours": "Talon kaadot",
  "Signature cocktails": "Signature-cocktailit",
  "Refreshing blend": "Raikas sekoitus",
  "Great atmosphere": "Loistava tunnelma",
  "Social evening": "Illanvietto",
  "Near public transport": "Lähellä julkista liikennettä",
  "Bold flavor": "Rohkea maku",
  "Craft beer flight": "Käsityöolutmaistelu",
  "Tasting board": "Maistelulautanen",
};

// ============================================================================
// 2. Image Prompt Blocked Patterns (English + Finnish)
//    Used by checkPromptCompliance() and validateGeneratedImage() in
//    image-compliance.ts. These regex patterns catch prohibited terms
//    in AI image prompts before they reach the image generator.
// ============================================================================

/** English-language blocked patterns for image prompt compliance.
 *  Matches terms related to excessive consumption, sexualized imagery,
 *  minor-appealing content, drinking games, etc. */
export const BLOCKED_PATTERNS: ComplianceRule[] = [
  {
    pattern: /\b(shots?|shooting|downing|chug|binge|hammered|wasted|drunk|intoxicated)\b/i,
    reason: "References to excessive or rapid alcohol consumption",
    severity: "block",
  },
  {
    pattern: /\b(sexy|hot\s*girls?|bikini|lingerie|stripper|pole\s*danc)/i,
    reason: "Sexualized imagery or linking alcohol to sexual success",
    severity: "block",
  },
  {
    pattern: /\b(teen|underage|college\s*(kid|student|freshman)|high\s*school|prom\s*night)/i,
    reason: "Content that could appeal primarily to minors",
    severity: "block",
  },
  {
    pattern: /\b(driving|drive|car|vehicle|motorcycle|scooter)\b.*\b(drink|alcohol|cocktail|beer|wine|shot)/i,
    reason: "Linking alcohol consumption to driving",
    severity: "block",
  },
  {
    pattern: /\b(drinking\s*game|beer\s*pong|flip\s*cup|keg\s*stand)/i,
    reason: "Depictions of drinking games or competitive drinking",
    severity: "block",
  },
  {
    pattern: /\b(free\s*alcohol|unlimited\s*drinks?|all\s*you\s*can\s*drink|bottomless)/i,
    reason: "Promoting unlimited or free alcohol (restricted under Finnish law)",
    severity: "block",
  },
  {
    pattern: /\b(hangover|cure|remedy|morning\s*after)/i,
    reason: "References to hangovers or drinking consequences",
    severity: "warn",
  },
];

/** Finnish-language blocked patterns for image prompt compliance.
 *  Catches Finnish terms that the English patterns would miss. */
export const BLOCKED_PATTERNS_FI: ComplianceRule[] = [
  {
    pattern: /(juomapeli|bisseturnaus|shottikisa|juomakilpailu)/i,
    reason: "Viittauksia juomapeleihin tai juomakilpailuihin (juomapeli, shottikisa)",
    severity: "block",
  },
  {
    pattern: /(ilmainen|ilmaiset|ilmaisia)\s*(juoma|olut|viini|siideri|alkoholi|drinksu)/i,
    reason: "Ilmaisten alkoholijuomien mainostaminen (ilmainen juoma)",
    severity: "block",
  },
  {
    pattern: /(känni|humala|päihty|hiprakka|juovuksissa)/i,
    reason: "Päihtymyksen positiivinen kuvaaminen (känni, humala, hiprakka)",
    severity: "block",
  },
  {
    pattern: /(alaikä|alaikäis|alle\s*18)/i,
    reason: "Alaikäisiin kohdistuva sisältö (alaikäinen, alle 18)",
    severity: "block",
  },
  {
    pattern: /(opiskelija\s*bileet|opiskelija\s*tarjous|koulu\s*bileet)/i,
    reason: "Opiskelijoihin/alikäisiin vetoava kieli (opiskelijabileet, koulubileet)",
    severity: "block",
  },
  {
    pattern: /(auto|ajaa|ajaminen|parkkeeraa).{0,15}(juoma|alkoholi|olut|baari)/i,
    reason: "Alkoholin yhdistäminen ajoneuvon käyttöön (auto, ajaa, parkkeeraa)",
    severity: "block",
  },
  {
    pattern: /(saada\s*seuraa|iskeä|pokata|viehättävämpi)/i,
    reason: "Alkoholin yhdistäminen sosiaaliseen/seksuaaliseen menestykseen (saada seuraa, iskeä)",
    severity: "block",
  },
  {
    pattern: /(terveellinen|vähäkalorinen|detox|terveyshyöty)\s*(juoma|cocktail|olut|drinksu)/i,
    reason: "Terveysväitteet alkoholijuomista (terveellinen, detox, vähäkalorinen)",
    severity: "warn",
  },
  {
    pattern: /(jaa\s*kuvasi|tägää\s*meidät|postaa\s*juomasi)/i,
    reason: "Kuluttajien tuottaman alkoholisisällön jakamiskehotus (jaa, tägää, postaa)",
    severity: "warn",
  },
  {
    pattern: /(rajaton|pohjaton|kaikki\s*mitä\s*juot)\s*(juoma|olut|alkoholi)/i,
    reason: "Rajattoman alkoholinkulutuksen mainostaminen (rajaton juoma, pohjaton)",
    severity: "block",
  },
];
