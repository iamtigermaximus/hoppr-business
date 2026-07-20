// src/lib/prompts/template-voices.ts
// ============================================================================
// TEMPLATE VOICE PROFILES — Writing personality for each promotion template.
//
// Templates define structure (time+price for happy hour, date+location for
// events). Template voices define personality — how each template should
// SOUND regardless of the chosen tone. The tone voice and template voice
// blend together: tone sets the overall writing style, template colors it
// for the specific context.
// ============================================================================

/** Known template IDs — matches TEMPLATE_CHARACTERISTICS keys in prompts.ts */
export type TemplateId =
  | "After-Work"
  | "Ladies Night"
  | "Naistenilta"
  | "Live Music"
  | "Elävä musiikki"
  | "Game Night"
  | "Peli-ilta"
  | "Food Special"
  | "Ruokatarjous"
  | "VIP Experience"
  | "VIP-kokemus"
  | "Signature Evening"
  | "Talon suositukset"
  | "Theme Night"
  | "Teemailta"
  // New tone-adaptive template IDs (from promotion-templates.ts)
  | "after-work" | "weekend-special" | "seasonal-special" | "regulars-night"
  | "quiz-night" | "karaoke-night" | "group-celebration" | "industry-night"
  | "tasting-menu" | "food-drink-pairing" | "chefs-special" | "brunch-service"
  | "live-music" | "dj-night" | "sports-screening" | "open-mic"
  | "cocktail-masterclass" | "meet-the-maker" | "private-tasting" | "rare-release"
  | "neighbourhood-night" | "local-artist" | "charity-fundraiser" | "new-in-town";

interface TemplateVoice {
  /** Short, punchy voice block injected into the prompt. */
  promptBlock: { en: string; fi: string };
}

/** Maps template IDs (including Finnish variants) to their canonical voice. */
const CANONICAL_MAP: Record<string, string> = {
  "Naistenilta": "Ladies Night",
  "Elävä musiikki": "Live Music",
  "Peli-ilta": "Game Night",
  "Ruokatarjous": "Food Special",
  "VIP-kokemus": "VIP Experience",
  "Talon suositukset": "Signature Evening",
  "Teemailta": "Theme Night",
};

const TEMPLATE_VOICES: Record<string, TemplateVoice> = {
  // ---- New tone-adaptive template voices (from promotion-templates.ts) ----
  // UNIVERSAL
  "after-work": {
    promptBlock: {
      en: `TEMPLATE VOICE — After-Work:
The transition from workday to evening. Focus on the arrival moment — stepping through the door, decompressing, shifting energy. Time-anchored (16:00–19:00). Atmosphere and company are the draw. Do not frame alcohol as a reward for work. Keep the focus on the ritual of unwinding, not the volume of consumption.`,

      fi: `MALLIPOHJAN ÄÄNI — After-Work:
Siirtymä työpäivästä iltaan. Keskity saapumisen hetkeen — oven avaamiseen, rentoutumiseen, energian muutokseen. Aika-ankkuroitu (klo 16–19). Tunnelma ja seura ovat vetonaula. Älä kehystä alkoholia palkkiona työstä. Pidä fokus rentoutumisen rituaalissa, älä kulutuksen määrässä.`,
    },
  },
  "weekend-special": {
    promptBlock: {
      en: `TEMPLATE VOICE — Weekend Special:
Friday or Saturday peak energy. The bar at its best — full room, great atmosphere, the weekend in full swing. Energy is positive but measured. Do not promote binge drinking or "big night out" framing. The weekend is for connection, not excessive consumption.`,
      fi: `MALLIPOHJAN ÄÄNI — Weekend Special:
Perjantain tai lauantain huippuenergia. Baari parhaimmillaan — täysi huone, loistava tunnelma, viikonloppu täydessä vauhdissa. Energia on positiivista mutta hillittyä. Älä mainosta ryyppäämistä tai "iso ilta ulkona" -kehystystä. Viikonloppu on yhteyksiä, ei liiallista kulutusta varten.`,
    },
  },
  "seasonal-special": {
    promptBlock: {
      en: `TEMPLATE VOICE — Seasonal Special:
Limited-time seasonal offering — terrace in summer, mulled wine in winter, fresh flavors in spring. The bar responding to the season. Timely, relevant, fleeting. Keep seasonal alcohol references balanced with food and atmosphere. Do not suggest drinking more because of the season.`,
      fi: `MALLIPOHJAN ÄÄNI — Seasonal Special:
Rajoitetun ajan kausitarjonta — terassi kesällä, glögi talvella, tuoreita makuja keväällä. Baari vastaa vuodenaikaan. Ajankohtainen, relevantti, hetkellinen. Pidä kausiluonteiset alkoholiviittaukset tasapainossa ruoan ja tunnelman kanssa. Älä vihjaa juomista enemmän vuodenajan takia.`,
    },
  },
  "regulars-night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Regulars' Night:
A genuine thank-you to loyal regulars. The bartender knows their name, their order, their story. Loyalty rewarded with something real, not gimmicky. Frame as appreciation, not a promotion. Rewards should focus on experience, not drinking volume. This is about belonging.`,
      fi: `MALLIPOHJAN ÄÄNI — Regulars' Night:
Aito kiitos uskollisille kanta-asiakkaille. Baarimikko tietää heidän nimensä, tilauksensa, tarinansa. Uskollisuus palkittu jollain todellisella, ei kikalla. Kehystä arvostuksena, ei mainoksena. Palkkioiden tulee keskittyä kokemukseen, ei juomisen määrään. Kyse on kuulumisesta.`,
    },
  },
  // SOCIAL
  "quiz-night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Quiz Night:
Team trivia, friendly rivalry, brains tested. Weekly ritual where questions matter less than company. Strangers become teammates. The host/MC drives the energy. Keep quiz and drinks as parallel activities — never link them. Do not offer alcohol as a prize. Do not frame drinking as part of the competition.`,
      fi: `MALLIPOHJAN ÄÄNI — Quiz Night:
Joukkuevisa, ystävällinen kilpailu, aivot koetuksella. Viikoittainen rituaali jossa kysymykset merkitsevät vähemmän kuin seura. Tuntemattomista tulee joukkuetovereita. Juontaja ajaa energiaa. Pidä visa ja juomat rinnakkaisina aktiviteetteina — älä koskaan linkitä niitä. Älä tarjoa alkoholia palkintona. Älä kehystä juomista osana kilpailua.`,
    },
  },
  "karaoke-night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Karaoke Night:
Open microphone, audience becomes entertainment. Courage and surprise talent. Shared singing joy — badly or brilliantly. The stage belongs to everyone. Focus on music and performance, not liquid courage. Do not suggest alcohol is needed for stage confidence. Everyone is welcome to sing.`,
      fi: `MALLIPOHJAN ÄÄNI — Karaoke Night:
Avoin mikki, yleisöstä tulee viihde. Rohkeutta ja yllättävää lahjakkuutta. Jaettua laulamisen iloa — huonosti tai loistavasti. Lava kuuluu kaikille. Keskity musiikkiin ja esiintymiseen, älä nestemäiseen rohkeuteen. Älä vihjaa alkoholia tarvittavan lavaluottamukseen. Kaikki ovat tervetulleita laulamaan.`,
    },
  },
  "group-celebration": {
    promptBlock: {
      en: `TEMPLATE VOICE — Group Celebration:
Birthdays, promotions, reunions — life's moments with the bar as backdrop. Reserved tables, shared platters, organized so hosts can enjoy themselves. Emphasize the occasion, not the alcohol. Group packages must not incentivize per-person consumption targets. Avoid "bottomless" or "all you can drink" framing.`,
      fi: `MALLIPOHJAN ÄÄNI — Group Celebration:
Syntymäpäivät, ylennykset, tapaamiset — elämän hetket baarin toimiessa taustana. Varatut pöydät, jaetut tarjoilut, järjestetty niin että isännätkin voivat nauttia. Korosta tilaisuutta, älä alkoholia. Ryhmäpaketit eivät saa kannustaa henkilökohtaisiin kulutustavoitteisiin. Vältä "pohjaton" tai "niin paljon kuin juot" -kehystystä.`,
    },
  },
  "industry-night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Industry Night:
Hospitality workers' night off. Bartenders, servers, chefs, managers — on the other side of the bar for once. Industry discounts, familiar faces, community-building. Frame as a gathering of peers, not consumption-driven. Do not glamorize using alcohol to cope with work stress. Keep discounts moderate.`,
      fi: `MALLIPOHJAN ÄÄNI — Industry Night:
Ravintola-alan työntekijöiden vapaa ilta. Baarimikot, tarjoilijat, kokit, esimiehet — kerrankin baarin toisella puolella. Alan alennukset, tutut kasvot, yhteisön rakentamista. Kehystä vertaisten kokoontumisena, ei kulutusvetoisena. Älä glamourioi alkoholin käyttöä työstressin käsittelyyn. Pidä alennukset maltillisina.`,
    },
  },
  // FOOD
  "tasting-menu": {
    promptBlock: {
      en: `TEMPLATE VOICE — Tasting Menu:
Guided tasting experience — kitchen and bar working together. Courses paired with drinks, each building on the last. Limited seats, curated progression, sensory journey led by an expert. Food must be the primary focus, not the alcohol pairing. Each course features the food first. Do not suggest drinking is the main event.`,
      fi: `MALLIPOHJAN ÄÄNI — Tasting Menu:
Opastettu maistelukokemus — keittiö ja baari yhteistyössä. Annoksia ja juomia pareittain, jokainen rakentuen edellisen päälle. Rajoitetut paikat, kuratoitu eteneminen, aistikokemus asiantuntijan johdolla. Ruoan tulee olla ensisijainen fokus, ei alkoholiparin. Jokainen annos esittelee ruoan ensin. Älä vihjaa juomisen olevan päätapahtuma.`,
    },
  },
  "food-drink-pairing": {
    promptBlock: {
      en: `TEMPLATE VOICE — Food & Drink Pairing:
A dish and its perfect drink partner. The interplay of flavors, the craft behind each element, a pairing that elevates both. The drink is the accompaniment, not the reason. Describe the pairing as complementary — do not suggest the food exists to sell drinks. Do not imply you need alcohol to enjoy the meal.`,
      fi: `MALLIPOHJAN ÄÄNI — Food & Drink Pairing:
Annos ja sen täydellinen juomakumppani. Makujen vuorovaikutus, käsityö jokaisen elementin takana, yhdistelmä joka nostaa molempia. Juoma on lisäke, ei syy. Kuvaile yhdistelmää täydentävänä — älä vihjaa ruoan olevan olemassa juomien myymiseksi. Älä implikoi tarvitsevasi alkoholia nauttiaksesi ateriasta.`,
    },
  },
  "chefs-special": {
    promptBlock: {
      en: `TEMPLATE VOICE — Chef's Special:
The kitchen showing off. Seasonal ingredients, bold technique, a dish worth planning your evening around. Available for a limited time. Food-first messaging — any drink mention is a natural accompaniment suggestion, not a sales pitch. Do not use food as a vehicle for alcohol promotion. Let the kitchen be the star.`,
      fi: `MALLIPOHJAN ÄÄNI — Chef's Special:
Keittiö näyttää osaamistaan. Kausiraaka-aineet, rohkea tekniikka, annos jonka ympärille kannattaa suunnitella ilta. Saatavilla rajoitetun ajan. Ruoka edellä -viestintä — juomamaininnat ovat luonnollisia lisäke-ehdotuksia, eivät myyntipuhetta. Älä käytä ruokaa alkoholin mainostamisen välineenä. Anna keittiön olla tähti.`,
    },
  },
  "brunch-service": {
    promptBlock: {
      en: `TEMPLATE VOICE — Brunch / Day Service:
The bar opens early. Daylight through windows, coffee and pastries, a slower pace. The same space with a completely different personality. Weekend mornings with food, drinks that suit the hour. Daytime alcohol must be secondary to food. Coffee and non-alcoholic options equally prominent. Do not frame daytime drinking as glamorous.`,
      fi: `MALLIPOHJAN ÄÄNI — Brunch / Day Service:
Baari avautuu aikaisin. Päivänvalo ikkunoista, kahvia ja leivonnaisia, hitaampi tahti. Sama tila, täysin eri persoonallisuus. Viikonloppuaamuja ruoan kera, kellonaikaan sopivia juomia. Päiväaikainen alkoholi on toissijaista ruokaan nähden. Kahvi ja alkoholittomat vaihtoehdot yhtä näkyvillä. Älä kehystä päiväjuomista glamourina.`,
    },
  },
  // ENTERTAINMENT
  "live-music": {
    promptBlock: {
      en: `TEMPLATE VOICE — Live Music Event:
Music takes over the room. Performer-first — the artist IS the headline. Sound filling the room, crowd shifting, shared live experience. Music is the headline, not the drinks. Alcohol is atmosphere, not the reason to attend. Do not suggest drinking enhances the musical experience. Build anticipation around the performer, not the bar.`,
      fi: `MALLIPOHJAN ÄÄNI — Live Music Event:
Musiikki valtaa tilan. Esiintyjä ensin — artisti ON otsikko. Ääni täyttää huoneen, yleisö liikkuu, jaettu live-kokemus. Musiikki on pääasia, ei juomat. Alkoholi on tunnelmaa, ei syy tulla. Älä vihjaa juomisen parantavan musiikkielämystä. Rakenna odotusta esiintyjän ympärille, älä baarin.`,
    },
  },
  "dj-night": {
    promptBlock: {
      en: `TEMPLATE VOICE — DJ Night:
The DJ controls the room. Beats build, crowd moves, the night finds its rhythm. A journey through sound — warm-up to peak to lights-on. Music-driven, not alcohol-driven. The DJ is the draw. Do not suggest alcohol is needed to enjoy music or dance. Do not glamorize late-night excess. The dance floor is the story.`,
      fi: `MALLIPOHJAN ÄÄNI — DJ Night:
DJ ottaa tilan haltuun. Biitit rakentuvat, yleisö liikkuu, ilta löytää rytminsä. Matka äänen läpi — lämppäristä huipennukseen valojen syttymiseen. Musiikkivetoista, ei alkoholivetoista. DJ on vetonaula. Älä vihjaa alkoholia tarvittavan musiikista tai tanssimisesta nauttimiseen. Älä glamourioi myöhäisillan ylilyöntejä. Tanssilattia on tarina.`,
    },
  },
  "sports-screening": {
    promptBlock: {
      en: `TEMPLATE VOICE — Sports Screening:
The big game on the big screen. Collective tension, shared cheers, an entire room experiencing the same moment. Sports is the focus — drinks are refreshment, not the event. Do not link alcohol consumption to team support or game outcomes. Do not encourage drinking games tied to match events. Game-day energy, match-day atmosphere.`,
      fi: `MALLIPOHJAN ÄÄNI — Sports Screening:
Iso peli isolla ruudulla. Kollektiivinen jännitys, jaetut hurraukset, koko huone kokee saman hetken. Urheilu on fokus — juomat ovat virvokkeita, eivät tapahtuma. Älä linkitä alkoholin kulutusta joukkueen kannattamiseen tai pelin tuloksiin. Älä kannusta juomapeleihin ottelutapahtumiin liitettynä. Pelipäivän energiaa, ottelupäivän tunnelmaa.`,
    },
  },
  "open-mic": {
    promptBlock: {
      en: `TEMPLATE VOICE — Open Mic / Showcase:
The stage is open for anyone with something to share. Raw talent, unexpected moments, supportive crowd. Musicians, poets, comedians — a platform for voices that deserve to be heard. Performance is the draw. Alcohol is venue experience, not a prerequisite. Do not suggest performers need a drink before going on stage.`,
      fi: `MALLIPOHJAN ÄÄNI — Open Mic / Showcase:
Lava on avoin kaikille, joilla on jotain jaettavaa. Raakaa lahjakkuutta, odottamattomia hetkiä, kannustava yleisö. Muusikot, runoilijat, koomikot — alusta äänille jotka ansaitsevat tulla kuulluiksi. Esiintyminen on vetonaula. Alkoholi on tilan kokemusta, ei edellytys. Älä vihjaa esiintyjien tarvitsevan juomaa ennen lavalle menoa.`,
    },
  },
  // PREMIUM
  "cocktail-masterclass": {
    promptBlock: {
      en: `TEMPLATE VOICE — Cocktail Masterclass:
Behind the bar, not in front of it. Hands-on learning — ingredients, technique, stories behind spirits. Guests learn to make, not just to drink. Limited spots, proper tools, something to take home. Educational framing: craft and knowledge over consumption. Tasting portions moderate. Do not frame as an opportunity to drink heavily while learning.`,
      fi: `MALLIPOHJAN ÄÄNI — Cocktail Masterclass:
Baarin takana, ei sen edessä. Käytännön oppimista — raaka-aineet, tekniikka, tarinat juomien takana. Vieraat oppivat tekemään, eivät vain juomaan. Rajoitetut paikat, kunnon välineet, jotain kotiin vietävää. Opetuksellinen kehystys: käsityö ja tieto ennen kulutusta. Maisteluannokset maltillisia. Älä kehystä tilaisuutena juoda runsaasti oppimisen varjolla.`,
    },
  },
  "meet-the-maker": {
    promptBlock: {
      en: `TEMPLATE VOICE — Meet the Maker:
The person behind the product, in the room. Distiller, brewer, or winemaker sharing craft, process, philosophy. Tasting with context — each sip understood, not just consumed. Educational, not promotional. The maker's presence is about knowledge sharing, not sales. Frame as cultural experience, not drinking event. Tasting portions moderate.`,
      fi: `MALLIPOHJAN ÄÄNI — Meet the Maker:
Henkilö tuotteen takana, huoneessa. Tislaaja, panija tai viinintekijä jakamassa käsityötä, prosessia, filosofiaa. Maistelua kontekstilla — jokainen siemaus ymmärrettynä, ei vain kulutettuna. Opetuksellinen, ei mainoksellinen. Tekijän läsnäolo on tiedon jakamista, ei myyntiä. Kehystä kulttuurikokemuksena, ei juomatapahtumana. Maisteluannokset maltillisia.`,
    },
  },
  "private-tasting": {
    promptBlock: {
      en: `TEMPLATE VOICE — Private Tasting:
Focused tasting for a small group. Rare bottles, guided exploration, intimate setting. Curated journey through a region, style, or era. For people who want to go deeper, not louder. Small pours, educational focus. The value is in knowledge and rarity, not volume. Never frame as unlimited tasting. Water and palate cleansers mentioned.`,
      fi: `MALLIPOHJAN ÄÄNI — Private Tasting:
Keskittynyt maistelu pienelle ryhmälle. Harvinaisia pulloja, opastettu tutkimus, intiimi ympäristö. Kuratoitu matka alueen, tyylin tai aikakauden läpi. Ihmisille jotka haluavat mennä syvemmälle, eivät kovemmalle. Pienet kaadot, opetuksellinen fokus. Arvo on tiedossa ja harvinaisuudessa, ei määrässä. Älä koskaan kehystä rajattomana maisteluna. Vesi ja makupuhdistajat mainittu.`,
    },
  },
  "rare-release": {
    promptBlock: {
      en: `TEMPLATE VOICE — Rare Release / Tap Takeover:
Something that won't be here long. Limited-release beer, single-barrel spirit, small-batch product. The appeal is the moment — you had to be there. Scarcity framing must not create urgency to drink more or faster. "Limited availability" refers to product rarity, not a reason to overconsume. One serving per customer is appropriate messaging.`,
      fi: `MALLIPOHJAN ÄÄNI — Rare Release / Tap Takeover:
Jotain mikä ei ole täällä pitkään. Rajoitettu erä olutta, yhden tynnyrin viinaa, pienierätuote. Vetovoima on hetkessä — piti olla paikalla. Niukkuuskehystys ei saa luoda kiirettä juoda enemmän tai nopeammin. "Rajoitettu saatavuus" viittaa tuotteen harvinaisuuteen, ei syyhyn ylikuluttaa. Yksi annos asiakasta kohden on sopiva viesti.`,
    },
  },
  // COMMUNITY
  "neighbourhood-night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Neighbourhood Night:
For people who live around the corner. A local, not a destination. The bar as the third place between home and work. The bartender knows your order. Community, not consumption. Frame the bar as a gathering place, not a drinking destination. Emphasize social connection. Do not use "local" as code for heavy drinking.`,
      fi: `MALLIPOHJAN ÄÄNI — Neighbourhood Night:
Niille, jotka asuvat kulman takana. Lähibaari, ei kohde. Baari kolmantena paikkana kodin ja työn välillä. Baarimikko tietää tilauksesi. Yhteisö, ei kulutus. Kehystä baari kokoontumispaikkana, ei juomakohteena. Korosta sosiaalista yhteyttä. Älä käytä "paikallinen" koodina runsaalle juomiselle.`,
    },
  },
  "local-artist": {
    promptBlock: {
      en: `TEMPLATE VOICE — Local Artist Showcase:
The walls become a gallery. Local artist's work on display — paintings, photography, installations. Art that changes monthly, conversations that start from what's on the wall. The bar as a platform for local creativity. Art is the focus, alcohol is the venue's normal offering. Opening night must center the artist, not drink specials.`,
      fi: `MALLIPOHJAN ÄÄNI — Local Artist Showcase:
Seinistä tulee galleria. Paikallisen taiteilijan töitä esillä — maalauksia, valokuvia, installaatioita. Taidetta joka vaihtuu kuukausittain, keskusteluja jotka alkavat seinältä. Baari alustana paikalliselle luovuudelle. Taide on fokus, alkoholi on tilan normaali tarjonta. Avajaisten on keskitettävä taiteilijaan, ei juomatarjouksiin.`,
    },
  },
  "charity-fundraiser": {
    promptBlock: {
      en: `TEMPLATE VOICE — Charity / Fundraiser:
A night where the bar gives back. Proceeds or a portion of sales going to a local cause. Drinking that does something. Charity framing must not exploit a cause to sell alcohol. Donation mechanism transparent — use "portion of evening's total", not "per drink." Do not suggest drinking more equals giving more. Describe the cause and impact.`,
      fi: `MALLIPOHJAN ÄÄNI — Charity / Fundraiser:
Ilta jolloin baari antaa takaisin. Tuotto tai osa myynnistä paikalliseen kohteeseen. Juominen joka tekee jotain. Hyväntekeväisyyskehystys ei saa hyödyntää kohdetta alkoholin myymiseksi. Lahjoitusmekanismi läpinäkyvä — käytä "osa illan kokonaismyynnistä", älä "per juoma." Älä vihjaa juomisen enemmän = antamisen enemmän. Kuvaile kohdetta ja vaikutusta.`,
    },
  },
  "new-in-town": {
    promptBlock: {
      en: `TEMPLATE VOICE — New in Town / Welcome:
For newcomers. Just moved here, first semester, first posting. A bar that says: you belong here. No cliques, no cold shoulders — just a warm room and friendly faces. Inclusivity, not alcohol-dependent. Frame as a social space first. Welcome offers must include non-alcoholic options. Do not target students with alcohol promotions.`,
      fi: `MALLIPOHJAN ÄÄNI — New in Town / Welcome:
Uusille tulokkaille. Juuri muuttaneet, ensimmäinen lukukausi, ensimmäinen työpaikka. Baari joka sanoo: kuulut tänne. Ei kuppikuntia, ei kylmää olkapäätä — vain lämmin huone ja ystävälliset kasvot. Inklusiivisuus, ei alkoholiriippuvainen. Kehystä ensisijaisesti sosiaalisena tilana. Tervetulotarjousten on sisällettävä alkoholittomia vaihtoehtoja. Älä kohdista opiskelijoihin alkoholitarjouksilla.`,
    },
  },

  // ---- Original template voices ----
  "After-Work": {
    promptBlock: {
      en: `TEMPLATE VOICE — After-Work:
Professional crowd unwinding. Write with the energy of 5pm on a weekday — the exhale after the workday. Mention the transition: office mode → evening mode. Time is part of the appeal (16:00–19:00). The draw is decompression, not partying. Practical details matter: timing, location, what's on pour.`,

      fi: `MALLIPOHJAN ÄÄNI — After-Work:
Ammattilaiset rentoutumassa. Kirjoita arkipäivän klo 17 energialla — työpäivän jälkeinen uloshengitys. Mainitse siirtymä: toimistotilasta iltatilaan. Aika on osa vetovoimaa (klo 16–19). Pääasia on rentoutuminen, ei bilettäminen. Käytännön yksityiskohdat merkitsevät: ajoitus, sijainti, mitä on tarjolla.`,
    },
  },

  "Ladies Night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Ladies Night:
Social, celebratory, group-oriented. Write to friend groups — not individuals, not couples. The energy is shared. Mention: your crew, your girls, the squad. Perks matter: reserved tables, welcome pours, group-friendly service. Inclusive and welcoming, not exclusive. The bar is hosting a party, not running a club.`,

      fi: `MALLIPOHJAN ÄÄNI — Ladies Night:
Sosiaalinen, juhlava, ryhmille suunnattu. Kirjoita ystäväporukoille — ei yksilöille, ei pareille. Energia on jaettua. Mainitse: sun porukka, tytöt, jengi. Edut merkitsevät: varatut pöydät, tervetulokaadot, ryhmäpalvelu. Kutsuva ja mukaanottava, ei eksklusiivinen. Baari järjestää juhlat, ei pyöritä klubia.`,
    },
  },

  "Live Music": {
    promptBlock: {
      en: `TEMPLATE VOICE — Live Music:
Performer-first. The artist IS the headline. Write about sound, presence, genre, stage. Mention: the set, the show, the sound filling the room. Room dynamics matter: standing vs seated, intimate vs loud. Time anchors: doors at, show at, set times. Build anticipation around the performer — the bar is the venue, not the star.`,

      fi: `MALLIPOHJAN ÄÄNI — Live Music:
Esiintyjä ensin. Artisti ON otsikko. Kirjoita äänestä, läsnäolosta, genrestä, lavasta. Mainitse: setti, show, ääni joka täyttää tilan. Tilan dynamiikka merkitsee: seisomapaikat vs istumapaikat, intiimi vs kovaääninen. Aika ankkuroi: ovet klo, show klo, settiajat. Rakenna odotusta esiintyjän ympärille — baari on tapahtumapaikka, ei tähti.`,
    },
  },

  "Game Night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Game Night:
Competitive socializing. Team play energy. Mention: your team, the competition, the prize. The format matters: trivia, bingo, board games, beer pong alternatives. Playful tension — stakes are low but pride is high. Call out the host/MC if there is one. Bragging rights are the real reward.`,

      fi: `MALLIPOHJAN ÄÄNI — Peli-ilta:
Kilpailuhenkinen seurustelu. Joukkuepelin energiaa. Mainitse: sun tiimi, kilpailu, palkinto. Formaatti merkitsee: tietovisa, bingo, lautapelit. Leikkisä jännitys — panokset matalat mutta ylpeys korkealla. Mainitse juontaja/järjestäjä jos sellainen on. Kerskumisoikeus on todellinen palkinto.`,
    },
  },

  "Food Special": {
    promptBlock: {
      en: `TEMPLATE VOICE — Food Special:
Culinary-first. The food IS the promotion — drinks are the accompaniment, not the other way around. Write about ingredients, preparation, pairings. Mention: the kitchen, the chef, the menu, the plates. Sensory detail: texture, aroma, presentation. Generous but never gluttonous. Food has no alcohol advertising restrictions — lean into it.`,

      fi: `MALLIPOHJAN ÄÄNI — Ruokatarjous:
Ruoka ensin. Ruoka ON tarjous — juomat ovat lisuke, eivät toisinpäin. Kirjoita raaka-aineista, valmistuksesta, suosituksista. Mainitse: keittiö, kokki, menu, annokset. Aistiyksityiskohtia: rakenne, tuoksu, asettelu. Runsas mutta ei ahne. Ruokaan ei kohdistu alkoholimainonnan rajoituksia — nojaa siihen.`,
    },
  },

  "VIP Experience": {
    promptBlock: {
      en: `TEMPLATE VOICE — VIP Experience:
Elevated, exclusive, premium. The experience is the difference between regular and exceptional. Mention: behind the rope, dedicated service, private area, bottle service, skip the line. Scarcity works here — limited tables, capped capacity. Confident, not bragging. The people who know, know. Don't explain why it's special — describe what makes it special.`,

      fi: `MALLIPOHJAN ÄÄNI — VIP Experience:
Kohotettu, eksklusiivinen, premium. Kokemus on ero tavallisen ja poikkeuksellisen välillä. Mainitse: köyden takana, oma palvelu, yksityistila, pullopalvelu, ohita jono. Niukkuus toimii täällä — rajoitetut pöydät, rajattu kapasiteetti. Itsevarma, ei leveilevä. Ne jotka tietävät, tietävät. Älä selitä miksi se on erityistä — kuvaile mikä tekee siitä erityistä.`,
    },
  },

  "Signature Evening": {
    promptBlock: {
      en: `TEMPLATE VOICE — Signature Evening:
One-of-a-kind. Unique to THIS venue. Write like this night doesn't exist anywhere else — because it doesn't. Mention: the concept, what we've prepared, a one-night-only feel. The draw is novelty and curation. Something you'd cross town for. The bar is flexing its creative muscle — this is its signature move.`,

      fi: `MALLIPOHJAN ÄÄNI — Signature Evening:
Ainutlaatuinen. Uniikki JUURI tälle paikalle. Kirjoita kuin tätä iltaa ei ole missään muualla — koska ei ole. Mainitse: konsepti, mitä olemme valmistaneet, vain-yhden-illan tuntu. Vetovoima on uutuudessa ja kuratoinnissa. Jotain jonka takia matkustaa kaupungin halki. Baari näyttää luovaa lihastaan — tämä on sen nimikkoliike.`,
    },
  },

  "Theme Night": {
    promptBlock: {
      en: `TEMPLATE VOICE — Theme Night:
Immersive transformation. The bar becomes something else for one night. Write like you're describing an alternate reality. Mention: the dress code, the transformation, the shared experience. Theatrical and transportive. The fun is in committing to the bit. Everyone playing along is part of the show.`,

      fi: `MALLIPOHJAN ÄÄNI — Teemailta:
Uppouttava muutos. Baari muuttuu joksikin muuksi yhdeksi illaksi. Kirjoita kuin kuvailisit vaihtoehtoista todellisuutta. Mainitse: pukukoodi, muodonmuutos, jaettu kokemus. Teatterillinen ja kuljettava. Hauskuus on jutussa mukana olemisessa. Jokainen joka lähtee leikkiin on osa shown'ta.`,
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the template voice block for injection into the prompt.
 * Handles Finnish template ID variants by mapping them to their canonical English key.
 */
export function getTemplateVoiceBlock(
  template: string | undefined | null,
  language: "en" | "fi" = "en",
): string {
  if (!template) return "";

  // Resolve Finnish variants to canonical keys
  const canonicalKey = CANONICAL_MAP[template] || template;
  const voice = TEMPLATE_VOICES[canonicalKey];
  if (!voice) return "";

  return language === "fi" ? voice.promptBlock.fi : voice.promptBlock.en;
}

/**
 * Return a compact blending instruction that tells the LLM how to combine
 * the tone voice and template voice into a single coherent style.
 */
export function getBlendInstruction(language: "en" | "fi" = "en"): string {
  return language === "fi"
    ? `\n\nÄÄNEN YHDISTÄMINEN: Yllä oleva KIRJOITUSTYYLIN SÄÄNNÖT määrittelee MITEN kirjoitat (rytmi, sanasto, välimerkit). Yllä oleva MALLIPOHJAN SÄÄNNÖT määrittelee MISTÄ kirjoitat ja kenelle (konteksti, yleisö, tunnelma). Yhdistä molemmat — kirjoita äänensävyllä mallipohjan kontekstissa. Älä valitse yhtä toisen kustannuksella.`
    : `\n\nVOICE BLENDING: The WRITING VOICE RULES above define HOW you write (rhythm, vocabulary, punctuation). The TEMPLATE VOICE above defines WHAT you're writing about and WHO it's for (context, audience, atmosphere). Combine both — write in the voice FOR the template context. Don't pick one at the expense of the other.`;
}
