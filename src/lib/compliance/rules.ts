// src/lib/compliance/rules.ts
// ============================================================================
// CANONICAL COMPLIANCE RULES — SINGLE SOURCE OF TRUTH
// ============================================================================
//
// Every compliance rule, AI prompt, and regex scan flows from this file.
// When Finnish alcohol law changes, update this file and everything downstream
// (engine scans, AI prompts, reference panel, API docs) updates automatically.
//
// Sources:
//   - Alcohol Act (1102/2017) §50 — Advertising of alcoholic beverages
//   - Alcohol Act (1102/2017) §51 — Price advertising of alcoholic beverages
//   - Valvira Guideline on Alcohol Marketing (Dnr V/32196/2024, 16 July 2024)
//   - Valvira Guideline on Alcohol Marketing (Reg.no V/5394/2018, 20 Feb 2018)
//
// Last updated: 2026-06-27
// ============================================================================

export type ComplianceSeverity = "high" | "medium" | "low";

export interface ComplianceViolation {
  rule: string;
  keyword: string;
  severity: ComplianceSeverity;
  message: string;
  suggestion: string;
}

export interface ComplianceResult {
  status: "COMPLIANT" | "FLAGGED_AUTO";
  violations: ComplianceViolation[];
  checkedAt: Date;
}

// ---------------------------------------------------------------------------
// Rule Definition Type
// ---------------------------------------------------------------------------

export interface ComplianceRuleDefinition {
  id: string;
  name: string;
  /** Alcohol Act paragraph number (e.g. "§50(2) para 1") */
  lawReference: string;
  /** The exact law text in English */
  lawText: string;
  /** Finnish original if the English translation differs materially */
  lawTextFi?: string;
  /** Valvira 2024 practical guidance */
  valviraGuidance: string;
  /** Valvira guideline section reference (for PDF citation) */
  valviraSection: {
    chapter: number;
    chapterTitle: string;
    section: string;
    pages: string;
  };
  severity: ComplianceSeverity;
  /** Regex patterns — used by the scan engine */
  patterns: RegExp[];
  /** Finnish-language regex patterns — checked in addition to patterns */
  patternsFi?: RegExp[];
  /** Prohibited phrases — shown in AI prompts and reference panel */
  prohibited: string[];
  /** Approved/compliant alternatives — shown in AI prompts and reference panel */
  approved: string[];
  /** Prohibited phrases in Finnish */
  prohibitedFi?: string[];
  /** Approved alternatives in Finnish */
  approvedFi?: string[];
  /** Concrete before/after examples for AI and user education */
  examples: Array<{ violation: string; fix: string }>;
  /** Finnish-language before/after examples */
  examplesFi?: Array<{ violation: string; fix: string }>;
  /** Auto-generated message for scan violations */
  message: (keyword: string) => string;
  /** Finnish-language violation message */
  messageFi?: (keyword: string) => string;
  /** Instant rule-based fix suggestion (no LLM needed) */
  suggestion: string;
  /** Finnish-language fix suggestion */
  suggestionFi?: string;
  /** Compound proximity checks — flag if terms appear within maxGap words */
  compoundTerms?: Array<{
    terms: string[];
    maxGap: number;
    messageEn: string;
    messageFi: string;
  }>;
}

// ============================================================================
// RULE DEFINITIONS
// ============================================================================

export const COMPLIANCE_RULES: ComplianceRuleDefinition[] = [
  // =========================================================================
  // HIGH SEVERITY — Content will be BLOCKED
  // =========================================================================

  {
    id: "happy-hour-alcohol",
    name: "Temporary Alcohol Price Reductions & Free Alcohol",
    lawReference: "Alcohol Act §50(2) para 7, §51",
    lawText:
      "Advertising must not be contrary to good practice, inappropriate, or misleading. " +
      "Temporary price reductions on alcoholic beverages are prohibited. Free alcoholic beverages " +
      "may not be offered as part of marketing. Quantity discounts (where buying more reduces the " +
      "unit price) on alcohol are prohibited.",
    valviraGuidance:
      "Valvira 2024: 'First drink free,' 'free drinks prize draw,' unlimited alcohol packages, " +
      "'two-for-one,' 'buy-one-get-one,' and quantity discount pricing are prohibited. " +
      "Loyalty cards collecting stamps toward free alcohol ('every 10th beer free') are prohibited. " +
      "Coupons for free beer/cider distributed to consumers are prohibited. " +
      "Combined meal + mild drink packages are permitted IF a non-alcoholic option is included. " +
      "Including 1 mild drink in admission ticket price is permitted IF a non-alcoholic option exists. " +
      "'Happy hours' as a concept are permitted if advertised responsibly — the bar may offer " +
      "different prices at different times, but the advertising must not focus on temporary " +
      "alcohol price reductions as the primary appeal.",
    valviraSection: {
      chapter: 4,
      chapterTitle: "Price notices, pricing, and rebates",
      section: "Special offers, discount prices, and joint discount price bans",
      pages: "33–38",
    },
    severity: "high",
    patterns: [
      /happy\s*hour/i,
      /half\s*price\s*(drinks|alcohol|beer|wine|cocktails?|shots?)/i,
      /half\s*price/i,
      /2\s*for\s*1/i,
      /two\s*for\s*one/i,
      /buy\s*one\s*get\s*one/i,
      /bogo/i,
      /free\s*(drinks?|alcohol|beer|wine|cocktails?|shots?|champagne)/i,
      /complimentary\s*(drinks?|alcohol|beer|wine|cocktails?|champagne)/i,
      /drinks?\s*on\s*the\s*house/i,
      /open\s*bar/i,
      /free\s*(flow|flowing)\s*(drinks?|alcohol|beer)/i,
      /first\s*drink\s*(free|on\s*us)/i,
      /every\s*\d+(th|rd|nd|st)\s*(drink|beer|shot)\s*(free|on\s*us)/i,
    ],
    patternsFi: [
      /ilmais(et|ta|ia)\s+(juom[ae]|olut|olut|viini|siideri|shotti)/i,
      /kaksi\s+yhden\s+hinnalla/i,
      /osta\s+yksi\s+saa\s+toinen/i,
      /happy\s*hour/i,
      /(olut|juom[ae]|viini|siideri|drinksu).{0,15}(tarjous|alennus|tarjouksessa)/i,
      /(tarjous|alennus).{0,15}(olut|juom[ae]|viini|siideri|drinksu)/i,
      /(vain|ainoastaan)\s+\d+[\s]*[€e]uro(a|s sa)?\s*(olut|juom|viini|siideri|drinksu)/i,
      /(juom[ae]|olut|viini|siideri).{0,10}(alkaen|vain)\s+\d+[\s]*[€e]/i,
      /-?\d+\s*%\s*(alennus|ale).{0,15}(olut|juom|viini)/i,
      /(kaikki|joka)\s*(juom[ae]|olut).{0,10}-?\d+\s*%/i,
      /talon\s*tarjoam[at]/i,
      /avoin\s*baari/i,
      /ensimmäinen\s*(juoma|olut|drinksu)\s*ilmaise(ksi|sti)/i,
      /joka\s+\d+[.:]\s*(juoma|olut|shotti)\s*ilmaise(ksi|sti)/i,
      /(halvimmat|halpa|edullisimmat|edullinen)\s*(juom[ae]|olut|hinnat)/i,
      /(juom[ae]|olut).{0,10}(tarjoushinta|alennettu|alennushinta)/i,
    ],
    prohibitedFi: [
      "happy hour", "ilmainen juoma", "ilmaiset juomat", "kaksi yhden hinnalla",
      "osta yksi saa toinen", "talon tarjoama", "avoin baari",
      "ensimmäinen juoma ilmaiseksi", "juomat alk. €", "oluet vain",
    ],
    approvedFi: [
      "After-work - illan drinkkivalikoima", "Illan menu", "Talon erikoisuudet",
      "Päivän valikoima", "Illan hintataso",
    ],
    examplesFi: [
      { violation: "Happy hour — oluet 5€ ja kaksi yhden hinnalla", fix: "After-work — illan olutvalikoima klo 17 alkaen" },
      { violation: "Ilmaiset juomat klo 20-22!", fix: "Tervetuloa [Baarin Nimi] — nauti illan tunnelmasta" },
    ],
    prohibited: [
      "happy hour", "half price drinks", "2 for 1", "two for one",
      "buy one get one", "BOGO", "free drinks", "complimentary drinks",
      "drinks on the house", "open bar", "free flowing drinks",
      "first drink free", "every 10th beer free",
    ],
    approved: [
      "After-work special", "Evening pricing", "Featured selection",
      "House specials", "Signature serves", "Daily selection",
      "Evening menu", "Afternoon service",
    ],
    examples: [
      { violation: "Happy Hour! Half price cocktails 4-6pm", fix: "After-Work Special — Featured cocktails from 16:00" },
      { violation: "Buy one get one free on all beers tonight", fix: "Tonight's Beer Selection — Try our curated craft picks" },
      { violation: "Free welcome drink for every guest", fix: "Welcome to [Bar Name] — Enjoy our signature atmosphere" },
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits advertising temporary alcohol price reductions or free alcoholic beverages.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholilaki kieltää väliaikaisten hinnanalennusten tai ilmaisten alkoholijuomien mainostamisen.`,
    suggestion:
      'Replace "happy hour" with "After-work special" or "Evening pricing", ' +
      'and "half price" with "Featured cocktails". Avoid any mention of temporary alcohol price reductions.',
    suggestionFi:
      'Korvaa "happy hour" sanalla "After-work" tai "Illan hintataso". ' +
      'Vältä kaikkia mainintoja väliaikaisista alkoholin hinnanalennuksista.',
    compoundTerms: [
      { terms: ["tarjous", "erikoistarjous", "special", "offer", "deal", "discount", "alennus"], maxGap: 5, messageEn: "Offer/discount language combined with alcohol — may imply temporary price reduction", messageFi: "Tarjous/alennus yhdistettynä alkoholiin — voi tarkoittaa väliaikaista hinnanalennusta" },
      { terms: ["vain", "only", "just", "ainoastaan"], maxGap: 4, messageEn: "Urgency/exclusivity language with alcohol price — may imply temporary pricing", messageFi: "Kiireellisyys/yksinoikeus alkoholin hinnan kanssa — voi tarkoittaa väliaikaista hinnoittelua" },
      { terms: ["juomat", "drinks", "oluet", "beer", "siideri", "cider"], maxGap: 5, messageEn: "Drink terms near price/offer language", messageFi: "Juomatermit lähellä hintaa/tarjousta" },
    ],
  },

  {
    id: "excessive-consumption",
    name: "Encouraging Excessive Consumption",
    lawReference: "Alcohol Act §50(2) para 4",
    lawText:
      "Advertising must not depict heavy consumption positively or moderate consumption negatively. " +
      "It must not encourage excessive or irresponsible alcohol consumption.",
    valviraGuidance:
      "Valvira 2024: Unlimited alcohol packages ('VIP ticket with free drinks') are prohibited. " +
      "Language suggesting drinking large quantities, getting intoxicated, or competing around " +
      "alcohol consumption is prohibited. Drinking games, beer pong competitions, and shot " +
      "challenges are treated as encouraging excessive consumption.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Depicting abundant use positively or sobriety negatively (§50(2) para 4)",
      pages: "19–21",
    },
    severity: "high",
    patterns: [
      /drink\s*as\s*much\s*as/i,
      /unlimited\s*(drinks?|alcohol|beer|wine)/i,
      /all\s*you\s*can\s*drink/i,
      /bottomless\s*(drinks?|cocktails?)/i,
      /drink\s*until/i,
      /get\s*(wasted|drunk|hammered|smashed|trashed)/i,
      /drink\s*all\s*night/i,
      /never\s*ending\s*(drinks?|alcohol)/i,
      /power\s*hour/i,
      /drink\s*race/i,
      /drinking\s*game/i,
      /beer\s*pong/i,
      /shot\s*challenge/i,
      /drink\s*challenge/i,
    ],
    patternsFi: [
      /(rajaton|pohjaton|rajattomasti)\s*(juom[ae]|olut|alkoholi)/i,
      /kaikki\s*mitä\s*(juot|jaksat\s*juoda)/i,
      /juo\s*(niin\s*paljon\s*kuin|aamuun\s*asti|koko\s*yön)/i,
      /(juo|ota)\s*(itsesi|itsensä)\s*(humalaan|känniin|päihinsä)/i,
      /juomapeli/i,
      /juomakilpailu/i,
      /bisseturnaus/i,
      /shottikisa/i,
      /(lisää|lisää\s*vaan)\s*(tulee|vaan)/i,
      /lasit\s*täynnä\s*koko\s*illan/i,
      /(aloita|aloittakaa)\s*(ajoissa|aikaisin).{0,20}(jatka|jatkakaa)\s*(myöhään|myöhäseen)/i,
      /ilta\s*on\s*nuori.{0,20}juomat\s*virtaavat/i,
      /kierros\s*porukalle.{0,10}\d+[\s]*[€e]/i,
    ],
    prohibited: [
      "unlimited drinks", "all you can drink", "bottomless cocktails",
      "drink until", "get wasted", "get drunk", "hammered",
      "drinking game", "beer pong", "shot challenge", "power hour",
    ],
    prohibitedFi: [
      "rajaton juoma", "pohjaton", "kaikki mitä juot",
      "juo itsesi humalaan", "juomapeli", "shottikisa",
    ],
    approved: [
      "Generous pours", "Extended service", "Late-night menu",
      "Evening selection", "Curated drinks menu", "Cocktail menu",
      "Bar classics", "Seasonal pours",
    ],
    approvedFi: [
      "Pidennetty illan palvelu", "Täysi juomalista saatavilla",
      "Cocktail-maistelu", "Kuratoitu juomalista",
    ],
    examples: [
      { violation: "Unlimited drinks all night! Drink as much as you can!", fix: "Extended evening service — enjoy our full drinks menu all night" },
      { violation: "Beer pong tournament — get wasted!", fix: "Social games night — fun atmosphere, great company" },
      { violation: "Bottomless cocktails for €30", fix: "Cocktail flight — three signature serves, €30" },
    ],
    examplesFi: [
      { violation: "Rajaton juoma koko illan — juo niin paljon kuin jaksat!", fix: "Pidennetty illan palvelu — nauti juomalistastamme koko illan" },
      { violation: "Shottikisa — kuka juo eniten?", fix: "Peli-ilta — hyvä tunnelma, loistavaa seuraa" },
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits advertising that encourages excessive or irresponsible alcohol consumption.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholilaki kieltää liialliseen tai vastuuttomaan alkoholinkäyttöön kannustavan mainonnan.`,
    suggestion:
      'Replace "unlimited drinks" with "Extended evening service" or "Full drinks menu". ' +
      "Remove any language suggesting drinking large quantities or getting intoxicated.",
    suggestionFi:
      'Korvaa "rajaton juoma" sanalla "Pidennetty illan palvelu". Poista kaikki kieli, joka viittaa suurten määrien juomiseen.',
    compoundTerms: [
      { terms: ["pöytä", "table", "ryhmä", "group", "seurue", "porukka"], maxGap: 4, messageEn: "Table/group service implying quantity purchase", messageFi: "Pöytä-/ryhmäpalvelu, joka viittaa määräostoon" },
      { terms: ["kierros", "round", "tarjoan", "tarjoaa"], maxGap: 4, messageEn: "Round-based drinking encouragement", messageFi: "Kierrospohjaiseen juomiseen kannustaminen" },
    ],
  },

  {
    id: "targeting-minors",
    name: "Appealing to Minors",
    lawReference: "Alcohol Act §50(2) para 1",
    lawText:
      "Advertising must not target minors or other persons to whom alcoholic beverages may not be sold. " +
      "It must not depict minors, disorderly persons, or intoxicated persons. " +
      "Cartoon characters, fairy-tale figures, animated styles appealing to children, youth idols, " +
      "and sports figures popular with adolescents must not appear in alcohol advertising.",
    valviraGuidance:
      "Valvira 2024: No alcohol advertising in content directed at children/adolescents " +
      "(magazines, online games, music, videos). No cartoon characters, fairy-tale figures, " +
      "or animated styles. No youth idols, TV/film stars, or sports figures popular with adolescents. " +
      "No alcohol advertising at events/venues where minors are the main audience. " +
      "No alcohol branding on clothing/equipment of underage athletes. " +
      "'Student discounts' on alcohol imply targeting of minors — even though university students " +
      "are typically 18+, the term 'student' encompasses minors. Use 'young adult (20+)' instead.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Marketing to minors and depicting minors (§50(2) para 1)",
      pages: "16–19",
    },
    severity: "high",
    patterns: [
      /under\s*18/i,
      /underage/i,
      /high\s*school/i,
      /back\s*to\s*school/i,
      /\bteen(s|agers?)?\b/i,
      /student\s*(discount|price|special|deal|night)/i,
      /prom\s*(night|party|special)/i,
      /graduation\s*(party|special|drink)/i,
      /exam\s*(special|deal|discount)/i,
      /school\s*(night|party|event|special)/i,
      /cartoon\s*character/i,
      /fairy\s*tale/i,
    ],
    patternsFi: [
      /alaikä(inen|isiä|isille|isillekään)?/i,
      /alle\s*18[\s-]*vuotia/i,
      /opiskelija\s*(alennus|tarjous|hinta|hinnat|ilta|bileet)/i,
      /(alennus|tarjous)\s*opiskelijoille/i,
      /lukio(laisten|laisille|ikäisi)/i,
      /kouluun\s*paluu/i,
      /valmistuja(iset|isbileet|isjuhla).{0,15}(olut|juom|alkoholi)/i,
      /koejuhla.{0,15}(olut|juom|alkoholi)/i,
      /koulubileet.{0,15}(olut|juom|alkoholi)/i,
      /piirroshahmo/i,
      /satu(hahmo|hahmot)/i,
      /nuori\s*yleisö.{0,15}(olut|juom|alkoholi)/i,
      /nuorille\s*aikuisille.{0,10}\d+\s*%/i,
    ],
    prohibited: [
      "student discount", "student night", "student special",
      "high school", "under 18", "underage", "teen night",
      "back to school", "prom night", "graduation party",
      "exam special", "school night",
    ],
    prohibitedFi: [
      "opiskelija-alennus", "opiskelijatarjous", "alle 18",
      "alaikäinen", "lukio", "koulubileet", "valmistujaiset",
    ],
    approved: [
      "Young adult offer (20+)", "20+ evening", "Valid ID required",
      "Young professional gathering", "Adult evening",
    ],
    approvedFi: [
      "Nuorten aikuisten ilta (20+)", "Henkilöllisyystodistus vaaditaan",
      "Aikuisten ilta",
    ],
    examples: [
      { violation: "Student Night — 50% off all drinks with student ID!", fix: "Young Adult Evening (20+) — ID required, great atmosphere" },
      { violation: "Back to School Party — drink specials all night", fix: "Late Summer Evening — join us for our signature cocktails" },
      { violation: "Graduation celebration — free shots for grads!", fix: "Celebration Evening — special menu for your group booking" },
    ],
    examplesFi: [
      { violation: "Opiskelijabileet — shotit 2€!", fix: "Nuorten aikuisten ilta (20+) — henkkarit mukaan" },
      { violation: "Valmistujaiset — ilmaiset kuoharit!", fix: "Juhlaillallinen — varaa pöytä seurueellesi" },
    ],
    message: (kw: string) =>
      `"${kw}" — Alcohol advertising must not appeal to minors or use imagery targeting underage audiences.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholimainonta ei saa kohdistua alaikäisiin eikä käyttää alaikäisiin vetoavaa kuvastoa.`,
    suggestion:
      'Replace "student discount" with "Young adult offer (20+)" or specify age verification. ' +
      "Avoid any language or imagery that appeals to those under 18.",
    suggestionFi:
      'Korvaa "opiskelija-alennus" sanalla "Nuorten aikuisten tarjous (20+)". Vältä kaikkea alle 18-vuotiaisiin vetoavaa kieltä.',
    compoundTerms: [
      { terms: ["nuori", "young", "nuoriso", "youth"], maxGap: 5, messageEn: "Youth-focused language with alcohol context", messageFi: "Nuorisoon keskittyvä kieli alkoholikontekstissa" },
      { terms: ["opiskelija", "student", "koulu", "school"], maxGap: 5, messageEn: "Student/school language with alcohol", messageFi: "Opiskelija/koulu -kieli alkoholin kanssa" },
    ],
  },

  {
    id: "games-contests-alcohol",
    name: "Games, Contests & Prize Draws with Alcohol",
    lawReference: "Alcohol Act §50(2) para 10",
    lawText:
      "Advertising must not include games, prize draws, or contests that relate to " +
      "identifiable alcoholic beverages or where the prize is an alcoholic beverage.",
    valviraGuidance:
      "Valvira 2024: Games, contests, or prize draws linked to identifiable alcohol brands " +
      "or with alcohol as prizes are prohibited. Social media giveaways of alcohol are prohibited. " +
      "However, general trivia nights or bingo evenings (where alcohol is not the prize) are permitted. " +
      "The distinction: a 'wine tasting evening' (educational) is different from a 'win a case of wine' contest.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Games, raffles, prize draws, and competitions (§50(2) para 10)",
      pages: "26–27",
    },
    severity: "high",
    patterns: [
      /win\s*(free\s*)?\s*(drinks?|alcohol|beer|wine|cocktails?|shots?|champagne)/i,
      /prize\s*draw.*(drinks?|alcohol|beer|wine|cocktails?|shots?)/i,
      /raffle.*(drinks?|alcohol|beer|wine|cocktails?)/i,
      /giveaway.*(drinks?|alcohol|beer|wine|cocktails?)/i,
      /contest.*(drinks?|alcohol|beer|wine|cocktails?)/i,
      /sweepstakes.*(alcohol|drinks?|beer|wine)/i,
      /free\s*(drink|beer|wine)\s*(giveaway|contest|prize)/i,
    ],
    patternsFi: [
      /voita\s*(ilmaiset|ilmaisia)\s*(juom[ae]|olut|viini|shotti)/i,
      /arvonta.{0,15}(juom[ae]|olut|alkoholi|viini|shotti)/i,
      /arpajaiset.{0,15}(juom[ae]|olut|alkoholi)/i,
      /kilpailu.{0,15}(juom[ae]|olut|alkoholi).{0,15}(palkinto|voitto)/i,
      /(palkinto|voitto).{0,15}(juom[ae]|olut|alkoholi)/i,
      /voittaja(joukkueelle|tiimille).{0,10}kierros/i,
      /onnenpyörä.{0,15}(juom|baari|alkoholi)/i,
      /pullo\s*voittajalle/i,
    ],
    prohibited: [
      "win free drinks", "alcohol prize draw", "beer giveaway",
      "cocktail contest", "win a case of beer", "free drink giveaway",
      "alcohol raffle", "drinks sweepstakes",
    ],
    prohibitedFi: [
      "voita ilmaiset juomat", "olutarvonta", "viinikilpailu",
      "shottipalkinto", "pullo voittajalle",
    ],
    approved: [
      "Trivia night — prizes for winning team",
      "Bingo evening — fun atmosphere",
      "Game night — bring your competitive spirit",
      "Social evening with prizes",
    ],
    approvedFi: [
      "Tietovisailta — palkinnot voittajille", "Bingoilta — hyvä tunnelma",
      "Peli-ilta — tuo kilpailuhenkesi",
    ],
    examples: [
      { violation: "Win a case of beer in our weekly raffle!", fix: "Weekly social — great atmosphere and prizes for the winning team" },
      { violation: "Cocktail-making contest — winner gets free drinks!", fix: "Cocktail presentation evening — learn from our mixologists" },
      { violation: "Share this post to win free shots for your group!", fix: "Book your group evening — special welcome for parties of 6+" },
    ],
    examplesFi: [
      { violation: "Voita ilmaiset shotit — osallistu arvontaan!", fix: "Viikoittainen tietovisa — hienoja palkintoja voittajille" },
      { violation: "Onnenpyörä baarissa — voita pullo viiniä!", fix: "Onnenpyörä — hauskoja yllätyspalkintoja" },
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits games, contests, or prize draws linked to alcoholic beverages or with alcohol as a prize.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholilaki kieltää alkoholijuomiin liittyvät pelit, kilpailut ja arvonnat.`,
    suggestion:
      "Remove any contest, raffle, or giveaway that offers alcohol as a prize. " +
      "General trivia/game nights with non-alcohol prizes are permitted.",
    suggestionFi:
      'Poista kaikki alkoholipalkintoihin viittaavat kilpailut ja arvonnat. Yleiset tietovisat ja bingot ilman alkoholipalkintoja ovat sallittuja.',
    compoundTerms: [
      { terms: ["palkinto", "prize", "voita", "win", "kisa", "contest"], maxGap: 5, messageEn: "Prize/contest language near alcohol terms", messageFi: "Palkinto-/kilpailukieli lähellä alkoholitermejä" },
    ],
  },

  // =========================================================================
  // MEDIUM SEVERITY — Requires review, may need adjustment
  // =========================================================================

  {
    id: "strong-alcohol",
    name: "Strong Alcohol Advertising (>22% ABV)",
    lawReference: "Alcohol Act §50(1)",
    lawText:
      "Advertising of strong alcoholic beverages (over 22% ABV) to consumers is prohibited. " +
      "Exceptions: advertising at licensed serving/retail premises (indoor, not visible from outside), " +
      "uniform price lists and product catalogues, and advertising to verified professionals " +
      "in the alcohol industry.",
    valviraGuidance:
      "Valvira 2024: Strong alcohol (vodka, whiskey, gin, tequila, cognac, brandy, rum, " +
      "schnapps, Jägermeister, absinthe, akvavit) may not be advertised to consumers. " +
      "In price lists, all beverages must be presented uniformly — no individual products " +
      "may be highlighted through fonts, colours, or layout. " +
      "A bar named 'Whiskey Bar' is not an advertisement — the context matters. " +
      "The restriction applies to promoting specific strong alcohol products, not general " +
      "references to a bar's character or category.",
    valviraSection: {
      chapter: 1,
      chapterTitle: "Strong alcoholic beverages (>22% ABV)",
      section: "General prohibition and exceptions for licensed premises",
      pages: "5–16",
    },
    severity: "medium",
    patterns: [
      /vodka/i,
      /whiskey|whisky/i,
      /gin\s*(&|and)?\s*tonic/i,
      /tequila/i,
      /cognac/i,
      /brandy/i,
      /rum\s*(bar|cocktail|punch|shot)/i,
      /schnapps/i,
      /liquor/i,
      /jägermeister|jager/i,
      /absinthe/i,
      /akvavit|aquavit/i,
      /shots?\s*(bar|specials?|night|only)/i,
      /shooters/i,
      /strong\s*alcohol/i,
    ],
    patternsFi: [
      /(vodka|viski|tequila|konjakki|brandy|rommi|gini|snapsi|absintti|akvaviitti)/i,
      /jägermeister/i,
      /(väkev[äa]|vahva|vahvoja)\s*(alkoholi|viina)/i,
      /viina(special|tarjous|hinta|alkaen)/i,
      /(korkea|korkeita)\s*-?\s*%/i,
      /shotit\s*(tarjouksessa|alkaen|vain|hintaan)/i,
      /(koskenkorva|karhu|koff|lapin\s*kulta|hartwall).{0,15}(tarjous|hinta|special|€)/i,
    ],
    prohibited: [
      "vodka", "whiskey", "whisky", "gin & tonic", "tequila",
      "cognac", "brandy", "rum cocktails", "schnapps",
      "Jägermeister", "absinthe", "vodka shots", "shot specials",
    ],
    prohibitedFi: [
      "vodka", "viski", "tequila", "konjakki", "brandy", "rommi",
      "gini", "snapsi", "Jägermeister", "absintti",
      "väkevä alkoholi", "viinatarjous",
    ],
    approved: [
      "Premium spirits", "House pours", "Signature cocktails",
      "Mixed drinks", "Bar classics", "Curated selection",
      "House specialties",
    ],
    approvedFi: [
      "Premium-juomat", "Talon kaadot", "Signature-cocktailit",
      "Curatoitu valikoima", "Baarin klassikot",
    ],
    examples: [
      { violation: "Vodka shots €3 all night!", fix: "House shots — ask your bartender for tonight's selection" },
      { violation: "Whiskey tasting — 5 premium whiskeys", fix: "Premium spirits tasting — 5 curated pours from our collection" },
      { violation: "Gin & Tonic special — Hendrick's, Tanqueray, and Bombay", fix: "G&T selection — our bartender's signature serves" },
    ],
    examplesFi: [
      { violation: "Viskimaistelu — 5 premium-viskiä", fix: "Premium-maistelu — 5 kuratoitua kaatoa kokoelmastamme" },
      { violation: "Vodkashotit 3€ koko ilta!", fix: "Talon shotit — kysy baarimestarilta tämän illan valikoima" },
    ],
    message: (kw: string) =>
      `"${kw}" — Beverages over 22% ABV have advertising restrictions under Finnish law. Review required.`,
    messageFi: (kw: string) =>
      `"${kw}" — Yli 22% alkoholia sisältävien juomien mainonta kuluttajille on rajoitettua Suomen lain mukaan.`,
    suggestion:
      "Replace specific spirit brand names with 'premium spirits' or 'house pours'. " +
      "Focus on the experience rather than advertising specific strong alcohol products.",
    suggestionFi:
      'Korvaa väkevien alkoholijuomien tuotenimet sanoilla "premium-juomat" tai "talon kaadot". Keskity elämykseen tuotemerkkien mainostamisen sijaan.',
    compoundTerms: [
      { terms: ["viski", "whiskey", "vodka", "rommi", "rum", "konjakki", "cognac"], maxGap: 5, messageEn: "Strong alcohol mention in promotional context", messageFi: "Väkevän alkoholin maininta markkinointikontekstissa" },
    ],
  },

  {
    id: "misleading-health",
    name: "Misleading Health Claims",
    lawReference: "Alcohol Act §50(2) para 6",
    lawText:
      "Advertising must not promise that alcoholic beverages have medicinal or therapeutic effects. " +
      "Health claims about alcoholic beverages — including suggestions of nutritional benefits, " +
      "detoxification, immune boosting, or calorie reduction — are prohibited.",
    valviraGuidance:
      "Valvira 2024: No health claims whatsoever may be attached to alcoholic beverages. " +
      "This includes 'healthy cocktail,' 'detox drink,' 'low-calorie alcohol,' 'vitamin-infused,' " +
      "'immune-boosting,' or any suggestion that alcohol consumption has health benefits. " +
      "Describing the taste and flavor of a drink (e.g., 'refreshing citrus blend') is permitted. " +
      "Describing it as healthy or beneficial is not.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Medicinal or therapeutic claims (§50(2) para 6)",
      pages: "22–23",
    },
    severity: "medium",
    patterns: [
      /healthy\s*(drink|cocktail|alcohol|beer|wine)/i,
      /low\s*calorie\s*(drink|cocktail|alcohol)/i,
      /detox\s*(drink|cocktail)/i,
      /health\s*benefits/i,
      /good\s*for\s*you/i,
      /nutritious\s*(drink|cocktail|beer)/i,
      /vitamin\s*(drink|cocktail|beer)/i,
      /immune\s*(boost|system)/i,
    ],
    patternsFi: [
      /terveellinen\s*(juoma|cocktail|drinkki)/i,
      /vähäkalorinen\s*(juoma|cocktail|olut)/i,
      /detox[\s-]*(juoma|drinkki)/i,
      /terveys(hyödyt|vaikutukset|hyötyjä)/i,
      /(hyväksi|hyvää)\s*(sinulle|terveydelle)/i,
      /ravitseva\s*(juoma|cocktail|olut)/i,
      /vitamiini[\s-]*(juoma|cocktail|drinkki)/i,
      /immuuni(järjestelmä|puolustus)/i,
      /(puhdas|luonnollinen|luomu).{0,15}(juom|cocktail|alkoholi)/i,
      /syyttömyys.{0,15}(juom|alkoholi|drinkki)/i,
      /keho\s*kiittää.{0,15}(juom|alkoholi)/i,
    ],
    prohibited: [
      "healthy cocktail", "low-calorie drink", "detox drink",
      "health benefits", "good for you", "nutritious beer",
      "vitamin cocktail", "immune boosting",
    ],
    prohibitedFi: [
      "terveellinen drinkki", "vähäkalorinen olut", "detox-cocktail",
      "terveyshyödyt", "ravitseva juoma", "vitamiinijuoma",
    ],
    approved: [
      "Refreshing blend", "Citrus-forward", "Light and crisp",
      "Fresh ingredients", "Seasonal flavors", "Craft quality",
    ],
    approvedFi: [
      "Raikas sitrussekoitus", "Tuoreet raaka-aineet",
      "Kevyt ja raikas", "Sesonkimaut",
    ],
    examples: [
      { violation: "Our healthy detox cocktail — low calorie and vitamin-rich!", fix: "Our refreshing citrus blend — fresh ingredients, bright flavors" },
      { violation: "Beer that's good for you — packed with nutrients!", fix: "Craft beer — quality ingredients, distinctive character" },
    ],
    examplesFi: [
      { violation: "Terveellinen detox-cocktail — vähäkalorinen ja vitamiinirikas!", fix: "Raikas sitrussekoitus — tuoreita makuja, kirkas lopputulos" },
      { violation: "Keho kiittää — luonnolliset raaka-aineet!", fix: "Kauden makuja — tuoreita raaka-aineita, huolella valmistettu" },
    ],
    message: (kw: string) =>
      `"${kw}" — Health claims about alcoholic beverages are prohibited under Finnish law.`,
    messageFi: (kw: string) =>
      `"${kw}" — Terveysväitteet alkoholijuomista ovat kiellettyjä Suomen lain mukaan.`,
    suggestion:
      "Remove health claims entirely. Focus on taste, flavor, and experience instead " +
      '(e.g., "Refreshing citrus blend" rather than "healthy detox cocktail").',
    suggestionFi:
      'Poista kaikki terveysväitteet. Keskity makuun, laatuun ja elämykseen (esim. "Raikas sitrussekoitus" eikä "Terveellinen detox-cocktail").',
    compoundTerms: [
      { terms: ["puhdas", "clean", "luonnollinen", "natural", "kevyt", "light"], maxGap: 5, messageEn: "Health-halo language with alcohol", messageFi: "Terveysvaikutelma alkoholin yhteydessä" },
    ],
  },

  {
    id: "consumer-content-sharing",
    name: "Consumer-Generated Content & Social Media Sharing",
    lawReference: "Alcohol Act §50(2) para 11",
    lawText:
      "Advertising must not use consumer-generated content (photos, videos) or encourage " +
      "consumers to share advertising for alcoholic beverages. 'Share' and 'forward' " +
      "functions on alcohol advertising are prohibited.",
    valviraGuidance:
      "Valvira 2024: Social media share buttons on alcohol advertising are prohibited. " +
      "Encouraging consumers to share photos or videos of their drinking is prohibited. " +
      "Consumer comments that themselves constitute alcohol advertising must be moderated or deleted. " +
      "'Like' functions are permitted (passive consumer action). " +
      "Restaurants should disable comment features or actively moderate if alcohol is featured. " +
      "Sharing/forwarding of any alcohol advertising content by consumers is prohibited — " +
      "bars cannot prompt or incentivize this behavior.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Consumer-produced content in advertising (§50(2) para 11)",
      pages: "27–28",
    },
    severity: "medium",
    patterns: [
      /share\s*(this|your)\s*(photo|pic|video|moment)/i,
      /tag\s*(us|your\s*friends).*(drink|beer|cocktail)/i,
      /post\s*your\s*(drink|beer|cocktail|shot)/i,
      /follow\s*us.*(for|to\s*get).*(drink|beer|free)/i,
      /repost.*(drink|beer|cocktail)/i,
      /share\s*to\s*(win|get)/i,
    ],
    patternsFi: [
      /jaa\s*(kuvasi|videosi|hetkesi|kokemuksesi)/i,
      /tägää\s*meidät.{0,15}(juom|olut|drinkki)/i,
      /postaa\s*(juomasi|oluusi|drinkkisi|shotisi)/i,
      /seuraa\s*meitä.{0,15}(ilmainen|ilmaisia)\s*(juom|olut)/i,
      /jaa\s*uudelleen.{0,15}(juom|olut|drinkki)/i,
      /jaa\s*ja\s*voita.{0,15}(juom|olut|alkoholi)/i,
      /(näytä|lähetä|kerro)\s*(iltasi|meille|hetkesi).{0,20}(juom|olut|baari)/i,
      /haluamme\s*nähdä\s*iltasi/i,
    ],
    prohibited: [
      "share your drink photo", "tag us with your cocktail",
      "post your beer", "repost to win", "share your moment",
      "follow us for free drinks",
    ],
    prohibitedFi: [
      "jaa kuvasi", "tägää meidät", "postaa juomasi",
      "jaa ja voita", "seuraa meitä ilmaisiin juomiin",
    ],
    approved: [
      "Visit us tonight", "Book your table", "See our menu",
      "Join us this evening", "Reserve your spot",
    ],
    approvedFi: [
      "Vieraile tänä iltana", "Varaa pöytäsi",
      "Katso ruokalistamme", "Liity seuraamme tänä iltana",
    ],
    examples: [
      { violation: "Share a photo of your drink and tag us for a chance to win!", fix: "Visit us tonight and enjoy our signature cocktails" },
      { violation: "Post your best beer moment — best photo wins a prize!", fix: "Join us for our craft beer evening — book your table" },
    ],
    examplesFi: [
      { violation: "Jaa kuvasi drinkistä ja tägää meidät — voit voittaa!", fix: "Vieraile tänä iltana ja nauti signature-cocktaileistamme" },
      { violation: "Postaa paras oluthetkesi — paras kuva voittaa!", fix: "Liity seuraamme käsityöolut-iltaan — varaa pöytäsi" },
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits encouraging consumers to share alcohol advertising content on social media.`,
    messageFi: (kw: string) =>
      `"${kw}" — Kuluttajien tuottaman alkoholimainonnan jakaminen on kiellettyä Suomen lain mukaan.`,
    suggestion:
      "Remove calls to share/tag/post alcohol-related content. Use general CTAs like 'Visit us' or 'Book your table'.",
    suggestionFi:
      'Poista kehotukset jakaa/tägätä/postata alkoholiin liittyvää sisältöä. Käytä yleisiä toimintakehotuksia kuten "Vieraile" tai "Varaa pöytäsi".',
    compoundTerms: [
      { terms: ["jaa", "share", "tägää", "tag", "postaa", "post"], maxGap: 5, messageEn: "Social sharing prompt with alcohol context", messageFi: "Sosiaalisen median jakamiskehotus alkoholikontekstissa" },
    ],
  },

  {
    id: "social-success-promise",
    name: "Promising Social or Sexual Success",
    lawReference: "Alcohol Act §50(2) para 5",
    lawText:
      "Advertising must not promise that alcoholic beverages increase performance, " +
      "or bring about social or sexual success.",
    valviraGuidance:
      "Valvira 2024: Advertising must not suggest that alcohol consumption leads to social " +
      "popularity, romantic success, confidence, or improved social performance. " +
      "Phrases like 'get lucky,' 'pull tonight,' 'boost your confidence,' or suggestions " +
      "that alcohol makes you more attractive or socially successful are prohibited. " +
      "Describing a venue as a 'great place to meet people' or 'social atmosphere' is permitted " +
      "as long as the connection to alcohol is not explicit.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Promising performance or social/sexual success (§50(2) para 5)",
      pages: "21–22",
    },
    severity: "medium",
    patterns: [
      /get\s*(lucky|laid)/i,
      /pull\s*(tonight|someone)/i,
      /boost\s*your\s*confidence/i,
      /more\s*attractive/i,
      /be\s*the\s*life\s*of\s*the\s*party/i,
      /guaranteed\s*(fun|good\s*time).*drink/i,
      /drink.*(confidence|charisma|charm)/i,
      /alcohol.*(social|success|popular)/i,
    ],
    patternsFi: [
      /saada\s*seuraa/i,
      /iskeä.{0,10}(tänään|tänä\s*iltana|baari)/i,
      /pokata.{0,10}(tänään|tänä\s*iltana)/i,
      /lisää\s*itseluottamusta/i,
      /viehättävämpi/i,
      /olla\s*bileiden\s*keskipiste/i,
      /taattu\s*(hauskuus|hyvä\s*aika).{0,15}(juom|drinkki|alkoholi)/i,
      /(juom|alkoholi).{0,15}(itseluottamus|karisma|itsevarmuus)/i,
      /mihin\s*ilta\s*viekään/i,
      /löydä\s*seuraa.{0,15}(tänään|tänä\s*iltana|baari)/i,
      /tänä\s*iltana\s*kaikki\s*voi\s*tapahtua.{0,15}(juom|baari|alkoholi)/i,
      /tee\s*muistoja.{0,15}(juom|alkoholi|bile)/i,
    ],
    prohibited: [
      "get lucky", "get laid", "pull tonight",
      "boost your confidence", "more attractive",
      "be the life of the party",
    ],
    prohibitedFi: [
      "saada seuraa", "iskeä", "pokata", "lisää itseluottamusta",
      "viehättävämpi", "bileiden keskipiste",
    ],
    approved: [
      "Great atmosphere", "Social evening", "Meet new people",
      "Lively venue", "Friendly crowd", "Welcoming space",
    ],
    approvedFi: [
      "Loistava tunnelma", "Seurallinen ilta", "Tapaa uusia ihmisiä",
      "Vilkas paikka", "Ystävällinen porukka",
    ],
    examples: [
      { violation: "Drink our cocktails and get lucky tonight!", fix: "Enjoy our signature cocktails in a vibrant, social atmosphere" },
      { violation: "Boost your confidence with our premium shots!", fix: "Our mixologist's latest creations — try something new tonight" },
    ],
    examplesFi: [
      { violation: "Juo cocktailimme ja löydä seuraa tänä iltana!", fix: "Nauti signature-cocktaileistamme vilkkaassa, seurallisessa ilmapiirissä" },
      { violation: "Lisää itseluottamusta premium-shoteillamme!", fix: "Baarimestarin uusimmat luomukset — kokeile jotain uutta tänä iltana" },
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits advertising that promises social or sexual success from alcohol consumption.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholilaki kieltää mainonnan, joka lupaa alkoholista sosiaalista tai seksuaalista menestystä.`,
    suggestion:
      "Remove language suggesting alcohol leads to social/sexual success. " +
      "Focus on atmosphere, quality, and the venue experience.",
    suggestionFi:
      'Poista kieli, joka viittaa alkoholin tuomaan sosiaaliseen/seksuaaliseen menestykseen. Keskity tunnelmaan, laatuun ja paikan elämykseen.',
    compoundTerms: [
      { terms: ["seuraa", "seura", "löydä", "find", "meet", "tapaa"], maxGap: 5, messageEn: "Social connection promise near alcohol", messageFi: "Sosiaalisen yhteyden lupaus alkoholin lähellä" },
    ],
  },

  {
    id: "vehicle-association",
    name: "Associating Alcohol with Operating Vehicles",
    lawReference: "Alcohol Act §50(2) para 2",
    lawText:
      "Advertising must not associate the consumption of alcoholic beverages " +
      "with the operation of a vehicle.",
    valviraGuidance:
      "Valvira 2024: Any suggestion linking alcohol consumption and driving, boating, " +
      "or operating any vehicle is prohibited. This includes phrases like 'designated driver special,' " +
      "'park and drink,' or imagery showing alcohol alongside vehicles. " +
      "Pure logistical information ('parking available,' 'near metro station') is permitted " +
      "as long as it does not link to alcohol consumption.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Associating alcohol with operating a vehicle (§50(2) para 2)",
      pages: "19",
    },
    severity: "medium",
    patterns: [
      /designated\s*driver/i,
      /dd\s*(special|discount|deal|free)/i,
      /park\s*and\s*drink/i,
      /drink\s*and\s*drive/i,
      /drive\s*(home|safe).*drink/i,
      /car\s*park.*drink/i,
      /driving.*(drink|alcohol|beer)/i,
      /ride.*(drink|alcohol|beer).*special/i,
      /boat.*drink.*special/i,
    ],
    patternsFi: [
      /(kuski|kuskille).{0,15}(ilmainen|tarjous|alennus|special)/i,
      /(parkkeeraa|parkki).{0,10}(juo|juoma|baari)/i,
      /juo\s*ja\s*aja/i,
      /(auto|ajaa|ajaminen).{0,15}(juom|alkoholi|olut|baari)/i,
      /parkkipaikka.{0,15}(juom|alkoholi|baari).{0,10}(ilmainen|edessä|vieressä)/i,
      /tule\s*autolla.{0,20}taksi/i,
      /(vene|laiva).{0,15}(juom|alkoholi).{0,10}(tarjous|special)/i,
    ],
    prohibited: [
      "designated driver special", "DD discount",
      "park and drink", "drink and drive", "drive safe special",
    ],
    prohibitedFi: [
      "kuski special", "parkkeeraa ja juo", "juo ja aja",
      "parkki oven edessä", "tule autolla",
    ],
    approved: [
      "Near public transport", "Central location",
      "Easy to reach", "Parking nearby", "Short walk from metro",
    ],
    approvedFi: [
      "Lähellä julkista liikennettä", "Keskeinen sijainti",
      "Helposti saavutettavissa", "Lyhyt kävely metrolta",
    ],
    examples: [
      { violation: "Designated driver gets free soft drinks all night!", fix: "We're a short walk from the central metro station" },
      { violation: "Park and drink — spacious car park right outside!", fix: "Conveniently located with parking nearby" },
    ],
    examplesFi: [
      { violation: "Kuski saa ilmaiset virvokkeet koko illan!", fix: "Olemme lyhyen kävelymatkan päässä metroasemalta" },
      { violation: "Parkkeeraa ja nauti — tilava parkkipaikka heti edessä!", fix: "Keskeinen sijainti — parkkipaikkoja lähistöllä" },
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits advertising that associates alcohol consumption with operating a vehicle.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholilaki kieltää alkoholin ja ajoneuvon käytön yhdistämisen mainonnassa.`,
    suggestion:
      "Remove any link between alcohol and driving/vehicles. " +
      "Transport information is fine when presented as pure logistics, not connected to drinking.",
    suggestionFi:
      'Poista kaikki yhteydet alkoholin ja autoilun/ajoneuvojen välillä. Sijaintitiedot ovat sallittuja puhtaasti logistisina tietoina.',
    compoundTerms: [
      { terms: ["auto", "car", "parkki", "parking", "ajaa", "drive"], maxGap: 5, messageEn: "Vehicle/parking reference near alcohol venue", messageFi: "Ajoneuvo/pysäköinti -viittaus alkoholibaarin yhteydessä" },
    ],
  },

  {
    id: "alcohol-content-positive",
    name: "Highlighting Alcohol Content as a Positive Feature",
    lawReference: "Alcohol Act §50(2) para 3",
    lawText:
      "Advertising must not highlight the alcohol content of a beverage as a positive feature.",
    valviraGuidance:
      "Valvira 2024: Emphasizing high ABV, strength, or potency as a desirable quality is prohibited. " +
      "Words like 'strong,' 'intense,' 'powerful,' 'heavy,' 'extra strength,' or ABV percentages " +
      "used as marketing hooks are not allowed. " +
      "Standard product information (ABV listed in a menu) is permitted. " +
      "The issue is promotional language that makes alcohol strength the selling point.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Presenting alcohol content as a positive feature (§50(2) para 3)",
      pages: "19",
    },
    severity: "medium",
    patterns: [
      /high\s*(abv|alcohol|proof|strength)/i,
      /extra\s*strong/i,
      /super\s*strength/i,
      /maximum\s*strength/i,
      /(\d+)\s*%\s*(abv|alcohol).*strong/i,
      /more\s*(alcohol|kick|punch|buzz)/i,
      /strongest\s*(drink|cocktail|beer|shot)/i,
      /intense\s*(alcohol|spirit|drink)/i,
      /potent\s*(drink|cocktail|mix)/i,
    ],
    patternsFi: [
      /(korkea|korkeat)\s*(prosentti|-%|alkoholi)/i,
      /(extra|super|mega)\s*vahva/i,
      /maksimi\s*vahvuus/i,
      /vahvin\s*(drinkki|cocktail|juoma)/i,
      /(enemmän|lisää)\s*(alkoholia|potkua|paukkua)/i,
      /(voimakas|intensiivinen)\s*(drinkki|cocktail|alkoholi)/i,
      /(vahvat|vahvoja)\s*kaadot/i,
    ],
    prohibited: [
      "high ABV", "extra strong", "super strength",
      "more alcohol", "strongest drink", "potent cocktail",
      "maximum kick",
    ],
    prohibitedFi: [
      "korkea-%", "extra vahva", "super vahva",
      "maksimi vahvuus", "vahvin drinkki", "enemmän alkoholia",
    ],
    approved: [
      "Bold flavor", "Rich character", "Complex profile",
      "Distinctive taste", "Full-bodied", "Carefully crafted",
    ],
    approvedFi: [
      "Voimakas maku", "Rikas luonne", "Monimutkainen profiili",
      "Täyteläinen", "Huolella valmistettu",
    ],
    examples: [
      { violation: "Our strongest cocktail yet — 40% ABV, extra kick!", fix: "Our latest creation — bold flavors, complex character" },
      { violation: "Maximum strength shots for maximum fun!", fix: "Tonight's house shots — ask your bartender for the selection" },
    ],
    examplesFi: [
      { violation: "Vahvin cocktailimme — 40% ABV, extra potkua!", fix: "Uusin luomuksemme — rohkeita makuja, monimutkainen luonne" },
      { violation: "Maksimi vahvuus shotit maksimi hauskuuteen!", fix: "Tämän illan talon shotit — kysy baarimestarilta valikoima" },
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits highlighting alcohol content as a positive feature in advertising.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholilaki kieltää alkoholipitoisuuden korostamisen positiivisena ominaisuutena mainonnassa.`,
    suggestion:
      "Remove emphasis on alcohol strength/ABV. Describe flavor, quality, and character instead. " +
      "Standard ABV listing in menus is fine — the prohibition is on promotional language.",
    suggestionFi:
      'Poista alkoholin vahvuuden/%-pitoisuuden korostaminen. Kuvaile makua, laatua ja luonnetta. Normaali ABV-listaus ruokalistalla on sallittua.',
    compoundTerms: [
      { terms: ["vahva", "strong", "vahvuus", "strength", "%", "abv"], maxGap: 4, messageEn: "Alcohol strength emphasis in promotional language", messageFi: "Alkoholin vahvuuden korostus markkinointikielessä" },
    ],
  },

  {
    id: "intoxication-depiction",
    name: "Depicting Intoxication Positively",
    lawReference: "Alcohol Act §50(2) para 1",
    lawText:
      "Advertising must not depict intoxicated persons. It must not present intoxication " +
      "as desirable, humorous, or a normal part of social life.",
    valviraGuidance:
      "Valvira 2024: Depicting people who appear drunk — or suggesting that being drunk " +
      "is fun, aspirational, or normal — is prohibited. This includes language like 'get wasted,' " +
      "'let's get smashed,' or imagery suggesting intoxication is a positive outcome. " +
      "'Tipsy,' 'buzzed,' and similar euphemisms for intoxication are also prohibited.",
    valviraSection: {
      chapter: 2,
      chapterTitle: "Mild alcoholic beverages (≤22% ABV)",
      section: "Depicting intoxicated persons (§50(2) para 1)",
      pages: "16–19",
    },
    severity: "medium",
    patterns: [
      /tipsy/i,
      /buzzed/i,
      /let('?s|'?s\s*all)\s*get\s*(drunk|wasted|smashed|hammered)/i,
      /drunk\s*(night|evening|party)/i,
      /hangover\s*(cure|remedy|special)/i,
      /hair\s*of\s*the\s*dog/i,
      /day\s*drinking/i,
      /pregame|pre-game/i,
    ],
    patternsFi: [
      /(hiprakka|hiprakassa|pienessä\s*sievässä)/i,
      /(nousuhumala|nousuhumalassa)/i,
      /(humalaan|känniin|päihinsä|juovuksiin)/i,
      /(känni|räkä|kostea)\s*(ilta|bileet|juhlat)/i,
      /krapula(lääke|parannus|korjaus|aamiainen)/i,
      /(krapularyyppy|korjaussarja)/i,
      /(päiväkännit|päiväjuominen)/i,
      /(etkot|etkoilla).{0,15}(juom|alkoholi|olut)/i,
      /(hyvä|hyvät)\s*fiilis.{0,15}(juom|alkoholi|baari)/i,
      /päästä\s*irti.{0,15}(juom|alkoholi|baari)/i,
      /aloita\s*viikonloppu\s*oikein.{0,15}(juom|alkoholi|baari)/i,
      /nollaus.{0,15}(juom|alkoholi|baari)/i,
    ],
    prohibited: [
      "tipsy", "buzzed", "get drunk", "drunk night",
      "hangover cure", "hair of the dog", "day drinking", "pregame",
    ],
    prohibitedFi: [
      "hiprakka", "nousuhumalassa", "känniin", "päihinsä",
      "känni-ilta", "krapulalääke", "krapularyyppy",
      "päiväkännit", "etkot",
    ],
    approved: [
      "Evening out", "Night out", "Social gathering",
      "Relaxed evening", "Good company", "Quality time",
    ],
    approvedFi: [
      "Ilta ulkona", "Sosiaalinen kokoontuminen",
      "Rento ilta", "Hyvää seuraa", "Laatuaikaa",
    ],
    examples: [
      { violation: "Tipsy Tuesday — the best drunk night of the week!", fix: "Tuesday Social — relaxed evening, great company" },
      { violation: "Hangover cure special — hair of the dog on Sundays!", fix: "Sunday Brunch — fresh food, great coffee, easy atmosphere" },
    ],
    examplesFi: [
      { violation: "Tipsy Tuesday — viikon paras känni-ilta!", fix: "Tiistain sosiaalinen ilta — rentoa tunnelmaa, hyvää seuraa" },
      { violation: "Krapulalääke — korjaussarja sunnuntaisin!", fix: "Sunnuntaibrunssi — tuoretta ruokaa, hyvää kahvia, rento tunnelma" },
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits depicting intoxication positively in alcohol advertising.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholilaki kieltää päihtymyksen esittämisen positiivisena mainonnassa.`,
    suggestion:
      'Remove intoxication references and euphemisms. Use "evening out" or "social gathering" instead.',
    suggestionFi:
      'Poista päihtymysviittaukset ja eufemismit. Käytä "Ilta ulkona" tai "Sosiaalinen kokoontuminen" sen sijaan.',
    compoundTerms: [
      { terms: ["fiilis", "irrottelu", "bileet", "party", "juhla", "celebration"], maxGap: 5, messageEn: "Party/celebration framing implying intoxication", messageFi: "Juhla/bile -kehystys, joka viittaa päihtymykseen" },
    ],
  },

  // =========================================================================
  // LOW SEVERITY — Advisory, not blocking
  // =========================================================================

  {
    id: "suggestive-price-reduction",
    name: "Suggestive Price Language",
    lawReference: "Alcohol Act §50(2) para 7, §51",
    lawText:
      "Price-focused alcohol advertising faces scrutiny under the 'contrary to good practice' provision. " +
      "While not an outright prohibition on mentioning prices, advertising that makes low alcohol " +
      "prices the primary appeal may be considered contrary to good practice.",
    valviraGuidance:
      "Valvira 2024: Aggressive price advertising for alcohol (e.g., 'cheapest drinks in town,' " +
      "'lowest prices guaranteed') is discouraged. Standard pricing information is permitted. " +
      "The concern is when cheap alcohol is the main marketing hook rather than quality, " +
      "atmosphere, or experience.",
    valviraSection: {
      chapter: 4,
      chapterTitle: "Price notices, pricing, and rebates",
      section: "Price notices and advertising at licensed premises",
      pages: "33–36",
    },
    severity: "low",
    patterns: [
      /cheap(est)?\s*(drinks?|beer|alcohol)/i,
      /lowest\s*price/i,
      /best\s*deal/i,
      /discount\s*(drinks?|alcohol)/i,
      /reduced\s*price/i,
      /special\s*offer/i,
      /bargain\s*(drinks?|beer)/i,
    ],
    patternsFi: [
      /(halvimmat|halvin|halpa|edullisin|edullisimmat)\s*(hinta|hinnat|juom|olut)/i,
      /paras\s*(diili|tarjous|hinta).{0,15}(juom|olut|alkoholi)/i,
      /alennus.{0,15}(juom|olut|alkoholi|drinkki)/i,
      /(alennettu|alhaisempi)\s*hinta.{0,15}(juom|olut|alkoholi)/i,
      /erikoistarjous.{0,15}(juom|olut|alkoholi)/i,
      /(tarjoushinta|tarjoushinnat).{0,15}(juom|olut)/i,
    ],
    prohibited: [
      "cheapest drinks", "lowest price", "best deal",
      "discount drinks", "bargain beer",
    ],
    prohibitedFi: [
      "halvimmat juomat", "halvin hinta", "paras diili",
      "alennusjuomat", "erikoistarjous olut",
    ],
    approved: [
      "Value selection", "Featured pricing", "Today's selection",
      "Evening menu", "Our current list",
    ],
    approvedFi: [
      "Hinta-laatusuhde", "Päivän valikoima",
      "Illan menu", "Tämän hetken listamme",
    ],
    examples: [
      { violation: "Cheapest drinks in Helsinki — best deal in town!", fix: "Featured pricing all evening — quality drinks, great atmosphere" },
      { violation: "Discounted beer — lowest prices guaranteed!", fix: "Beer selection — discover new favorites from our curated list" },
    ],
    examplesFi: [
      { violation: "Helsingin halvimmat juomat — paras diili kaupungissa!", fix: "Laadukkaat juomat koko illan — loistava tunnelma" },
      { violation: "Alennettu olut — halvimmat hinnat taattu!", fix: "Olutvalikoima — löydä uusia suosikkeja kuratoidulta listaltamme" },
    ],
    message: (kw: string) =>
      `"${kw}" — Price-focused alcohol advertising may be scrutinized. Ensure this is not a time-limited alcohol price promotion.`,
    messageFi: (kw: string) =>
      `"${kw}" — Hintapainotteista alkoholimainontaa voidaan tarkastella hyvän tavan vastaisena.`,
    suggestion:
      'Replace price-focused language with value-oriented terms. Focus on quality and selection rather than cheapness.',
    suggestionFi:
      'Korvaa hintapainotteinen kieli arvopainotteisilla termeillä. Keskity laatuun ja valikoimaan halpuuden sijaan.',
    compoundTerms: [
      { terms: ["hinta", "price", "maksaa", "cost", "€", "euro"], maxGap: 4, messageEn: "Price emphasis with alcohol", messageFi: "Hintapainotus alkoholin kanssa" },
    ],
  },

  {
    id: "quantity-promotion",
    name: "Quantity-Based Promotion",
    lawReference: "Alcohol Act §51",
    lawText:
      "Quantity discounts on alcoholic beverages (where buying more reduces the unit price) " +
      "are prohibited under the pricing provisions of the Alcohol Act.",
    valviraGuidance:
      "Valvira 2024: 'Bucket of beer,' 'pitcher deals,' 'tower of drinks,' and similar " +
      "quantity-based promotions may imply excessive consumption and violate quantity discount rules. " +
      "Beer flights and tasting selections are permitted as they are about variety, not quantity. " +
      "Loyalty cards collecting stamps toward free alcohol are prohibited.",
    valviraSection: {
      chapter: 4,
      chapterTitle: "Price notices, pricing, and rebates",
      section: "Joint discount price ban and quantity-based promotions (§51)",
      pages: "33–35",
    },
    severity: "low",
    patterns: [
      /bucket\s*of\s*(beer|drinks)/i,
      /pitcher\s*(deal|special|offer)/i,
      /tower\s*of\s*(beer|drinks)/i,
      /6\s*pack/i,
      /party\s*pack/i,
      /drink\s*package/i,
      /multiple\s*(drinks?|shots?)/i,
      /stamp\s*card.*(drink|beer|free)/i,
      /loyalty.*(drink|beer|alcohol).*free/i,
    ],
    patternsFi: [
      /(sanko|ämpäri).{0,10}(olut|juom|drinkki)/i,
      /(tuoppi|kannu).{0,10}(tarjous|special|hintaan|€)/i,
      /juomatorni/i,
      /\d+\s*-?\s*pakkaus.{0,10}(olut|juom)/i,
      /bilepakkaus.{0,10}(olut|juom)/i,
      /juomapaketti/i,
      /(monta|useita)\s*(juomaa|shottia|drinkkiä)/i,
      /leimakortti.{0,15}(olut|juom|alkoholi).{0,15}ilmainen/i,
      /kanta-asiakas.{0,15}(olut|juom|alkoholi).{0,15}ilmainen/i,
      /\d+\s*(olutta|juomaa|shottia).{0,10}\d+[\s]*[€e]/i,
    ],
    prohibited: [
      "bucket of beer", "pitcher deal", "tower of drinks",
      "6-pack", "party pack", "drink package", "stamp card free drink",
    ],
    prohibitedFi: [
      "sanko olutta", "ämpäri", "juomatorni", "6-pakkaus",
      "bilepakkaus", "juomapaketti", "leimakortti ilmainen olut",
    ],
    approved: [
      "Beer selection", "Craft beer flight", "Tasting board",
      "Curated selection", "Evening menu",
    ],
    approvedFi: [
      "Olutvalikoima", "Maisteluflight", "Maistelulauta",
      "Kuratoitu valikoima", "Illan menu",
    ],
    examples: [
      { violation: "Bucket of 6 beers for €25 — party pack special!", fix: "Craft beer flight — 4 tasting pours, €18" },
      { violation: "Drink package: 10 shots for €30!", fix: "Tonight's selection — ask your bartender for recommendations" },
    ],
    examplesFi: [
      { violation: "Sanko 6 olutta 25€ — bilepakkaus!", fix: "Käsityöolut-flight — 4 maistelukaatoa, 18€" },
      { violation: "Juomapaketti: 10 shottia 30€!", fix: "Tämän illan valikoima — kysy baarimestarilta suosituksia" },
    ],
    message: (kw: string) =>
      `"${kw}" — Promotions based on alcohol quantity may imply excessive consumption. Review wording.`,
    messageFi: (kw: string) =>
      `"${kw}" — Alkoholin määrään perustuvat tarjoukset voivat viitata liialliseen kulutukseen.`,
    suggestion:
      'Replace quantity-based promotions with tasting or selection formats. Use "Beer flight" or "Tasting board" instead of "bucket" or "package".',
    suggestionFi:
      'Korvaa määräpohjaiset tarjoukset maistelu- tai valikoimaformaateilla. Käytä "Olutflight" tai "Maistelulauta" sanojen "sanko" tai "pakkaus" sijaan.',
    compoundTerms: [
      { terms: ["pullo", "bottle", "pullopalvelu", "bottle service"], maxGap: 3, messageEn: "Bottle/quantity-based service implying bulk purchase", messageFi: "Pullopalvelu, joka viittaa määräostoon" },
    ],
  },
];

// ============================================================================
// DERIVED DATA — Auto-generated from COMPLIANCE_RULES
// ============================================================================

/** Quick-lookup map: rule ID → suggestion text (for ComplianceBar inline fixes) */
export const SUGGESTIONS_MAP: Record<string, string> = Object.fromEntries(
  COMPLIANCE_RULES.map((r) => [r.id, r.suggestion]),
);

/** All prohibited phrases across all rules (for AI prompt "DO NOT" list) */
export const ALL_PROHIBITED: string[] = COMPLIANCE_RULES.flatMap((r) => r.prohibited);

/** All approved alternatives across all rules (for AI prompt "DO" list) */
export const ALL_APPROVED: string[] = COMPLIANCE_RULES.flatMap((r) => r.approved);

/** Rules by severity */
export const HIGH_SEVERITY_RULES = COMPLIANCE_RULES.filter((r) => r.severity === "high");
export const MEDIUM_SEVERITY_RULES = COMPLIANCE_RULES.filter((r) => r.severity === "medium");
export const LOW_SEVERITY_RULES = COMPLIANCE_RULES.filter((r) => r.severity === "low");

/** Total rule count */
export const RULE_COUNT = COMPLIANCE_RULES.length;

/** Total pattern count */
export const PATTERN_COUNT = COMPLIANCE_RULES.reduce(
  (sum, r) => sum + r.patterns.length, 0,
);
