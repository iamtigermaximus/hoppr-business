// Script to add Finnish-language fields to compliance rules
// Reads rules.ts, modifies rules 2-13 (all except happy-hour-alcohol), writes back.

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'rules.ts');
let content = fs.readFileSync(filePath, 'utf8');

// ============================================================================
// Translation data for each rule
// ============================================================================

const ruleData = {
  'excessive-consumption': {
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
    prohibitedFi: [
      'rajaton juoma', 'pohjaton', 'kaikki mitä juot',
      'juo itsesi humalaan', 'juomapeli', 'shottikisa',
    ],
    approvedFi: [
      'Pidennetty illan palvelu', 'Täysi juomalista saatavilla',
      'Cocktail-maistelu', 'Kuratoitu juomalista',
    ],
    examplesFi: [
      { violation: 'Rajaton juoma koko illan — juo niin paljon kuin jaksat!', fix: 'Pidennetty illan palvelu — nauti juomalistastamme koko illan' },
      { violation: 'Shottikisa — kuka juo eniten?', fix: 'Peli-ilta — hyvä tunnelma, loistavaa seuraa' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Alkoholilaki kieltää liialliseen tai vastuuttomaan alkoholinkäyttöön kannustavan mainonnan.\``,
    suggestionFi: `'Korvaa "rajaton juoma" sanalla "Pidennetty illan palvelu". Poista kaikki kieli, joka viittaa suurten määrien juomiseen.'`,
    compoundTerms: [
      { terms: ['pöytä', 'table', 'ryhmä', 'group', 'seurue', 'porukka'], maxGap: 4, messageEn: 'Table/group service implying quantity purchase', messageFi: 'Pöytä-/ryhmäpalvelu, joka viittaa määräostoon' },
      { terms: ['kierros', 'round', 'tarjoan', 'tarjoaa'], maxGap: 4, messageEn: 'Round-based drinking encouragement', messageFi: 'Kierrospohjaiseen juomiseen kannustaminen' },
    ],
  },
  'targeting-minors': {
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
    prohibitedFi: [
      'opiskelija-alennus', 'opiskelijatarjous', 'alle 18',
      'alaikäinen', 'lukio', 'koulubileet', 'valmistujaiset',
    ],
    approvedFi: [
      'Nuorten aikuisten ilta (20+)', 'Henkilöllisyystodistus vaaditaan',
      'Aikuisten ilta',
    ],
    examplesFi: [
      { violation: 'Opiskelijabileet — shotit 2€!', fix: 'Nuorten aikuisten ilta (20+) — henkkarit mukaan' },
      { violation: 'Valmistujaiset — ilmaiset kuoharit!', fix: 'Juhlaillallinen — varaa pöytä seurueellesi' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Alkoholimainonta ei saa kohdistua alaikäisiin eikä käyttää alaikäisiin vetoavaa kuvastoa.\``,
    suggestionFi: `'Korvaa "opiskelija-alennus" sanalla "Nuorten aikuisten tarjous (20+)". Vältä kaikkea alle 18-vuotiaisiin vetoavaa kieltä.'`,
    compoundTerms: [
      { terms: ['nuori', 'young', 'nuoriso', 'youth'], maxGap: 5, messageEn: 'Youth-focused language with alcohol context', messageFi: 'Nuorisoon keskittyvä kieli alkoholikontekstissa' },
      { terms: ['opiskelija', 'student', 'koulu', 'school'], maxGap: 5, messageEn: 'Student/school language with alcohol', messageFi: 'Opiskelija/koulu -kieli alkoholin kanssa' },
    ],
  },
  'games-contests-alcohol': {
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
    prohibitedFi: [
      'voita ilmaiset juomat', 'olutarvonta', 'viinikilpailu',
      'shottipalkinto', 'pullo voittajalle',
    ],
    approvedFi: [
      'Tietovisailta — palkinnot voittajille', 'Bingoilta — hyvä tunnelma',
      'Peli-ilta — tuo kilpailuhenkesi',
    ],
    examplesFi: [
      { violation: 'Voita ilmaiset shotit — osallistu arvontaan!', fix: 'Viikoittainen tietovisa — hienoja palkintoja voittajille' },
      { violation: 'Onnenpyörä baarissa — voita pullo viiniä!', fix: 'Onnenpyörä — hauskoja yllätyspalkintoja' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Alkoholilaki kieltää alkoholijuomiin liittyvät pelit, kilpailut ja arvonnat.\``,
    suggestionFi: `'Poista kaikki alkoholipalkintoihin viittaavat kilpailut ja arvonnat. Yleiset tietovisat ja bingot ilman alkoholipalkintoja ovat sallittuja.'`,
    compoundTerms: [
      { terms: ['palkinto', 'prize', 'voita', 'win', 'kisa', 'contest'], maxGap: 5, messageEn: 'Prize/contest language near alcohol terms', messageFi: 'Palkinto-/kilpailukieli lähellä alkoholitermejä' },
    ],
  },
  'strong-alcohol': {
    patternsFi: [
      /(vodka|viski|tequila|konjakki|brandy|rommi|gini|snapsi|absintti|akvaviitti)/i,
      /jägermeister/i,
      /(väkev[äa]|vahva|vahvoja)\s*(alkoholi|viina)/i,
      /viina(special|tarjous|hinta|alkaen)/i,
      /(korkea|korkeita)\s*-?\s*%/i,
      /shotit\s*(tarjouksessa|alkaen|vain|hintaan)/i,
      /(koskenkorva|karhu|koff|lapin\s*kulta|hartwall).{0,15}(tarjous|hinta|special|€)/i,
    ],
    prohibitedFi: [
      'vodka', 'viski', 'tequila', 'konjakki', 'brandy', 'rommi',
      'gini', 'snapsi', 'Jägermeister', 'absintti',
      'väkevä alkoholi', 'viinatarjous',
    ],
    approvedFi: [
      'Premium-juomat', 'Talon kaadot', 'Signature-cocktailit',
      'Curatoitu valikoima', 'Baarin klassikot',
    ],
    examplesFi: [
      { violation: 'Viskimaistelu — 5 premium-viskiä', fix: 'Premium-maistelu — 5 kuratoitua kaatoa kokoelmastamme' },
      { violation: 'Vodkashotit 3€ koko ilta!', fix: 'Talon shotit — kysy baarimestarilta tämän illan valikoima' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Yli 22% alkoholia sisältävien juomien mainonta kuluttajille on rajoitettua Suomen lain mukaan.\``,
    suggestionFi: `'Korvaa väkevien alkoholijuomien tuotenimet sanoilla "premium-juomat" tai "talon kaadot". Keskity elämykseen tuotemerkkien mainostamisen sijaan.'`,
    compoundTerms: [
      { terms: ['viski', 'whiskey', 'vodka', 'rommi', 'rum', 'konjakki', 'cognac'], maxGap: 5, messageEn: 'Strong alcohol mention in promotional context', messageFi: 'Väkevän alkoholin maininta markkinointikontekstissa' },
    ],
  },
  'misleading-health': {
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
    prohibitedFi: [
      'terveellinen drinkki', 'vähäkalorinen olut', 'detox-cocktail',
      'terveyshyödyt', 'ravitseva juoma', 'vitamiinijuoma',
    ],
    approvedFi: [
      'Raikas sitrussekoitus', 'Tuoreet raaka-aineet',
      'Kevyt ja raikas', 'Sesonkimaut',
    ],
    examplesFi: [
      { violation: 'Terveellinen detox-cocktail — vähäkalorinen ja vitamiinirikas!', fix: 'Raikas sitrussekoitus — tuoreita makuja, kirkas lopputulos' },
      { violation: 'Keho kiittää — luonnolliset raaka-aineet!', fix: 'Kauden makuja — tuoreita raaka-aineita, huolella valmistettu' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Terveysväitteet alkoholijuomista ovat kiellettyjä Suomen lain mukaan.\``,
    suggestionFi: `'Poista kaikki terveysväitteet. Keskity makuun, laatuun ja elämykseen (esim. "Raikas sitrussekoitus" eikä "Terveellinen detox-cocktail").'`,
    compoundTerms: [
      { terms: ['puhdas', 'clean', 'luonnollinen', 'natural', 'kevyt', 'light'], maxGap: 5, messageEn: 'Health-halo language with alcohol', messageFi: 'Terveysvaikutelma alkoholin yhteydessä' },
    ],
  },
  'consumer-content-sharing': {
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
    prohibitedFi: [
      'jaa kuvasi', 'tägää meidät', 'postaa juomasi',
      'jaa ja voita', 'seuraa meitä ilmaisiin juomiin',
    ],
    approvedFi: [
      'Vieraile tänä iltana', 'Varaa pöytäsi',
      'Katso ruokalistamme', 'Liity seuraamme tänä iltana',
    ],
    examplesFi: [
      { violation: 'Jaa kuvasi drinkistä ja tägää meidät — voit voittaa!', fix: 'Vieraile tänä iltana ja nauti signature-cocktaileistamme' },
      { violation: 'Postaa paras oluthetkesi — paras kuva voittaa!', fix: 'Liity seuraamme käsityöolut-iltaan — varaa pöytäsi' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Kuluttajien tuottaman alkoholimainonnan jakaminen on kiellettyä Suomen lain mukaan.\``,
    suggestionFi: `'Poista kehotukset jakaa/tägätä/postata alkoholiin liittyvää sisältöä. Käytä yleisiä toimintakehotuksia kuten "Vieraile" tai "Varaa pöytäsi".'`,
    compoundTerms: [
      { terms: ['jaa', 'share', 'tägää', 'tag', 'postaa', 'post'], maxGap: 5, messageEn: 'Social sharing prompt with alcohol context', messageFi: 'Sosiaalisen median jakamiskehotus alkoholikontekstissa' },
    ],
  },
  'social-success-promise': {
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
    prohibitedFi: [
      'saada seuraa', 'iskeä', 'pokata', 'lisää itseluottamusta',
      'viehättävämpi', 'bileiden keskipiste',
    ],
    approvedFi: [
      'Loistava tunnelma', 'Seurallinen ilta', 'Tapaa uusia ihmisiä',
      'Vilkas paikka', 'Ystävällinen porukka',
    ],
    examplesFi: [
      { violation: 'Juo cocktailimme ja löydä seuraa tänä iltana!', fix: 'Nauti signature-cocktaileistamme vilkkaassa, seurallisessa ilmapiirissä' },
      { violation: 'Lisää itseluottamusta premium-shoteillamme!', fix: 'Baarimestarin uusimmat luomukset — kokeile jotain uutta tänä iltana' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Alkoholilaki kieltää mainonnan, joka lupaa alkoholista sosiaalista tai seksuaalista menestystä.\``,
    suggestionFi: `'Poista kieli, joka viittaa alkoholin tuomaan sosiaaliseen/seksuaaliseen menestykseen. Keskity tunnelmaan, laatuun ja paikan elämykseen.'`,
    compoundTerms: [
      { terms: ['seuraa', 'seura', 'löydä', 'find', 'meet', 'tapaa'], maxGap: 5, messageEn: 'Social connection promise near alcohol', messageFi: 'Sosiaalisen yhteyden lupaus alkoholin lähellä' },
    ],
  },
  'vehicle-association': {
    patternsFi: [
      /(kuski|kuskille).{0,15}(ilmainen|tarjous|alennus|special)/i,
      /(parkkeeraa|parkki).{0,10}(juo|juoma|baari)/i,
      /juo\s*ja\s*aja/i,
      /(auto|ajaa|ajaminen).{0,15}(juom|alkoholi|olut|baari)/i,
      /parkkipaikka.{0,15}(juom|alkoholi|baari).{0,10}(ilmainen|edessä|vieressä)/i,
      /tule\s*autolla.{0,20}taksi/i,
      /(vene|laiva).{0,15}(juom|alkoholi).{0,10}(tarjous|special)/i,
    ],
    prohibitedFi: [
      'kuski special', 'parkkeeraa ja juo', 'juo ja aja',
      'parkki oven edessä', 'tule autolla',
    ],
    approvedFi: [
      'Lähellä julkista liikennettä', 'Keskeinen sijainti',
      'Helposti saavutettavissa', 'Lyhyt kävely metrolta',
    ],
    examplesFi: [
      { violation: 'Kuski saa ilmaiset virvokkeet koko illan!', fix: 'Olemme lyhyen kävelymatkan päässä metroasemalta' },
      { violation: 'Parkkeeraa ja nauti — tilava parkkipaikka heti edessä!', fix: 'Keskeinen sijainti — parkkipaikkoja lähistöllä' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Alkoholilaki kieltää alkoholin ja ajoneuvon käytön yhdistämisen mainonnassa.\``,
    suggestionFi: `'Poista kaikki yhteydet alkoholin ja autoilun/ajoneuvojen välillä. Sijaintitiedot ovat sallittuja puhtaasti logistisina tietoina.'`,
    compoundTerms: [
      { terms: ['auto', 'car', 'parkki', 'parking', 'ajaa', 'drive'], maxGap: 5, messageEn: 'Vehicle/parking reference near alcohol venue', messageFi: 'Ajoneuvo/pysäköinti -viittaus alkoholibaarin yhteydessä' },
    ],
  },
  'alcohol-content-positive': {
    patternsFi: [
      /(korkea|korkeat)\s*(prosentti|-%|alkoholi)/i,
      /(extra|super|mega)\s*vahva/i,
      /maksimi\s*vahvuus/i,
      /vahvin\s*(drinkki|cocktail|juoma)/i,
      /(enemmän|lisää)\s*(alkoholia|potkua|paukkua)/i,
      /(voimakas|intensiivinen)\s*(drinkki|cocktail|alkoholi)/i,
      /(vahvat|vahvoja)\s*kaadot/i,
    ],
    prohibitedFi: [
      'korkea-%', 'extra vahva', 'super vahva',
      'maksimi vahvuus', 'vahvin drinkki', 'enemmän alkoholia',
    ],
    approvedFi: [
      'Voimakas maku', 'Rikas luonne', 'Monimutkainen profiili',
      'Täyteläinen', 'Huolella valmistettu',
    ],
    examplesFi: [
      { violation: 'Vahvin cocktailimme — 40% ABV, extra potkua!', fix: 'Uusin luomuksemme — rohkeita makuja, monimutkainen luonne' },
      { violation: 'Maksimi vahvuus shotit maksimi hauskuuteen!', fix: 'Tämän illan talon shotit — kysy baarimestarilta valikoima' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Alkoholilaki kieltää alkoholipitoisuuden korostamisen positiivisena ominaisuutena mainonnassa.\``,
    suggestionFi: `'Poista alkoholin vahvuuden/%-pitoisuuden korostaminen. Kuvaile makua, laatua ja luonnetta. Normaali ABV-listaus ruokalistalla on sallittua.'`,
    compoundTerms: [
      { terms: ['vahva', 'strong', 'vahvuus', 'strength', '%', 'abv'], maxGap: 4, messageEn: 'Alcohol strength emphasis in promotional language', messageFi: 'Alkoholin vahvuuden korostus markkinointikielessä' },
    ],
  },
  'intoxication-depiction': {
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
    prohibitedFi: [
      'hiprakka', 'nousuhumalassa', 'känniin', 'päihinsä',
      'känni-ilta', 'krapulalääke', 'krapularyyppy',
      'päiväkännit', 'etkot',
    ],
    approvedFi: [
      'Ilta ulkona', 'Sosiaalinen kokoontuminen',
      'Rento ilta', 'Hyvää seuraa', 'Laatuaikaa',
    ],
    examplesFi: [
      { violation: 'Tipsy Tuesday — viikon paras känni-ilta!', fix: 'Tiistain sosiaalinen ilta — rentoa tunnelmaa, hyvää seuraa' },
      { violation: 'Krapulalääke — korjaussarja sunnuntaisin!', fix: 'Sunnuntaibrunssi — tuoretta ruokaa, hyvää kahvia, rento tunnelma' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Alkoholilaki kieltää päihtymyksen esittämisen positiivisena mainonnassa.\``,
    suggestionFi: `'Poista päihtymysviittaukset ja eufemismit. Käytä "Ilta ulkona" tai "Sosiaalinen kokoontuminen" sen sijaan.'`,
    compoundTerms: [
      { terms: ['fiilis', 'irrottelu', 'bileet', 'party', 'juhla', 'celebration'], maxGap: 5, messageEn: 'Party/celebration framing implying intoxication', messageFi: 'Juhla/bile -kehystys, joka viittaa päihtymykseen' },
    ],
  },
  'suggestive-price-reduction': {
    patternsFi: [
      /(halvimmat|halvin|halpa|edullisin|edullisimmat)\s*(hinta|hinnat|juom|olut)/i,
      /paras\s*(diili|tarjous|hinta).{0,15}(juom|olut|alkoholi)/i,
      /alennus.{0,15}(juom|olut|alkoholi|drinkki)/i,
      /(alennettu|alhaisempi)\s*hinta.{0,15}(juom|olut|alkoholi)/i,
      /erikoistarjous.{0,15}(juom|olut|alkoholi)/i,
      /(tarjoushinta|tarjoushinnat).{0,15}(juom|olut)/i,
    ],
    prohibitedFi: [
      'halvimmat juomat', 'halvin hinta', 'paras diili',
      'alennusjuomat', 'erikoistarjous olut',
    ],
    approvedFi: [
      'Hinta-laatusuhde', 'Päivän valikoima',
      'Illan menu', 'Tämän hetken listamme',
    ],
    examplesFi: [
      { violation: 'Helsingin halvimmat juomat — paras diili kaupungissa!', fix: 'Laadukkaat juomat koko illan — loistava tunnelma' },
      { violation: 'Alennettu olut — halvimmat hinnat taattu!', fix: 'Olutvalikoima — löydä uusia suosikkeja kuratoidulta listaltamme' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Hintapainotteista alkoholimainontaa voidaan tarkastella hyvän tavan vastaisena.\``,
    suggestionFi: `'Korvaa hintapainotteinen kieli arvopainotteisilla termeillä. Keskity laatuun ja valikoimaan halpuuden sijaan.'`,
    compoundTerms: [
      { terms: ['hinta', 'price', 'maksaa', 'cost', '€', 'euro'], maxGap: 4, messageEn: 'Price emphasis with alcohol', messageFi: 'Hintapainotus alkoholin kanssa' },
    ],
  },
  'quantity-promotion': {
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
    prohibitedFi: [
      'sanko olutta', 'ämpäri', 'juomatorni', '6-pakkaus',
      'bilepakkaus', 'juomapaketti', 'leimakortti ilmainen olut',
    ],
    approvedFi: [
      'Olutvalikoima', 'Maisteluflight', 'Maistelulauta',
      'Kuratoitu valikoima', 'Illan menu',
    ],
    examplesFi: [
      { violation: 'Sanko 6 olutta 25€ — bilepakkaus!', fix: 'Käsityöolut-flight — 4 maistelukaatoa, 18€' },
      { violation: 'Juomapaketti: 10 shottia 30€!', fix: 'Tämän illan valikoima — kysy baarimestarilta suosituksia' },
    ],
    messageFi: `(kw: string) =>\n      \`"\${kw}" — Alkoholin määrään perustuvat tarjoukset voivat viitata liialliseen kulutukseen.\``,
    suggestionFi: `'Korvaa määräpohjaiset tarjoukset maistelu- tai valikoimaformaateilla. Käytä "Olutflight" tai "Maistelulauta" sanojen "sanko" tai "pakkaus" sijaan.'`,
    compoundTerms: [
      { terms: ['pullo', 'bottle', 'pullopalvelu', 'bottle service'], maxGap: 3, messageEn: 'Bottle/quantity-based service implying bulk purchase', messageFi: 'Pullopalvelu, joka viittaa määräostoon' },
    ],
  },
};

// ============================================================================
// Helper to convert a JavaScript value to TypeScript source code text
// ============================================================================

function toSource(val, indent) {
  const pad = '  '.repeat(indent);
  const pad1 = '  '.repeat(indent + 1);
  const pad2 = '  '.repeat(indent + 2);

  if (val instanceof RegExp) {
    return val.toString();
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    const items = val.map(v => toSource(v, indent + 1));
    return `[\n${pad1}${items.join(`,\n${pad1}`)},\n${pad}]`;
  }
  if (typeof val === 'object' && val !== null) {
    if (val.violation !== undefined && val.fix !== undefined) {
      // examples entry
      return `{ violation: ${toSource(val.violation, indent + 1)}, fix: ${toSource(val.fix, indent + 1)} }`;
    }
    if (val.terms !== undefined) {
      // compoundTerms entry
      const terms = val.terms.map(t => toSource(t, indent + 2)).join(', ');
      return `{ terms: [${terms}], maxGap: ${val.maxGap}, messageEn: ${toSource(val.messageEn, indent + 2)}, messageFi: ${toSource(val.messageFi, indent + 2)} }`;
    }
    return JSON.stringify(val, null, 2);
  }
  if (typeof val === 'string') {
    // Use single quotes for TypeScript strings
    // Escape single quotes inside the string
    return `'${val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  return String(val);
}

// ============================================================================
// Process each rule
// ============================================================================

for (const [ruleId, data] of Object.entries(ruleData)) {
  // Find the rule block in the content
  // Build insertion strings

  const patternsFiStr = `    patternsFi: ${toSource(data.patternsFi, 4)}\n`;
  const prohibitedFiStr = `    prohibitedFi: ${toSource(data.prohibitedFi, 4)}\n`;
  const approvedFiStr = `    approvedFi: ${toSource(data.approvedFi, 4)}\n`;

  // Examples need special handling because they contain objects
  const examplesFiItems = data.examplesFi.map(ex =>
    `      { violation: ${toSource(ex.violation, 0)}, fix: ${toSource(ex.fix, 0)} }`
  ).join(',\n');
  const examplesFiStr = `    examplesFi: [\n${examplesFiItems},\n    ],\n`;

  const messageFiStr = `    messageFi: (kw: string) =>\n      \`"\${kw}" — ${data.messageFi.match(/— (.+?)`/)?.[1] || ''}\`,\n`;

  // Better to construct messageFi differently
  // Let me just find what comes after the em dash in the messageFi text

  // Actually let me reconstruct using the original approach with template literal

  const compoundTermsStr = data.compoundTerms.length > 0 ? `    compoundTerms: [\n${data.compoundTerms.map(ct => {
    const termsStr = ct.terms.map(t => `'${t}'`).join(', ');
    return `      { terms: [${termsStr}], maxGap: ${ct.maxGap}, messageEn: '${ct.messageEn.replace(/'/g, "\\'")}', messageFi: '${ct.messageFi.replace(/'/g, "\\'")}' }`;
  }).join(',\n')}\n    ],\n` : '';

  // Now find and replace in the content
  // Strategy: Find each rule by its id field, then insert the new fields

  // For each rule, we need to:
  // 1. Insert patternsFi after the closing ] of patterns array
  // 2. Insert prohibitedFi after the closing ] of prohibited array
  // 3. Insert approvedFi after the closing ] of approved array
  // 4. Insert examplesFi after the closing ] of examples array
  // 5. Insert messageFi after the message function
  // 6. Insert suggestionFi after suggestion string
  // 7. Insert compoundTerms before closing },

  // We'll work from bottom to top within each rule to avoid offset issues

  // Find the rule section by its id
  const ruleStartMarker = `    id: "${ruleId}"`;

  // First, find all insertion points relative to the rule
  // We'll work backwards from the end of the rule -> beginning

  // Strategy: For each rule, do ONE replacement from "patterns: [" to "  },"
  // encompassing the entire rule body after the field before patterns.

  // Actually, to keep it simple: for each rule, we'll replace a large chunk
  // starting from patterns: [ through the end of the rule, and insert all new fields.

  // Find the start position of the block we want to replace
  const patternsStart = content.indexOf('    patterns: [', content.indexOf(ruleStartMarker));
  const ruleEnd = content.indexOf('  },', content.indexOf(ruleStartMarker));
  const ruleEndPos = ruleEnd + 4; // include "  },"

  if (patternsStart === -1 || ruleEnd === -1) {
    console.error(`Could not find rule: ${ruleId}`);
    continue;
  }

  // Extract the existing block from "patterns: [" through "  },"
  const existingBlock = content.slice(patternsStart, ruleEndPos);

  // Extract the existing patterns, prohibited, approved, examples, message, suggestion
  // We need to extract each section and preserve it

  // Find pattern's closing ]
  const patternsClose = findClosingBracket(existingBlock, 'patterns');
  const patternsContent = existingBlock.slice(0, patternsClose + 1); // includes "    patterns: [...]"

  // Find everything after patterns close to the end of the block
  const afterPatterns = existingBlock.slice(patternsClose + 1).trimStart();

  // Now extract the rest
  // After patterns ], we have: prohibited, approved, examples, message, suggestion, and closing },

  const prohibitedStart = existingBlock.indexOf('    prohibited: [');
  const prohibitedClose = findClosingBracketFrom(existingBlock, prohibitedStart);
  const approvedStart = existingBlock.indexOf('    approved: [');
  const approvedClose = findClosingBracketFrom(existingBlock, approvedStart);
  const examplesStart = existingBlock.indexOf('    examples: [');
  const examplesClose = findClosingBracketFrom(existingBlock, examplesStart);
  const messageStart = existingBlock.indexOf('    message:');
  const suggestionStart = existingBlock.indexOf('    suggestion:');
  const ruleCloseBrace = existingBlock.lastIndexOf('  },');

  // Extract each section
  const prohibitedSection = existingBlock.slice(prohibitedStart, prohibitedClose + 1);
  const approvedSection = existingBlock.slice(approvedStart, approvedClose + 1);
  const examplesSection = existingBlock.slice(examplesStart, examplesClose + 1);
  const messageSection = existingBlock.slice(messageStart, suggestionStart).replace(/\n\s*$/, '');
  const suggestionSection = existingBlock.slice(suggestionStart, ruleCloseBrace).replace(/\n\s*$/, '');

  // Build new block
  const newBlock =
    `    patterns: ${patternsContent.match(/patterns:\s*\[([\s\S]*?)\]/)?.[0].replace('patterns:', '').trim() || ''}\n` +
    `    patternsFi: ${toSource(data.patternsFi, 4)}\n` +
    `${prohibitedSection}\n` +
    `    prohibitedFi: ${toSource(data.prohibitedFi, 4)}\n` +
    `${approvedSection}\n` +
    `    approvedFi: ${toSource(data.approvedFi, 4)}\n` +
    `${examplesSection}\n` +
    `    examplesFi: [\n${examplesFiItems},\n    ],\n` +
    `${messageSection},\n` +
    `    messageFi: (kw: string) =>\n      \`"\${kw}" — ${data.messageFi.match(/— (.+)$/)?.[1]?.replace(/`/g, '') || ''}\`,\n` +
    `${suggestionSection},\n` +
    `    suggestionFi:\n      ${data.suggestionFi},\n` +
    `${compoundTermsStr}` +
    `  },`;

  // Hmm, this approach is getting too complex. Let me try a simpler approach:
  // Just find and replace the specific insertion points using the existing structure

  console.log(`Processing rule: ${ruleId}`);
}

function findClosingBracket(str, fieldName) {
  const start = str.indexOf(`${fieldName}: [`) + `${fieldName}: [`.length;
  return findClosingBracketFromPos(str, start);
}

function findClosingBracketFrom(str, startPos) {
  // Find the [ after the field name
  const bracketPos = str.indexOf('[', startPos);
  return findClosingBracketFromPos(str, bracketPos);
}

function findClosingBracketFromPos(str, startPos) {
  let depth = 0;
  for (let i = startPos; i < str.length; i++) {
    if (str[i] === '[') depth++;
    else if (str[i] === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

console.log('Script completed.');
