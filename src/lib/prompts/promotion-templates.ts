// src/lib/prompts/promotion-templates.ts
// ============================================================================
// PROMOTION TEMPLATES — Tone-adaptive, compliance-safe, venue-aware.
//
// Each template provides a concept skeleton (WHAT the promotion is about).
// The selected tone provides voice rules (HOW it's written).
// Finnish alcohol marketing compliance is baked into every template.
// ============================================================================

import { getTonePromptBlock, type ContentTone } from "./tone-voices";

// ---- Types ----

export type TemplateCategory =
  | "universal"
  | "social"
  | "food"
  | "entertainment"
  | "premium"
  | "community";

export interface PromotionTemplate {
  id: string;
  category: TemplateCategory;
  /** Bar types this template suits (empty = all). Values match Bar.type in Prisma. */
  suitableFor: string[];
  label: { en: string; fi: string };
  /** The core concept — what the event IS, in neutral language. The tone will style it. */
  conceptPrompt: { en: string; fi: string };
  /** Finnish alcohol law guardrails specific to this template type. */
  complianceNotes: { en: string; fi: string };
}

// ---- Template definitions ----

const FINNISH_ALCOHOL_COMPLIANCE_BASE = {
  en: `FINNISH ALCOHOL MARKETING COMPLIANCE: Do not encourage excessive drinking. Do not suggest alcohol solves problems or improves social status. Do not target minors. Do not link alcohol to driving or operating machinery. Do not use aggressive sales tactics or "drink more" messaging. Price mentions must be factual, not promotional.`,
  fi: `SUOMEN ALKOHOLIMARKKINOINNIN SÄÄNNÖT: Älä kannusta liialliseen juomiseen. Älä vihjaa alkoholin ratkaisevan ongelmia tai parantavan sosiaalista asemaa. Älä kohdista alaikäisille. Älä yhdistä alkoholia ajamiseen. Älä käytä aggressiivisia myyntikeinoja tai "juo enemmän" -viestejä. Hintamaininnat vain toteavasti, ei mainosluonteisesti.`,
};

export const PROMOTION_TEMPLATES: PromotionTemplate[] = [
  // =========================================================================
  // UNIVERSAL — all bar types
  // =========================================================================
  {
    id: "after-work",
    category: "universal",
    suitableFor: [],
    label: { en: "After-Work", fi: "After-Work" },
    conceptPrompt: {
      en: "An after-work gathering. The transition from workday to evening — the first drink, the decompression, the shift in energy. Focus on the moment of arrival: stepping through the door and leaving the day behind.",
      fi: "After-work-kokoontuminen. Siirtymä työpäivästä iltaan — ensimmäinen juoma, rentoutuminen, energian muutos. Keskity saapumisen hetkeen: oven avaamiseen ja työpäivän taakse jättämiseen.",
    },
    complianceNotes: {
      en: "Do not frame alcohol as a reward for completing work. Do not suggest drinking is necessary to unwind. Keep the focus on atmosphere, company, and the time of day — not the volume of consumption.",
      fi: "Älä kehystä alkoholia palkkiona työn suorittamisesta. Älä vihjaa juomisen olevan välttämätöntä rentoutumiseen. Pidä fokus tunnelmassa, seurassa ja ajankohdassa — älä kulutuksen määrässä.",
    },
  },
  {
    id: "weekend-special",
    category: "universal",
    suitableFor: [],
    label: { en: "Weekend Special", fi: "Viikonlopputarjous" },
    conceptPrompt: {
      en: "A weekend offering — Friday or Saturday, when the city is out and the energy is high. The bar at its best: full room, great atmosphere, the weekend in full swing.",
      fi: "Viikonlopun tarjonta — perjantai tai lauantai, kun kaupunki on liikkeellä ja energia korkealla. Baari parhaimmillaan: täysi huone, loistava tunnelma, viikonloppu täydessä vauhdissa.",
    },
    complianceNotes: {
      en: "Do not promote binge drinking or 'big night out' framing. Do not suggest that the weekend is for excessive consumption. Keep energy positive but measured.",
      fi: "Älä mainosta ryyppäämistä tai 'iso ilta ulkona' -kehystystä. Älä vihjaa viikonlopun olevan liiallista kulutusta varten. Pidä energia positiivisena mutta hillittynä.",
    },
  },
  {
    id: "seasonal-special",
    category: "universal",
    suitableFor: [],
    label: { en: "Seasonal Special", fi: "Kausierikoinen" },
    conceptPrompt: {
      en: "Something that only makes sense right now. A seasonal ingredient, a weather-dependent offering, a limited-time reason to visit. The bar responding to the season — terrace in summer, mulled wine in winter, fresh flavors in spring.",
      fi: "Jotain mikä on järkevää vain juuri nyt. Kausiluonteinen raaka-aine, sääriippuvainen tarjonta, rajoitetun ajan syy vierailla. Baari vastaa vuodenaikaan — terassi kesällä, glögi talvella, tuoreita makuja keväällä.",
    },
    complianceNotes: {
      en: "Seasonal alcohol references (glögi, terrace drinks) must not dominate the message. Keep food and atmosphere equally prominent. Do not suggest drinking more because of the season.",
      fi: "Kausiluonteiset alkoholiviittaukset (glögi, terassijuomat) eivät saa hallita viestiä. Pidä ruoka ja tunnelma yhtä näkyvillä. Älä vihjaa juomista enemmän vuodenajan takia.",
    },
  },
  {
    id: "regulars-night",
    category: "universal",
    suitableFor: [],
    label: { en: "Regulars' Night", fi: "Kanta-asiakasilta" },
    conceptPrompt: {
      en: "A night for the people who keep coming back. The regulars, the familiar faces, the ones who know the bartender's name. A thank-you, not a promotion. Loyalty rewarded with something genuine, not gimmicky.",
      fi: "Ilta niille, jotka palaavat aina. Kanta-asiakkaat, tutut kasvot, ne jotka tietävät baarimikon nimen. Kiitos, ei mainos. Uskollisuus palkittu jollain aidolla, ei kikalla.",
    },
    complianceNotes: {
      en: "Loyalty programs involving alcohol must not incentivize increased consumption. Rewards should focus on experience, not volume. Do not frame this as a drinking challenge.",
      fi: "Alkoholiin liittyvät kanta-asiakasohjelmat eivät saa kannustaa lisääntyneeseen kulutukseen. Palkkioiden tulee keskittyä kokemukseen, ei määrään. Älä kehystä tätä juomahaasteena.",
    },
  },

  // =========================================================================
  // SOCIAL — group activities, shared experiences
  // =========================================================================
  {
    id: "quiz-night",
    category: "social",
    suitableFor: ["PUB", "SPORTS_BAR", "LOUNGE"],
    label: { en: "Quiz Night", fi: "Tietovisailta" },
    conceptPrompt: {
      en: "Teams compete, brains are tested, and strangers become teammates over trivia and drinks. A weekly ritual where the questions matter less than the company. Describe the friendly rivalry, the surprise answers, the shared groan at a missed question.",
      fi: "Joukkueet kilpailevat, aivot ovat koetuksella, ja tuntemattomista tulee joukkuetovereita trivian ja juomien äärellä. Viikoittainen rituaali, jossa kysymykset merkitsevät vähemmän kuin seura. Kuvaile ystävällistä kilpailua, yllättäviä vastauksia, jaettua huokausta väärästä vastauksesta.",
    },
    complianceNotes: {
      en: "Do not frame drinking as part of the competition. Do not offer alcohol as a prize. Keep quiz and drinks as parallel activities, not linked ones.",
      fi: "Älä kehystä juomista osana kilpailua. Älä tarjoa alkoholia palkintona. Pidä visa ja juomat rinnakkaisina aktiviteetteina, ei linkitettyinä.",
    },
  },
  {
    id: "karaoke-night",
    category: "social",
    suitableFor: ["PUB", "KARAOKE", "LOUNGE"],
    label: { en: "Karaoke Night", fi: "Karaoke-ilta" },
    conceptPrompt: {
      en: "The microphone is open and the stage belongs to everyone. Courage, surprise talent, and the shared joy of singing together — badly or brilliantly. An audience that becomes the entertainment.",
      fi: "Mikki on auki ja lava kuuluu kaikille. Rohkeutta, yllättävää lahjakkuutta ja jaettua laulamisen iloa — huonosti tai loistavasti. Yleisö, josta tulee viihde.",
    },
    complianceNotes: {
      en: "Do not suggest alcohol as courage fuel ('liquid courage'). Do not frame drinking as necessary for stage confidence. Keep the focus on music and performance.",
      fi: "Älä vihjaa alkoholia rohkaisuksi ('nestemäinen rohkeus'). Älä kehystä juomista välttämättömäksi lavaluottamukselle. Pidä fokus musiikissa ja esiintymisessä.",
    },
  },
  {
    id: "group-celebration",
    category: "social",
    suitableFor: [],
    label: { en: "Group Celebration", fi: "Ryhmäjuhla" },
    conceptPrompt: {
      en: "A celebration built for groups — birthdays, promotions, reunions, or just because. The bar as the backdrop for life's moments. Reserved tables, shared platters, a night organized so the hosts can actually enjoy themselves.",
      fi: "Juhla rakennettu ryhmille — syntymäpäivät, ylennykset, tapaamiset, tai ihan muuten vaan. Baari elämän hetkien taustana. Varatut pöydät, jaetut tarjoilut, ilta järjestetty niin että isännätkin voivat nauttia.",
    },
    complianceNotes: {
      en: "Group packages must not incentivize per-person consumption targets. Avoid 'bottomless' or 'all you can drink' framing. Emphasize the occasion, not the alcohol volume.",
      fi: "Ryhmäpaketit eivät saa kannustaa henkilökohtaisiin kulutustavoitteisiin. Vältä 'pohjaton' tai 'niin paljon kuin juot' -kehystystä. Korosta tilaisuutta, älä alkoholin määrää.",
    },
  },
  {
    id: "industry-night",
    category: "social",
    suitableFor: ["COCKTAIL_BAR", "PUB", "LOUNGE"],
    label: { en: "Industry Night", fi: "Alan ilta" },
    conceptPrompt: {
      en: "A night for the people who work in hospitality — the bartenders, servers, chefs, and managers who spend their nights serving others, finally getting a night of their own. Industry discounts, familiar faces, a chance to be on the other side of the bar.",
      fi: "Ilta ravintola-alan työntekijöille — baarimikot, tarjoilijat, kokit ja esimiehet, jotka viettävät iltansa palvellen muita, saavat vihdoin oman iltansa. Alennukset, tutut kasvot, mahdollisuus olla baarin toisella puolella.",
    },
    complianceNotes: {
      en: "Industry discounts on alcohol must be moderate and not encourage post-shift binge drinking. Frame as community-building, not consumption-driven. Do not glamorize using alcohol to cope with work stress.",
      fi: "Alan alennukset alkoholista on oltava maltillisia eivätkä saa kannustaa työvuoron jälkeiseen ryyppäämiseen. Kehystä yhteisön rakentamisena, ei kulutusvetoisena. Älä glamourioi alkoholin käyttöä työstressin käsittelyyn.",
    },
  },

  // =========================================================================
  // FOOD — kitchen-driven offerings
  // =========================================================================
  {
    id: "tasting-menu",
    category: "food",
    suitableFor: ["COCKTAIL_BAR", "WINE_BAR", "LOUNGE"],
    label: { en: "Tasting Menu", fi: "Maistelumenu" },
    conceptPrompt: {
      en: "A guided tasting experience — courses paired with drinks, each one building on the last. The kitchen and bar working together. Limited seats, curated progression, a journey for the senses led by someone who knows their craft.",
      fi: "Opastettu maistelukokemus — annoksia ja juomia pareittain, jokainen rakentuen edellisen päälle. Keittiö ja baari yhteistyössä. Rajoitetut paikat, kuratoitu eteneminen, aistikokemus jonkun asiantuntevan johdolla.",
    },
    complianceNotes: {
      en: "Food must be the primary focus, not the alcohol pairing. Do not suggest drinking is the main event. Each course should feature the food first.",
      fi: "Ruoan tulee olla ensisijainen fokus, ei alkoholiparin. Älä vihjaa juomisen olevan päätapahtuma. Jokaisen annoksen tulee esitellä ruoka ensin.",
    },
  },
  {
    id: "food-drink-pairing",
    category: "food",
    suitableFor: ["COCKTAIL_BAR", "WINE_BAR", "PUB"],
    label: { en: "Food & Drink Pairing", fi: "Ruoka & juoma -yhdistelmä" },
    conceptPrompt: {
      en: "A dish and its perfect drink partner — chosen by someone who understands both. The interplay of flavors, the craft behind each element, the satisfaction of a pairing that makes both better than they were alone.",
      fi: "Annos ja sen täydellinen juomakumppani — valittuna jonkun toimesta, joka ymmärtää molempia. Makujen vuorovaikutus, käsityö jokaisen elementin takana, yhdistelmän tyydytys joka tekee molemmista parempia kuin ne olisivat yksin.",
    },
    complianceNotes: {
      en: "The drink is the accompaniment, not the reason. Describe the pairing as complementary — do not suggest the food exists to sell drinks. Do not imply you need alcohol to enjoy the meal.",
      fi: "Juoma on lisäke, ei syy. Kuvaile yhdistelmää täydentävänä — älä vihjaa ruoan olevan olemassa juomien myymiseksi. Älä implikoi tarvitsevasi alkoholia nauttiaksesi ateriasta.",
    },
  },
  {
    id: "chefs-special",
    category: "food",
    suitableFor: [],
    label: { en: "Chef's Special", fi: "Kokin suositus" },
    conceptPrompt: {
      en: "The kitchen is showing off. A dish worth planning your evening around — seasonal ingredients, bold technique, the kind of meal that reminds you why you go out to eat. Available for a limited time, because the best ingredients don't wait.",
      fi: "Keittiö näyttää osaamistaan. Annos, jonka ympärille kannattaa suunnitella ilta — kausiraaka-aineita, rohkeaa tekniikkaa, ateria joka muistuttaa miksi syödään ulkona. Saatavilla rajoitetun ajan, koska parhaat raaka-aineet eivät odota.",
    },
    complianceNotes: {
      en: "Food-first messaging. Any drink mention must be a natural accompaniment suggestion, not a sales pitch. Do not use food as a vehicle for alcohol promotion.",
      fi: "Ruoka edellä -viestintä. Juomamaininnan on oltava luonnollinen lisäke-ehdotus, ei myyntipuhe. Älä käytä ruokaa alkoholin mainostamisen välineenä.",
    },
  },
  {
    id: "brunch-service",
    category: "food",
    suitableFor: ["LOUNGE", "COCKTAIL_BAR", "PUB"],
    label: { en: "Brunch / Day Service", fi: "Brunssi / Päivätarjoilu" },
    conceptPrompt: {
      en: "The bar opens early. A different energy — daylight through the windows, coffee and pastries, a slower pace than the night shift. The same space, a completely different personality. Weekend mornings with food, drinks that suit the hour, and no rush.",
      fi: "Baari avautuu aikaisin. Eri energia — päivänvalo ikkunoista, kahvia ja leivonnaisia, hitaampi tahti kuin yövuorossa. Sama tila, täysin eri persoonallisuus. Viikonloppuaamuja ruoan kera, kellonaikaan sopivia juomia, ei kiirettä.",
    },
    complianceNotes: {
      en: "Daytime alcohol (brunch cocktails, sparkling wine) must be secondary to food. Do not frame daytime drinking as glamorous or aspirational. Coffee and non-alcoholic options must be equally prominent.",
      fi: "Päiväaikainen alkoholi (brunssicocktailit, kuohuviini) on oltava toissijaista ruokaan nähden. Älä kehystä päiväjuomista glamourina tai tavoittelemisen arvoisena. Kahvi ja alkoholittomat vaihtoehdot on oltava yhtä näkyvillä.",
    },
  },

  // =========================================================================
  // ENTERTAINMENT — performance, music, spectacle
  // =========================================================================
  {
    id: "live-music",
    category: "entertainment",
    suitableFor: ["LIVE_MUSIC", "PUB", "LOUNGE", "COCKTAIL_BAR"],
    label: { en: "Live Music", fi: "Elävä musiikki" },
    conceptPrompt: {
      en: "Music takes over the room. The first chord, the shifting crowd, the shared experience of live sound. A performer, an audience, and the moment when everything else fades away. Describe the artist, the atmosphere, the unique energy of live performance.",
      fi: "Musiikki valtaa tilan. Ensimmäinen sointu, liikkuva yleisö, jaettu live-äänen kokemus. Esiintyjä, yleisö, ja hetki jolloin kaikki muu katoaa. Kuvaile artistia, tunnelmaa, live-esiintymisen ainutlaatuista energiaa.",
    },
    complianceNotes: {
      en: "Music is the headline, not the drinks. Alcohol is part of the atmosphere, not the reason to attend. Do not suggest drinking enhances the musical experience.",
      fi: "Musiikki on pääasia, ei juomat. Alkoholi on osa tunnelmaa, ei syy tulla. Älä vihjaa juomisen parantavan musiikkielämystä.",
    },
  },
  {
    id: "dj-night",
    category: "entertainment",
    suitableFor: ["NIGHTCLUB", "LOUNGE", "COCKTAIL_BAR"],
    label: { en: "DJ Night", fi: "DJ-ilta" },
    conceptPrompt: {
      en: "The DJ takes control of the room. Beats build, the crowd moves, the night finds its rhythm. A journey through sound — from warm-up to peak to the moment the lights come on and nobody wants to leave. Describe the energy, the dance floor, the shared pulse of the room.",
      fi: "DJ ottaa tilan haltuun. Biitit rakentuvat, yleisö liikkuu, ilta löytää rytminsä. Matka äänen läpi — lämppäristä huipennukseen siihen hetkeen kun valot syttyvät eikä kukaan halua lähteä. Kuvaile energiaa, tanssilattiaa, huoneen jaettua sykettä.",
    },
    complianceNotes: {
      en: "Music-driven, not alcohol-driven. The DJ is the draw. Do not suggest alcohol is needed to enjoy the music or dance. Do not glamorize late-night excess.",
      fi: "Musiikkivetoista, ei alkoholivetoista. DJ on vetonaula. Älä vihjaa alkoholia tarvittavan musiikista tai tanssimisesta nauttimiseen. Älä glamourioi myöhäisillan ylilyöntejä.",
    },
  },
  {
    id: "sports-screening",
    category: "entertainment",
    suitableFor: ["SPORTS_BAR", "PUB"],
    label: { en: "Sports Screening", fi: "Urheilulähetys" },
    conceptPrompt: {
      en: "The big game on the big screen. Collective tension, shared cheers, an entire room experiencing the same moment together. The match, the atmosphere, the energy of watching something that matters with people who care just as much.",
      fi: "Iso peli isolla ruudulla. Kollektiivinen jännitys, jaetut hurraukset, koko huone kokemassa saman hetken yhdessä. Ottelu, tunnelma, energia siitä kun katsoo jotain merkityksellistä ihmisten kanssa jotka välittävät yhtä paljon.",
    },
    complianceNotes: {
      en: "Sports is the focus. Drinks are refreshment, not the event. Do not link alcohol consumption to team support or game outcomes. Do not encourage drinking games tied to match events.",
      fi: "Urheilu on fokus. Juomat ovat virvokkeita, eivät tapahtuma. Älä linkitä alkoholin kulutusta joukkueen kannattamiseen tai pelin tuloksiin. Älä kannusta juomapeleihin ottelutapahtumiin liitettynä.",
    },
  },
  {
    id: "open-mic",
    category: "entertainment",
    suitableFor: ["PUB", "LOUNGE", "LIVE_MUSIC"],
    label: { en: "Open Mic / Showcase", fi: "Avoin mikki / Showcase" },
    conceptPrompt: {
      en: "The stage is open for anyone with something to share. Musicians trying new material, poets reading for the first time, comedians testing jokes. Raw talent, unexpected moments, and a supportive crowd. A platform for voices that deserve to be heard.",
      fi: "Lava on avoin kaikille, joilla on jotain jaettavaa. Muusikot kokeilemassa uutta materiaalia, runoilijat lukemassa ensimmäistä kertaa, koomikot testaamassa vitsejä. Raakaa lahjakkuutta, odottamattomia hetkiä, ja kannustava yleisö. Alusta äänille, jotka ansaitsevat tulla kuulluiksi.",
    },
    complianceNotes: {
      en: "Performance is the draw. Alcohol is part of the venue experience, not a prerequisite for participation or enjoyment. Do not suggest performers need a drink before going on stage.",
      fi: "Esiintyminen on vetonaula. Alkoholi on osa tilan kokemusta, ei edellytys osallistumiselle tai nauttimiselle. Älä vihjaa esiintyjien tarvitsevan juomaa ennen lavalle menoa.",
    },
  },

  // =========================================================================
  // PREMIUM — craft, expertise, elevated experiences
  // =========================================================================
  {
    id: "cocktail-masterclass",
    category: "premium",
    suitableFor: ["COCKTAIL_BAR", "LOUNGE"],
    label: { en: "Cocktail Masterclass", fi: "Cocktail-mestarikurssi" },
    conceptPrompt: {
      en: "Behind the bar, not in front of it. A hands-on session led by someone who knows their craft — ingredients, technique, the stories behind the spirits. Guests learn to make, not just to drink. Limited spots, proper tools, something to take home beyond a receipt.",
      fi: "Baarin takana, ei sen edessä. Käytännönläheinen sessio jonkun asiantuntevan johdolla — raaka-aineet, tekniikka, tarinat juomien takana. Vieraat oppivat tekemään, eivät vain juomaan. Rajoitetut paikat, kunnon välineet, jotain kotiin vietävää kuitin lisäksi.",
    },
    complianceNotes: {
      en: "Educational framing: the focus is on craft and knowledge, not consumption. Tasting portions must be moderate. Do not frame this as an opportunity to drink heavily while learning.",
      fi: "Opetuksellinen kehystys: fokus on käsityössä ja tiedossa, ei kulutuksessa. Maisteluannosten on oltava maltillisia. Älä kehystä tätä tilaisuutena juoda runsaasti oppimisen varjolla.",
    },
  },
  {
    id: "meet-the-maker",
    category: "premium",
    suitableFor: ["COCKTAIL_BAR", "WINE_BAR", "PUB"],
    label: { en: "Meet the Maker", fi: "Tapaa tekijä" },
    conceptPrompt: {
      en: "The person behind the product, in the room. A distiller, brewer, or winemaker sharing their craft, their process, their philosophy. Tasting with context — each sip understood, not just consumed. An evening of stories and expertise, not just service.",
      fi: "Henkilö tuotteen takana, huoneessa. Tislaaja, panija tai viinintekijä jakamassa käsityötään, prosessiaan, filosofiaansa. Maistelua kontekstilla — jokainen siemaus ymmärrettynä, ei vain kulutettuna. Ilta tarinoita ja asiantuntemusta, ei vain palvelua.",
    },
    complianceNotes: {
      en: "Educational, not promotional. The maker's presence is about knowledge sharing, not sales. Tasting portions must be moderate. Frame as cultural experience, not drinking event.",
      fi: "Opetuksellinen, ei mainoksellinen. Tekijän läsnäolo on tiedon jakamista, ei myyntiä. Maisteluannosten on oltava maltillisia. Kehystä kulttuurikokemuksena, ei juomatapahtumana.",
    },
  },
  {
    id: "private-tasting",
    category: "premium",
    suitableFor: ["WINE_BAR", "COCKTAIL_BAR", "LOUNGE"],
    label: { en: "Private Tasting", fi: "Yksityinen maistelu" },
    conceptPrompt: {
      en: "A focused tasting for a small group. Rare bottles, guided exploration, an intimate setting where every pour has a story. Not a bar service — a curated journey through a specific region, style, or era. For people who want to go deeper, not louder.",
      fi: "Keskittynyt maistelu pienelle ryhmälle. Harvinaisia pulloja, opastettu tutkimusmatka, intiimi ympäristö jossa jokaisella kaadolla on tarina. Ei baaripalvelua — kuratoitu matka tietyn alueen, tyylin tai aikakauden läpi. Ihmisille jotka haluavat mennä syvemmälle, eivät kovemmalle.",
    },
    complianceNotes: {
      en: "Small pours, educational focus. The value is in the knowledge and rarity, not the volume. Never frame as 'all you can drink' or unlimited tasting. Water and palate cleansers must be provided and mentioned.",
      fi: "Pienet kaadot, opetuksellinen fokus. Arvo on tiedossa ja harvinaisuudessa, ei määrässä. Älä koskaan kehystä 'niin paljon kuin juot' tai rajattomana maisteluna. Vesi ja makupuhdistajat on tarjottava ja mainittava.",
    },
  },
  {
    id: "rare-release",
    category: "premium",
    suitableFor: ["COCKTAIL_BAR", "WINE_BAR", "PUB"],
    label: { en: "Rare Release / Tap Takeover", fi: "Harvinainen erä / Hana haltuun" },
    conceptPrompt: {
      en: "Something that won't be here long. A limited-release beer, a single-barrel spirit, a small-batch product available only until it's gone. The appeal is the moment — you had to be there. Describe the product, its origin, what makes it special, and the fleeting nature of the opportunity.",
      fi: "Jotain mikä ei ole täällä pitkään. Rajoitettu erä olutta, yhden tynnyrin viinaa, pienierätuote saatavilla vain kunnes se loppuu. Vetovoima on hetkessä — piti olla paikalla. Kuvaile tuotetta, sen alkuperää, mikä tekee siitä erityisen, ja tilaisuuden hetkellisyyttä.",
    },
    complianceNotes: {
      en: "Scarcity framing must not create urgency to drink more or faster. 'Limited availability' refers to the product's rarity, not a reason to overconsume. One serving per customer is appropriate messaging.",
      fi: "Niukkuuskehystys ei saa luoda kiirettä juoda enemmän tai nopeammin. 'Rajoitettu saatavuus' viittaa tuotteen harvinaisuuteen, ei syyhyn ylikuluttaa. Yksi annos asiakasta kohden on sopiva viesti.",
    },
  },

  // =========================================================================
  // COMMUNITY — neighbourhood, local, belonging
  // =========================================================================
  {
    id: "neighbourhood-night",
    category: "community",
    suitableFor: ["PUB", "LOUNGE", "SPORTS_BAR"],
    label: { en: "Neighbourhood Night", fi: "Naapuruston ilta" },
    conceptPrompt: {
      en: "For the people who live around the corner. Not a destination — a local. The bar as the third place between home and work, where the bartender knows your order and the person next to you might live on your street. A night celebrating the neighbourhood, no tourist pitch, no hype.",
      fi: "Niille, jotka asuvat kulman takana. Ei kohde — vaan lähibaari. Baari kolmantena paikkana kodin ja työn välillä, jossa baarimikko tietää tilauksesi ja vierustoveri saattaa asua kadullasi. Ilta juhlien naapurustoa, ei turistipuhetta, ei hypetystä.",
    },
    complianceNotes: {
      en: "Community, not consumption. Frame the bar as a gathering place, not a drinking destination. Emphasize social connection over alcohol. Do not use 'local' as code for 'drink heavily among neighbours.'",
      fi: "Yhteisö, ei kulutus. Kehystä baari kokoontumispaikkana, ei juomakohteena. Korosta sosiaalista yhteyttä alkoholin sijaan. Älä käytä 'paikallinen' koodina 'juo runsaasti naapureiden kesken.'",
    },
  },
  {
    id: "local-artist",
    category: "community",
    suitableFor: ["PUB", "LOUNGE", "COCKTAIL_BAR", "LIVE_MUSIC"],
    label: { en: "Local Artist Showcase", fi: "Paikallistaiteilijan esittely" },
    conceptPrompt: {
      en: "The walls become a gallery. A local artist's work on display — paintings, photography, installations — transforming the bar into something more. Art that changes monthly, conversations that start because of what's on the wall. The bar as a platform for local creativity.",
      fi: "Seinistä tulee galleria. Paikallisen taiteilijan töitä esillä — maalauksia, valokuvia, installaatioita — muuntaen baarin joksikin enemmäksi. Taidetta joka vaihtuu kuukausittain, keskusteluja jotka alkavat siitä mitä seinällä on. Baari alustana paikalliselle luovuudelle.",
    },
    complianceNotes: {
      en: "Art is the focus. Alcohol is the venue's normal offering, not the theme. Do not link art appreciation to drinking. Opening night events must center the artist, not the bar's drink specials.",
      fi: "Taide on fokus. Alkoholi on tilan normaali tarjonta, ei teema. Älä linkitä taiteen arvostusta juomiseen. Avajaistapahtumien on keskitettävä taiteilijaan, ei baarin juomatarjouksiin.",
    },
  },
  {
    id: "charity-fundraiser",
    category: "community",
    suitableFor: [],
    label: { en: "Charity / Fundraiser", fi: "Hyväntekeväisyys / Keräys" },
    conceptPrompt: {
      en: "A night where the bar gives back. Proceeds or a portion of sales going to a local cause — a shelter, a community project, a youth program. Drinking that does something. Describe the cause, the impact, and how showing up makes a difference beyond the bar.",
      fi: "Ilta jolloin baari antaa takaisin. Tuotto tai osa myynnistä menee paikalliseen kohteeseen — turvakoti, yhteisöprojekti, nuoriso-ohjelma. Juominen joka tekee jotain. Kuvaile kohdetta, vaikutusta, ja miten paikalle tuleminen vaikuttaa baarin ulkopuolella.",
    },
    complianceNotes: {
      en: "Charity framing must not exploit a cause to sell alcohol. The donation mechanism must be transparent and not tied to individual drink purchases (e.g., '% of evening's total', not '€1 per drink'). Do not suggest drinking more = giving more.",
      fi: "Hyväntekeväisyyskehystys ei saa hyödyntää kohdetta alkoholin myymiseksi. Lahjoitusmekanismin on oltava läpinäkyvä eikä sidottu yksittäisiin juomaostoihin (esim. '% illan kokonaismyynnistä', ei '1€ per juoma'). Älä vihjaa juomisen enemmän = antamisen enemmän.",
    },
  },
  {
    id: "new-in-town",
    category: "community",
    suitableFor: [],
    label: { en: "New in Town / Welcome", fi: "Uusi kaupungissa / Tervetuloa" },
    conceptPrompt: {
      en: "For the newcomers. People who just moved here, students starting their first semester, professionals on their first posting. A bar that says: you belong here. No cliques, no cold shoulders — just a warm room, friendly faces, and a reason to come back.",
      fi: "Uusille tulokkaille. Ihmiset jotka juuri muuttivat tänne, opiskelijat aloittamassa ensimmäistä lukukauttaan, ammattilaiset ensimmäisessä työpaikassaan. Baari joka sanoo: kuulut tänne. Ei kuppikuntia, ei kylmää olkapäätä — vain lämmin huone, ystävälliset kasvot, ja syy palata.",
    },
    complianceNotes: {
      en: "Inclusivity must not be alcohol-dependent. Frame the bar as a social space first. Welcome offers should include non-alcoholic options. Do not target students specifically with alcohol promotions.",
      fi: "Inklusiivisuus ei saa olla alkoholiriippuvaista. Kehystä baari ensisijaisesti sosiaalisena tilana. Tervetulotarjousten on sisällettävä alkoholittomia vaihtoehtoja. Älä kohdista opiskelijoihin erityisesti alkoholitarjouksilla.",
    },
  },
];

// ============================================================================
// Lookup helpers
// ============================================================================

/** Get all templates, optionally filtered by category or bar type. */
export function getTemplates(options?: {
  category?: TemplateCategory;
  barType?: string;
}): PromotionTemplate[] {
  let templates = PROMOTION_TEMPLATES;

  if (options?.category) {
    templates = templates.filter((t) => t.category === options.category);
  }

  if (options?.barType) {
    templates = templates.filter(
      (t) => t.suitableFor.length === 0 || t.suitableFor.includes(options.barType!),
    );
  }

  return templates;
}

/** Get templates grouped by category for UI display. */
export function getTemplatesByCategory(options?: {
  barType?: string;
}): Record<TemplateCategory, PromotionTemplate[]> {
  const grouped: Record<TemplateCategory, PromotionTemplate[]> = {
    universal: [],
    social: [],
    food: [],
    entertainment: [],
    premium: [],
    community: [],
  };

  for (const tpl of PROMOTION_TEMPLATES) {
    if (options?.barType && tpl.suitableFor.length > 0 && !tpl.suitableFor.includes(options.barType)) {
      continue;
    }
    grouped[tpl.category].push(tpl);
  }

  return grouped;
}

// ============================================================================
// Tone-adaptive prompt builder
// ============================================================================

/**
 * Build a combined prompt from a template and tone.
 * The template provides the concept (WHAT), the tone provides voice rules (HOW),
 * and compliance notes provide guardrails (DON'T).
 *
 * When a tone IS selected, the template concept is infused with the tone's
 * voice profile — same event, completely different personality.
 *
 * When no tone is selected, just the concept + compliance notes are returned.
 */
export function buildTemplatePrompt(
  template: PromotionTemplate,
  tone: ContentTone | null | undefined,
  language: "en" | "fi",
): string {
  const concept = template.conceptPrompt[language];
  const compliance = template.complianceNotes[language];
  const toneBlock = tone ? getTonePromptBlock(tone, language) : "";

  const parts: string[] = [concept];

  if (toneBlock) {
    parts.push(`\n${toneBlock}`);
  }

  parts.push(`\n${compliance}`);

  return parts.join("\n");
}

// ============================================================================
// AI-suggested templates — scored by bar type + tone compatibility
// ============================================================================

/** Tone compatibility per template category — lightweight inline scoring.
 *  Maps ContentTone values to how well they pair with each template category:
 *  2 = strong match, 1 = neutral, 0 = poor match. */
const CATEGORY_TONE_SCORES: Record<TemplateCategory, Partial<Record<string, number>>> = {
  universal: { BOLD_ENERGETIC: 1, WARM_INVITING: 2, PLAYFUL_FUN: 1, ELEGANT_PREMIUM: 1, EDGY_IRREVERENT: 1, COMMUNITY_LOCAL: 2, ROMANTIC_INTIMATE: 1, MYSTERIOUS_EXCLUSIVE: 0, ADVENTUROUS_CURIOUS: 1, NOSTALGIC_CLASSIC: 1 },
  social: { BOLD_ENERGETIC: 2, PLAYFUL_FUN: 2, COMMUNITY_LOCAL: 2, EDGY_IRREVERENT: 1, WARM_INVITING: 1, ELEGANT_PREMIUM: 0, ROMANTIC_INTIMATE: 0, MYSTERIOUS_EXCLUSIVE: 0, ADVENTUROUS_CURIOUS: 1, NOSTALGIC_CLASSIC: 0 },
  food: { WARM_INVITING: 2, ELEGANT_PREMIUM: 2, NOSTALGIC_CLASSIC: 1, ROMANTIC_INTIMATE: 1, COMMUNITY_LOCAL: 1, BOLD_ENERGETIC: 1, PLAYFUL_FUN: 1, EDGY_IRREVERENT: 0, MYSTERIOUS_EXCLUSIVE: 0, ADVENTUROUS_CURIOUS: 1 },
  entertainment: { BOLD_ENERGETIC: 2, PLAYFUL_FUN: 2, EDGY_IRREVERENT: 2, ADVENTUROUS_CURIOUS: 1, WARM_INVITING: 1, COMMUNITY_LOCAL: 1, ELEGANT_PREMIUM: 0, ROMANTIC_INTIMATE: 0, MYSTERIOUS_EXCLUSIVE: 0, NOSTALGIC_CLASSIC: 0 },
  premium: { ELEGANT_PREMIUM: 2, MYSTERIOUS_EXCLUSIVE: 2, ROMANTIC_INTIMATE: 2, NOSTALGIC_CLASSIC: 1, WARM_INVITING: 1, ADVENTUROUS_CURIOUS: 1, BOLD_ENERGETIC: 0, PLAYFUL_FUN: 0, EDGY_IRREVERENT: 0, COMMUNITY_LOCAL: 0 },
  community: { COMMUNITY_LOCAL: 2, WARM_INVITING: 2, NOSTALGIC_CLASSIC: 1, PLAYFUL_FUN: 1, ADVENTUROUS_CURIOUS: 1, ELEGANT_PREMIUM: 0, EDGY_IRREVERENT: 0, MYSTERIOUS_EXCLUSIVE: 0, ROMANTIC_INTIMATE: 1, BOLD_ENERGETIC: 0 },
};

/** Map Prisma Bar.type values to canonical bar type keys for template matching. */
const BAR_TYPE_NORMALIZE: Record<string, string> = {
  COCKTAIL_BAR: "COCKTAIL_BAR",
  NIGHTCLUB: "NIGHTCLUB",
  PUB: "PUB",
  SPORTS_BAR: "SPORTS_BAR",
  WINE_BAR: "WINE_BAR",
  LOUNGE: "LOUNGE",
  KARAOKE: "KARAOKE",
  LIVE_MUSIC: "LIVE_MUSIC",
  TERRACE_BAR: "TERRACE_BAR",
  BEER_HALL: "BEER_HALL",
};

export interface SuggestedTemplate extends PromotionTemplate {
  score: number;
  reason: "bar-type-match" | "tone-match" | "both" | "popular";
}

/**
 * Return templates ranked by relevance for the given bar type and tone.
 * Top-scoring templates are surfaced as "Suggested for you."
 *
 * Scoring (0–4):
 *   +2  bar type matches template's suitableFor
 *   +2  tone strongly matches template's category
 *   +1  tone neutral with template's category
 *
 * When no bar type or tone is given, returns a curated diverse set (one per category).
 */
export function getSuggestedTemplates(
  barType?: string | null,
  tone?: ContentTone | null,
  limit = 4,
): SuggestedTemplate[] {
  const normalizedType = barType ? (BAR_TYPE_NORMALIZE[barType] || barType) : null;

  const scored: SuggestedTemplate[] = PROMOTION_TEMPLATES.map((tpl) => {
    let score = 0;
    let reason: SuggestedTemplate["reason"] = "popular";

    // Bar type match: +2 if suitableFor is empty (universal) or includes this type
    if (normalizedType) {
      const typeMatches = tpl.suitableFor.length === 0 || tpl.suitableFor.includes(normalizedType);
      if (typeMatches) {
        score += 2;
        reason = "bar-type-match";
      }
    }

    // Tone compatibility: up to +2 based on category-tone score
    if (tone) {
      const toneScore = CATEGORY_TONE_SCORES[tpl.category]?.[tone] ?? 1;
      score += toneScore;
      if (toneScore >= 2) {
        reason = reason === "bar-type-match" ? "both" : "tone-match";
      }
    }

    return { ...tpl, score, reason };
  });

  // Sort by score descending, then by category diversity for ties
  scored.sort((a, b) => b.score - a.score);

  // When no bar type or tone: return one curated pick per category
  if (!normalizedType && !tone) {
    const diverse: SuggestedTemplate[] = [];
    const seenCategories = new Set<TemplateCategory>();
    for (const tpl of scored) {
      if (!seenCategories.has(tpl.category)) {
        seenCategories.add(tpl.category);
        diverse.push({ ...tpl, score: 1, reason: "popular" });
      }
    }
    return diverse.slice(0, limit);
  }

  return scored.slice(0, limit);
}

/** Category display labels for UI. */
export const CATEGORY_LABELS: Record<TemplateCategory, { en: string; fi: string }> = {
  universal: { en: "All Bars", fi: "Kaikki baarit" },
  social: { en: "Social & Groups", fi: "Sosiaaliset & ryhmät" },
  food: { en: "Food & Kitchen", fi: "Ruoka & keittiö" },
  entertainment: { en: "Entertainment", fi: "Viihde" },
  premium: { en: "Premium & Craft", fi: "Premium & käsityö" },
  community: { en: "Community & Local", fi: "Yhteisö & paikallinen" },
};
