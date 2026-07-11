# Compliance Check Categories — Complete Reference

This is the canonical checklist for every aspect that must be checked when
content is scanned for Finnish alcohol marketing compliance. Every category
applies to **both English and Finnish** text. The list is organized so it can
be implemented as: (1) regex patterns, (2) compound/proximity checks, (3) AI
system prompt rules, and (4) image output validation.

---

## CATEGORY 1 — Temporary Alcohol Price Reductions & Free Alcohol

**Law:** Alcohol Act §50(2) para 7, §51
**Severity:** HIGH — BLOCK on match

### What to catch

| English | Finnish |
|---|---|
| Any alcohol + price together (€, %, discount, deal, offer, special price) | Any "olut/viini/siideri/drinksu" + "€/%/tarjous/alennus/hinta" |
| "happy hour," "half price," "2 for 1," "bogo" | "happy hour," "kaksi yhden hinnalla," "osta yksi saa toinen" |
| "free drinks/beer/wine/cocktails/shots/champagne" | "ilmaiset juomat/oluet/viinit/shotit" |
| "complimentary drinks," "on the house," "open bar" | "talon tarjoamat," "avoin baari" |
| "first drink free," "every Nth drink free" | "ensimmäinen juoma ilmaiseksi," "joka N:s olut ilmaiseksi" |
| "drinks starting at €X" | "juomat alkaen X€" |
| Day-of-week + alcohol + price: "Tuesday: €5 cocktails" | "Tiistaisin: oluet 5€" |
| "% off" + any alcohol term | "-20%" + any alcohol term |
| "cheap/cheapest" + alcohol | "halpa/halvimmat" + alcohol |
| "best deal," "lowest price" + alcohol | "paras diili," "halvin hinta" + alcohol |
| Urgency + alcohol: "today only," "this week only," "limited time" + drink terms | "vain tänään," "rajoitettu aika" + alcohol |
| **Compound:** "special/offer/deal/discount" + price/€/% + alcohol term within 5 words | "tarjous/erikoistarjous" + €/% + alcohol within 5 words |
| **Compound:** "vain/only/just" + €/price + alcohol term within 3 words | "vain/ainoastaan" + € + alcohol within 3 words |

### What should pass

| English | Finnish |
|---|---|
| "After-work special — featured cocktails" (no price mentioned) | "After-work - illan drinkkivalikoima" |
| "Evening pricing" (not specific to alcohol) | "Illan menu" |
| "House specials," "Signature serves" | "Talon erikoisuudet" |
| Food + price + non-alcohol framing: "Burger & side €12" | "Burgeri ja lisuke 12€" |
| Non-alcohol "happy hour": "Happy hour food menu 16-19" with no drink terms | "Happy hour ruokalista" with no alcohol terms |

---

## CATEGORY 2 — Encouraging Excessive Consumption

**Law:** Alcohol Act §50(2) para 4
**Severity:** HIGH — BLOCK on match

### What to catch

| English | Finnish |
|---|---|
| "unlimited drinks," "all you can drink," "bottomless" | "rajaton juoma," "pohjaton," "kaikki mitä juot" |
| "drink as much as," "drink until," "drink all night" | "juo niin paljon kuin," "juo aamuun asti" |
| "get wasted/drunk/hammered/smashed/trashed" | "juo itsesi humalaan/känniin" |
| "power hour," "drink race," "drinking game" | "juomapeli," "juomakilpailu" |
| "beer pong," "shot challenge," "drink challenge" | "bisseturnaus," "shottikisa" |
| **Compound:** "keep them coming" + drink/alcohol context | "lisää tulee" + alcohol context |
| **Compound:** "never an empty glass" | "lasit täynnä koko illan" |
| **Compound:** "start early, stay late" + alcohol context | "aloita ajoissa, jatka myöhään" + alcohol |
| "the night is young, the drinks are flowing" | "ilta on nuori, juomat virtaavat" |
| "round for the group" + price (implies quantity purchase) | "kierros porukalle" + € |

### What should pass

| English | Finnish |
|---|---|
| "Extended evening service" | "Pidennetty illan palvelu" |
| "Full drinks menu available" | "Täysi juomalista saatavilla" |
| "Cocktail flight — three signature serves" | "Cocktail-maistelu — kolme talon erikoisuutta" |
| "Curated drinks menu," "Bar classics" | "Kuratoitu juomalista" |

---

## CATEGORY 3 — Appealing to Minors

**Law:** Alcohol Act §50(2) para 1
**Severity:** HIGH — BLOCK on match

### What to catch

| English | Finnish |
|---|---|
| "under 18," "underage," "teen" | "alle 18," "alaikäinen," "alaikä" |
| "student discount/price/special/deal/night" | "opiskelija-alennus/-tarjous/-hinta" |
| "high school," "back to school," "prom night" | "lukio," "kouluun paluu" |
| "graduation party/special/drink" | "valmistujaiset" + alcohol |
| "exam special/deal/discount" | "koejuhla" + alcohol |
| "school night/party/event/special" | "koulubileet" + alcohol |
| "cartoon character," "fairy tale" | "piirroshahmo," "satu" |
| "young crowd" + alcohol context | "nuori yleisö" + alcohol |
| **Compound:** "fresh out of school/college" + alcohol | "vastavalmistunut" + alcohol |

### What should pass

| English | Finnish |
|---|---|
| "Young adult offer (20+)" | "Nuorten aikuisten ilta (20+)" |
| "ID required," "Valid ID required" | "Henkilöllisyystodistus vaaditaan" |
| "Young professional gathering" | "Nuorten ammattilaisten tapaaminen" |
| "Adult evening" | "Aikuisten ilta" |

---

## CATEGORY 4 — Games, Contests & Prize Draws with Alcohol

**Law:** Alcohol Act §50(2) para 10
**Severity:** HIGH — BLOCK on match

### What to catch

| English | Finnish |
|---|---|
| "win free drinks/beer/wine/shots" | "voita ilmaiset juomat/oluet/viinit/shotit" |
| "prize draw" + alcohol term | "arvonta" + alcohol |
| "raffle" + alcohol | "arpajaiset" + alcohol |
| "giveaway" + alcohol | "arvonta/lahjoitus" + alcohol |
| "sweepstakes" + alcohol | "kilpailu" + alcohol |
| **Compound:** "winning team gets a round" | "voittajajoukkueelle kierros" |
| **Compound:** "prize at the bar" + alcohol context | "palkinto baarissa" + alcohol |
| **Compound:** "spin the wheel" + alcohol context | "onnenpyörä" + alcohol |
| "bottle for the winner" | "pullo voittajalle" |

### What should pass

| English | Finnish |
|---|---|
| "Trivia night — prizes for winning team" (no alcohol mention) | "Tietovisailta — palkinnot voittajille" |
| "Bingo evening — fun atmosphere" | "Bingoilta — hyvä tunnelma" |
| "Game night — bring your competitive spirit" | "Peli-ilta — tuo kilpailuhenkesi" |
| "Social evening with prizes" (non-alcohol prizes) | "Sosiaalinen ilta palkinnoilla" |

---

## CATEGORY 5 — Strong Alcohol Advertising (>22% ABV)

**Law:** Alcohol Act §50(1)
**Severity:** MEDIUM — FLAG, review needed

### What to catch

| English | Finnish |
|---|---|
| "vodka," "whiskey/whisky," "tequila" | "vodka," "viski," "tequila" |
| "cognac," "brandy" | "konjakki," "brandy" |
| "gin" in promotional context (not venue name) | "gini" in promotional context |
| "rum" + promotional language | "rommi" + promotional language |
| "schnapps," "Jägermeister/jager" | "snapsi," "Jägermeister" |
| "absinthe," "akvavit/aquavit" | "absintti," "akvaviitti" |
| "liquor," "shots" + promotional context | "viina," "shotit" + promotional context |
| "strong alcohol," "high ABV," "%" + alcohol + strength framing | "väkevä alkoholi," "korkea-%" |
| **Compound:** specific spirit brand names (Koskenkorva, Karhu, Koff, Lapin Kulta, Hartwall) in promotional context | Same names in promotional context |
| **Compound:** "X tasting" where X is a strong alcohol (unless clearly educational) | "X-maistelu" where X is strong alcohol |
| **Compound:** spirit name + price/€ | spirit name + price/€ |

### False-positive suppression

| Do NOT flag | Reason |
|---|---|
| "Whiskey Bar" / "Rum Bar" / "Viskibaari" when it's the venue's own name | Venue name, not promotion |
| "Gin & Tonic" on a permanent menu (not promotional) | Standard product listing |
| Non-alcohol "shots": "espresso shots," "ginger shots," "wheatgrass shots" | Not alcohol |

---

## CATEGORY 6 — Misleading Health Claims

**Law:** Alcohol Act §50(2) para 6
**Severity:** MEDIUM — FLAG, review needed

### What to catch

| English | Finnish |
|---|---|
| "healthy drink/cocktail/alcohol" | "terveellinen juoma/cocktail" |
| "low-calorie" + alcohol | "vähäkalorinen" + alcohol |
| "detox drink/cocktail" | "detox-juoma" |
| "health benefits," "good for you" | "terveyshyödyt," "hyväksi sinulle" |
| "nutritious" + alcohol | "ravitseva" + alcohol |
| "vitamin" + drink/cocktail | "vitamiini" + juoma |
| "immune boost/system" | "immuunijärjestelmä" |
| **Compound:** "clean," "pure," "natural" + alcohol (health halo) | "puhdas," "luonnollinen" + alcohol |
| **Compound:** "guilt-free" + alcohol/drinking | "syyttömyys" + alcohol |
| **Compound:** "body will thank you" + alcohol | "keho kiittää" + alcohol |

### What should pass

| English | Finnish |
|---|---|
| "Refreshing citrus blend" (flavor, not health) | "Raikas sitrussekoitus" |
| "Fresh ingredients" (culinary, not health) | "Tuoreet raaka-aineet" |
| "Light and crisp" (taste description) | "Kevyt ja raikas" (taste context only) |

---

## CATEGORY 7 — Consumer-Generated Content & Social Media Sharing

**Law:** Alcohol Act §50(2) para 11
**Severity:** MEDIUM — FLAG, review needed

### What to catch

| English | Finnish |
|---|---|
| "share your photo/pic/video/moment" | "jaa kuvasi/videosi/hetkesi" |
| "tag us" + alcohol context | "tägää meidät" + alcohol |
| "post your drink/beer/cocktail/shot" | "postaa juomasi/oluusi" |
| "follow us" + "for/to get free" + alcohol | "seuraa meitä" + "ilmainen" + alcohol |
| "repost" + alcohol | "jaa uudelleen" + alcohol |
| "share to win/get" | "jaa ja voita" |
| **Compound:** "show us your night" + alcohol context | "näytä iltasi" + alcohol |
| **Compound:** "send us your moments" + alcohol | "lähetä meille hetkesi" + alcohol |
| **Compound:** "we want to see your night" | "haluamme nähdä iltasi" |

### What should pass

| English | Finnish |
|---|---|
| "Visit us tonight" | "Vieraile tänä iltana" |
| "Book your table" | "Varaa pöytäsi" |
| "See our menu" | "Katso ruokalistamme" |
| "Join us this evening" | "Liity seuraamme tänä iltana" |

---

## CATEGORY 8 — Promising Social or Sexual Success

**Law:** Alcohol Act §50(2) para 5
**Severity:** MEDIUM — FLAG, review needed

### What to catch

| English | Finnish |
|---|---|
| "get lucky/laid" | "saada seuraa" |
| "pull tonight/someone" | "iskeä," "pokata" |
| "boost your confidence" | "lisää itseluottamusta" |
| "more attractive" | "viehättävämpi" |
| "be the life of the party" | "olla bileiden keskipiste" |
| "guaranteed fun/good time" + drink | "taattu hauskuus" + alcohol |
| "drink" + "confidence/charisma/charm" | "juoma" + "itseluottamus/karisma" |
| "alcohol" + "social/success/popular" | "alkoholi" + "sosiaalinen/menestys" |
| **Compound:** "where the night takes you" | "mihin ilta viekään" |
| **Compound:** "find your people" + alcohol context | "löydä seuraa" + alcohol |
| **Compound:** "tonight could be the night" + alcohol | "tänä iltana kaikki voi tapahtua" + alcohol |
| **Compound:** "make memories" + heavy alcohol framing | "tee muistoja" + alcohol framing |

### What should pass

| English | Finnish |
|---|---|
| "Great atmosphere" | "Loistava tunnelma" |
| "Social evening" | "Seurallinen ilta" |
| "Meet new people" (no alcohol link) | "Tapaa uusia ihmisiä" |
| "Lively venue," "Friendly crowd" | "Vilkas paikka," "Ystävällinen porukka" |

---

## CATEGORY 9 — Associating Alcohol with Operating Vehicles

**Law:** Alcohol Act §50(2) para 2
**Severity:** MEDIUM — FLAG, review needed

### What to catch

| English | Finnish |
|---|---|
| "designated driver," "DD special/discount" | "kuski" + alcohol special |
| "park and drink" | "parkkeeraa ja juo" |
| "drink and drive," "drive safe" + alcohol | "juo ja aja" |
| "car park" + alcohol context | "parkkipaikka" + alcohol |
| "boat" + alcohol special | "vene" + alcohol |
| **Compound:** "take the car — we'll get you a taxi back" (links driving to drinking logistics) | "tule autolla — tilaamme taksin" |
| **Compound:** "plenty of parking" + alcohol venue | "runsaasti parkkitilaa" + alcohol venue |

### What should pass

| English | Finnish |
|---|---|
| "Near public transport" | "Lähellä julkista liikennettä" |
| "Central location" | "Keskeinen sijainti" |
| "Easy to reach" | "Helposti saavutettavissa" |
| "Short walk from metro" | "Lyhyt kävely metrolta" |

---

## CATEGORY 10 — Highlighting Alcohol Content as a Positive Feature

**Law:** Alcohol Act §50(2) para 3
**Severity:** MEDIUM — FLAG, review needed

### What to catch

| English | Finnish |
|---|---|
| "high ABV," "high alcohol," "high proof" | "korkea-%," "vahva alkoholi" |
| "extra strong," "super strength" | "extra vahva," "super vahva" |
| "maximum strength," "strongest drink/cocktail" | "maksimi vahvuus," "vahvin drinkki" |
| "% + ABV/alcohol + strong/powerful" | "% + vahva/voimakas" |
| "more alcohol/kick/punch/buzz" | "enemmän alkoholia/potkua" |
| "potent/intense" + alcohol/drink | "voimakas/intensiivinen" + alcohol |
| **Compound:** "strong pours" + alcohol context | "vahvat kaadot" + alcohol |
| **Compound:** ABV % used as marketing hook (not standard menu listing) | % used as marketing hook |

### What should pass

| English | Finnish |
|---|---|
| "Bold flavor," "Rich character" | "Voimakas maku," "Rikas luonne" |
| "Complex profile," "Distinctive taste" | "Monimutkainen profiili" |
| "Full-bodied," "Carefully crafted" | "Täyteläinen," "Huolella valmistettu" |
| ABV listed in a standard menu (not promotional) | ABV listattu normaalilla ruokalistalla |

---

## CATEGORY 11 — Depicting Intoxication Positively

**Law:** Alcohol Act §50(2) para 1
**Severity:** MEDIUM — FLAG, review needed

### What to catch

| English | Finnish |
|---|---|
| "tipsy," "buzzed" | "hiprakka," "pienessä," "nousuhumalassa" |
| "get drunk/wasted/smashed/hammered" | "humalaan/känniin/päihinsä" |
| "drunk night/evening/party" | "känni-ilta," "räkäbileet" |
| "hangover cure/remedy/special" | "krapulalääke/-parannus" |
| "hair of the dog" | "krapularyyppy," "korjaussarja" |
| "day drinking," "pregame/pre-game" | "päiväkännit," "etkot" + alcohol |
| **Compound:** "feeling good tonight" + alcohol | "hyvä fiilis" + alcohol |
| **Compound:** "let loose" + alcohol context | "päästä irti" + alcohol |
| **Compound:** "get your weekend started right" + alcohol | "aloita viikonloppu oikein" + alcohol |
| **Compound:** "nollaus," "reset" + alcohol (implies using alcohol to recover) | "nollaus" + alcohol |

### What should pass

| English | Finnish |
|---|---|
| "Evening out," "Night out" | "Ilta ulkona" |
| "Social gathering," "Relaxed evening" | "Sosiaalinen kokoontuminen," "Rento ilta" |
| "Good company," "Quality time" | "Hyvää seuraa," "Laatuaikaa" |

---

## CATEGORY 12 — Suggestive Price Language & Quantity-Based Promotion

**Law:** Alcohol Act §50(2) para 7, §51
**Severity:** LOW — Advisory warning

### What to catch

| English | Finnish |
|---|---|
| "cheapest drinks/beer/alcohol" | "halvimmat juomat/oluet" |
| "lowest price," "best deal," "bargain" + alcohol | "halvin hinta," "paras diili" + alcohol |
| "discount drinks/alcohol" | "alennus" + alcohol |
| "reduced price," "special offer" + alcohol | "alennettu hinta," "erikoistarjous" + alcohol |
| "bucket of beer/drinks" | "sanko," "ämpäri" + olut |
| "pitcher deal/special/offer" | "tuoppi" + tarjous |
| "tower of beer/drinks" | "juomatorni" |
| "6-pack," "party pack" | "6-pakkaus," "bilepakkaus" |
| "drink package" | "juomapaketti" |
| "multiple drinks/shots" | "monta juomaa/shottia" |
| "stamp card" + drink/beer/free | "leimakortti" + alcohol |
| "loyalty" + drink/beer/alcohol + free | "kanta-asiakas" + alcohol + ilmainen |
| **Compound:** quantity number + container + price (e.g., "6 beers for €25") | "6 olutta 25€" |
| **Compound:** "bottle service" + promotional framing | "pullopalvelu" + promotional framing |

### What should pass

| English | Finnish |
|---|---|
| "Beer selection," "Craft beer flight" | "Olutvalikoima," "Maisteluflight" |
| "Tasting board," "Curated selection" | "Maistelulauta," "Kuratoitu valikoima" |
| "Value selection," "Featured pricing" (not alcohol-specific) | "Hinta-laatusuhde," "Päivän valikoima" |

---

## CATEGORY 13 — Overall Impression & Combined Messages

**Law:** Alcohol Act §50(2) — "contrary to good practice" provision
**Severity:** Cannot be caught by regex — AI + human review layer

### What to evaluate

| Check | Description |
|---|---|
| Event + promotion combined impression | If a bar posts both an event and a promotion visible together in the feed, does the combination violate rules? |
| Image + text combined impression | Does a compliant image with compliant text create a non-compliant overall message? |
| Cumulative daily drinking framing | Does the content normalize or encourage daily alcohol consumption across multiple pieces of content? |
| Venue identity evasion | Does the bar use a venue name or category to circumvent restrictions (e.g., naming a shot promotion "Espresso Hour")? |
| Competitive/superlative language | "Best bar in Helsinki," "voted #1" — scrutinized under good practice provision |
| Language mixing to evade | Does the content mix English and Finnish specifically to evade detection in either language? |

---

## CATEGORY 14 — Image Content Validation

**Severity:** HIGH — must be checked post-generation

### What to check in generated images

| Risk signal | English prompt terms | Finnish prompt terms |
|---|---|---|
| People visibly intoxicated | "drunk," "wasted," "party hard," "wild night" | "humalassa," "kännissä," "bileet," "villi ilta" |
| Drinking as primary focus | "shots," "drinking," "cheers," "toast," "round of drinks" | "shotit," "juominen," "kippis," "malja," "kierros" |
| Quantity displays | "bucket," "tower," "line of shots," "full table of drinks" | "sanko," "torni," "rivi shotteja," "pöytä täynnä juomia" |
| Text in image promoting alcohol | "sign," "banner," "menu board," "chalkboard" + alcohol terms | "kyltti," "banneri," "menu," "liitutaulu" + alcohol |
| Underage-appearing people | "young," "teen," "college," "student" + alcohol context | "nuori," "teini," "opiskelija" + alcohol |
| Celebration framing with excess | "celebration," "blowout," "raging," "epic night" | "juhla," "bileet," "räjähtävä," "eeppinen ilta" |

---

## CATEGORY 15 — Venue Profile & Edited Content

**Severity:** HIGH — must be checked at these touchpoints

| Touchpoint | What to scan | When |
|---|---|---|
| Bar profile creation | `bar.name`, `bar.description` | On create and edit |
| Event creation | `event.title`, `event.description` | On create |
| Event edit | `event.title`, `event.description` | On edit |
| Promotion creation | `promotion.title`, `promotion.description` | On create |
| Promotion edit | `promotion.title`, `promotion.description` | On edit |
| AI generation output | Every variant's `title` and `description` | Before returning to client |
| AI suggest-fix output | Every alternative | Before returning (filter HIGH violations) |
| Image generation output | Final prompt + image metadata | After generation |
| Campaign creation | Campaign title, description | On create |
| Consumer feed rendering | Combined event + promotion pairs from same bar | Read-time check (advisory) |

---

## Implementation notes

1. **Every category above needs both English and Finnish patterns.** Finnish patterns are marked in the tables above. The engine must check both `patterns[]` and `patternsFi[]` for every rule.

2. **Compound checks** (marked "Compound:") scan for two or more terms within N words of each other. These catch circumventions where every individual word is approved but the combination is non-compliant.

3. **False-positive suppression** must be applied before flagging:
   - Venue names containing alcohol terms (check against authenticated bar name)
   - Non-alcohol uses of "shots" (espresso, ginger, wheatgrass)
   - Food-only "happy hour" with no alcohol terms in surrounding 50 characters
   - Standard menu ABV listings (not promotional)

4. **Categories 1-12** are implementable as regex + compound checks. **Category 13** requires AI or human review. **Category 14** requires image validation. **Category 15** is a wiring checklist.

5. **The AI system prompt** must include every category above in both languages, with the DO/DON'T lists and compound warnings. The Finnish compliance block must be injected when the user's prompt language is Finnish.
