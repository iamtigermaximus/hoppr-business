// src/lib/prompts/template-wizards.ts
// Step-by-step prompt builders for templates.
// Templates with wizards guide the user through questions to build
// a detailed brief. Templates without wizards fill the textarea directly.

export interface WizardStep {
  label: string;
  question: string;
  options: Array<{ label: string; prompt: string }>;
}

interface WizardConfig {
  steps: {
    en: WizardStep[];
    fi: WizardStep[];
  };
}

// Templates that have guided wizards
const WIZARDS: Record<string, WizardConfig> = {
  "After-Work": {
    steps: {
      en: [
        {
          label: "timing",
          question: "When does it start?",
          options: [
            { label: "Right after work (4pm)", prompt: "Starting at 4pm, the moment the workday ends." },
            { label: "Early evening (5-6pm)", prompt: "From 5pm onwards, easing into the evening." },
            { label: "Late after-work (until 8pm)", prompt: "Rolling from 5pm until the night crowd arrives at 8pm." },
          ],
        },
        {
          label: "vibe",
          question: "What's the energy like?",
          options: [
            { label: "Relaxed decompression", prompt: "Low-key, relaxed — the decompression hour. People unwinding, not partying yet." },
            { label: "Buzzing social hour", prompt: "Lively and buzzing — colleagues catching up, loud laughter, the room filling up fast." },
            { label: "Exclusive after-work", prompt: "Curated and exclusive — limited tables, craft drinks, an elevated after-work experience." },
          ],
        },
        {
          label: "hook",
          question: "What's the main draw?",
          options: [
            { label: "The drinks menu", prompt: "A rotating selection of house pours and signature cocktails at after-work pricing." },
            { label: "The atmosphere", prompt: "The shift from office mode to evening mode — the transition itself is the experience." },
            { label: "The crowd", prompt: "A mix of regulars and new faces — the place where the neighborhood's professionals gather." },
          ],
        },
      ],
      fi: [
        {
          label: "ajoitus",
          question: "Mihin aikaan alkaa?",
          options: [
            { label: "Heti töiden jälkeen (klo 16)", prompt: "Klo 16 alkaen, hetki jolloin työpäivä päättyy." },
            { label: "Alkuilta (klo 17-18)", prompt: "Klo 17 eteenpäin, iltaan laskeutuen." },
            { label: "Myöhäinen after-work (klo 20 asti)", prompt: "Klo 17-20, kunnes iltakansa saapuu." },
          ],
        },
        {
          label: "tunnelma",
          question: "Millainen tunnelma?",
          options: [
            { label: "Rentouttava", prompt: "Matalan profiilin rentoutuminen — ihmiset purkavat työpäivää, ei vielä bilettämässä." },
            { label: "Sosiaalinen", prompt: "Vilkas ja sosiaalinen — kollegat kuulumisia vaihtamassa, kovaäänistä naurua, tila täyttyy nopeasti." },
            { label: "Eksklusiivinen", prompt: "Kuratoitu ja eksklusiivinen — rajoitetut pöydät, käsityödrinkit, kohotettu after-work-kokemus." },
          ],
        },
        {
          label: "koukku",
          question: "Mikä on päävetonaula?",
          options: [
            { label: "Juomavalikoima", prompt: "Vaihtuva valikoima talon kaatoja ja signature-cocktaileja after-work-hinnoin." },
            { label: "Tunnelma", prompt: "Siirtymä toimistotilasta iltatilaan — itse siirtymä on elämys." },
            { label: "Porukka", prompt: "Vakiokävijöiden ja uusien kasvojen sekoitus — paikka jossa kaupunginosan ammattilaiset kokoontuvat." },
          ],
        },
      ],
    },
  },
  "Ladies Night": {
    steps: {
      en: [
        {
          label: "group",
          question: "What size group is this for?",
          options: [
            { label: "Small group (2-4)", prompt: "Perfect for small friend groups — intimate tables, shared experiences." },
            { label: "Medium crew (5-10)", prompt: "Designed for medium-sized groups — reserved tables, group-friendly service." },
            { label: "Big night out (10+)", prompt: "Built for big groups — VIP areas, group packages, dedicated service." },
          ],
        },
        {
          label: "perk",
          question: "What's the main perk?",
          options: [
            { label: "Welcome drinks", prompt: "Complimentary welcome pour for every guest on arrival." },
            { label: "Reserved area", prompt: "Reserved tables or private area — no waiting, no searching for seats." },
            { label: "Live entertainment", prompt: "Live music or DJ set curated for the night — the soundtrack to the evening." },
          ],
        },
        {
          label: "feeling",
          question: "What's the overall feeling?",
          options: [
            { label: "Glamorous night out", prompt: "Dress up, show up, feel special — a night that calls for heels and confidence." },
            { label: "Relaxed girls' night", prompt: "Casual, warm, no pressure — just good drinks and better conversation." },
            { label: "Party energy", prompt: "High energy, dancing, celebration — the kind of night you'll talk about next week." },
          ],
        },
      ],
      fi: [
        {
          label: "ryhmä",
          question: "Minkä kokoiselle porukalle?",
          options: [
            { label: "Pieni porukka (2-4)", prompt: "Täydellinen pienille ystäväporukoille — intiimit pöydät, jaetut kokemukset." },
            { label: "Keskikokoinen (5-10)", prompt: "Suunniteltu keskikokoisille ryhmille — varatut pöydät, ryhmäystävällinen palvelu." },
            { label: "Iso ilta (10+)", prompt: "Rakennettu isoille porukoille — VIP-alueet, ryhmäpaketit, omistautunut palvelu." },
          ],
        },
        {
          label: "etu",
          question: "Mikä on pääetu?",
          options: [
            { label: "Tervetuliaismalja", prompt: "Ilmainen tervetuliaiskaato jokaiselle vieraalle saapuessa." },
            { label: "Varattu alue", prompt: "Varatut pöydät tai yksityistila — ei odottelua, ei paikan etsimistä." },
            { label: "Live-viihdettä", prompt: "Live-musiikkia tai DJ-setti kuratoituna illalle — illan ääniraita." },
          ],
        },
        {
          label: "tunnelma",
          question: "Millainen kokonaisfiilis?",
          options: [
            { label: "Glamour-ilta", prompt: "Laita bilekamat päälle, tule paikalle, tunne itsesi erityiseksi." },
            { label: "Rento tyttöjen ilta", prompt: "Rento, lämmin, ei paineita — vain hyviä juomia ja parempaa keskustelua." },
            { label: "Biletunnelma", prompt: "Korkea energia, tanssia, juhlintaa — ilta josta puhutaan vielä ensi viikolla." },
          ],
        },
      ],
    },
  },
  "Live Music": {
    steps: {
      en: [
        {
          label: "music",
          question: "What kind of music?",
          options: [
            { label: "Live band", prompt: "A full live band — the energy of real instruments filling the room." },
            { label: "Solo acoustic", prompt: "An intimate solo acoustic set — one voice, one guitar, no distractions." },
            { label: "DJ set", prompt: "A curated DJ set — the room pulsing with selected tracks, the dance floor alive." },
          ],
        },
        {
          label: "genre",
          question: "What genre or style?",
          options: [
            { label: "Jazz & blues", prompt: "Smooth jazz and blues — the soundtrack to a sophisticated evening." },
            { label: "Rock & indie", prompt: "Rock and indie energy — loud, raw, and unpolished in the best way." },
            { label: "Electronic", prompt: "Electronic beats — from deep house to ambient, the room moves as one." },
          ],
        },
        {
          label: "atmosphere",
          question: "What does the room feel like?",
          options: [
            { label: "Up close and intimate", prompt: "Intimate and close — you can see the sweat on the guitarist's brow." },
            { label: "Festival energy", prompt: "Festival energy — the crowd packed tight, hands in the air, singing along." },
            { label: "Lounge listening", prompt: "Laid-back listening — people in booths, drinks in hand, letting the music wash over them." },
          ],
        },
      ],
      fi: [
        {
          label: "musiikki",
          question: "Millaista musiikkia?",
          options: [
            { label: "Live-bändi", prompt: "Täysi live-bändi — oikeiden soittimien energia täyttää tilan." },
            { label: "Sooloakustinen", prompt: "Intiimi sooloakustinen setti — yksi ääni, yksi kitara, ei häiriötekijöitä." },
            { label: "DJ-setti", prompt: "Kuratoitu DJ-setti — tila sykkii valituilla kappaleilla, tanssilattia herää." },
          ],
        },
        {
          label: "genre",
          question: "Mikä genre tai tyyli?",
          options: [
            { label: "Jazz & blues", prompt: "Pehmeää jazzia ja bluesia — hienostuneen illan ääniraita." },
            { label: "Rock & indie", prompt: "Rock- ja indie-energiaa — kovaa, raakaa ja hiomatonta parhaalla tavalla." },
            { label: "Elektroninen", prompt: "Elektronisia biittejä — deep housesta ambienttiin, tila liikkuu yhtenä." },
          ],
        },
        {
          label: "tunnelma",
          question: "Miltä tila tuntuu?",
          options: [
            { label: "Läheltä ja intiimi", prompt: "Intiimi ja läheinen — näet hien kitaristin otsalla." },
            { label: "Festivaalienergia", prompt: "Festivaalienergia — yleisö tiiviisti, kädet ilmassa, laulamassa mukana." },
            { label: "Loungessa kuunnellen", prompt: "Rento kuuntelu — ihmiset looseissa, juomat kädessä, musiikin antaessa virrata." },
          ],
        },
      ],
    },
  },
  "Game Night": {
    steps: {
      en: [
        {
          label: "games",
          question: "What kind of games?",
          options: [
            { label: "Trivia & quizzes", prompt: "Trivia and quiz night — teams compete, the room's collective brain against the questions." },
            { label: "Board games", prompt: "Board games and card games — strategy and luck, tables of focused faces and sudden laughter." },
            { label: "Bingo & party games", prompt: "Bingo and party games — fast-paced, everyone can play, prizes and bragging rights." },
          ],
        },
        {
          label: "competition",
          question: "How competitive is it?",
          options: [
            { label: "Friendly and casual", prompt: "Friendly competition — more about the laughs than the leaderboard." },
            { label: "Serious players", prompt: "Serious players welcome — prizes on the line, bragging rights at stake." },
            { label: "Chaos mode", prompt: "Pure chaos — the rules are loose, the drinks are flowing, and the best wrong answer might win." },
          ],
        },
        {
          label: "prize",
          question: "What's at stake?",
          options: [
            { label: "Bar tab credit", prompt: "Winners get bar credit — your next round is on the house." },
            { label: "Trophy & glory", prompt: "A trophy, a spot on the wall of fame, and unlimited bragging rights until next week." },
            { label: "Just for fun", prompt: "No prizes, just pride — the satisfaction of victory and the consolation of good company." },
          ],
        },
      ],
      fi: [
        {
          label: "pelit",
          question: "Millaisia pelejä?",
          options: [
            { label: "Tietovisa", prompt: "Tietovisa-ilta — joukkueet kilpailevat, huoneen kollektiivinen älykkyys kysymyksiä vastaan." },
            { label: "Lautapelit", prompt: "Lauta- ja korttipelit — strategiaa ja tuuria, pöydät täynnä keskittyneitä kasvoja ja äkillistä naurua." },
            { label: "Bingo & seura pelit", prompt: "Bingo ja seurapelit — nopeatempoista, kaikki voivat pelata, palkintoja ja kerskumisoikeuksia." },
          ],
        },
        {
          label: "kilpailu",
          question: "Kuinka kilpailuhenkistä?",
          options: [
            { label: "Ystävällistä", prompt: "Ystävällismielistä kilpailua — enemmän naurua kuin tulostaulua." },
            { label: "Tosissaan", prompt: "Tosissaan pelaaville — palkinnot vaakalaudalla, kerskumisoikeus panoksena." },
            { label: "Kaaostila", prompt: "Puhdasta kaaosta — säännöt löyhät, juomat virtaavat, ja paras väärä vastaus saattaa voittaa." },
          ],
        },
        {
          label: "palkinto",
          question: "Mitä vaakalaudalla?",
          options: [
            { label: "Baarikrediittiä", prompt: "Voittajat saavat baarikrediittiä — seuraava kierros talon piikkiin." },
            { label: "Pokaali & kunnia", prompt: "Pokaali, paikka kunniaseinällä, ja rajattomat kerskumisoikeudet ensi viikkoon asti." },
            { label: "Vain huvin vuoksi", prompt: "Ei palkintoja, vain ylpeyttä — voiton tyydytys ja hyvän seuran lohtu." },
          ],
        },
      ],
    },
  },
  "Food Special": {
    steps: {
      en: [
        {
          label: "food",
          question: "What kind of food?",
          options: [
            { label: "Bar classics elevated", prompt: "Elevated bar classics — the burger, but better. The wings, but crafted." },
            { label: "Chef's special", prompt: "A rotating chef's special — seasonal ingredients, limited availability, worth planning your week around." },
            { label: "Sharing plates", prompt: "Sharing plates and small bites — designed for the table, a social eating experience." },
          ],
        },
        {
          label: "pairing",
          question: "Any drink pairing?",
          options: [
            { label: "Perfectly paired", prompt: "Each dish comes with a recommended pairing — the drink and the food were made for each other." },
            { label: "Standalone star", prompt: "The food stands on its own — no pairing needed, the dish is the main event." },
            { label: "Deal included", prompt: "Food + drink at a combined price — the complete evening sorted in one order." },
          ],
        },
        {
          label: "experience",
          question: "What's the dining experience like?",
          options: [
            { label: "Casual and quick", prompt: "Fast, casual, delicious — perfect for a pre-drinks meal or a quick bite between rounds." },
            { label: "Sit-down and savor", prompt: "Take your time — reserved tables, relaxed pacing, a proper dining experience." },
            { label: "Late-night kitchen", prompt: "The kitchen stays open late — proper food when most places have already turned off the grill." },
          ],
        },
      ],
      fi: [
        {
          label: "ruoka",
          question: "Millaista ruokaa?",
          options: [
            { label: "Baariklassikot kohotettuna", prompt: "Kohotetut baariklassikot — hampurilainen, mutta parempi. Siivet, mutta käsityönä." },
            { label: "Kokin erikoinen", prompt: "Vaihtuva kokin erikoinen — sesongin raaka-aineita, rajoitettu saatavuus, arvoinen suunnitella viikkonsa ympärille." },
            { label: "Jaettavat annokset", prompt: "Jaettavat annokset ja pikkupurtavat — suunniteltu pöydälle, sosiaalinen ruokailukokemus." },
          ],
        },
        {
          label: "juomasuositus",
          question: "Onko juomasuositusta?",
          options: [
            { label: "Täydellinen pari", prompt: "Jokaiselle annokselle suositeltu juomapari — juoma ja ruoka kuin luodut toisilleen." },
            { label: "Ruoka puhukoon", prompt: "Ruoka puhuu puolestaan — ei tarvetta paritukselle, annos on pääesiintyjä." },
            { label: "Yhdistelmätarjous", prompt: "Ruoka + juoma yhteishintaan — koko ilta hoidettu yhdellä tilauksella." },
          ],
        },
        {
          label: "kokemus",
          question: "Millainen ruokailukokemus?",
          options: [
            { label: "Rento ja nopea", prompt: "Nopeaa, rentoa, herkullista — täydellinen etkojen ruoka tai nopea haukku kierrosten välissä." },
            { label: "Istu ja nauti", prompt: "Ota aikasi — varatut pöydät, rento tahti, kunnon ruokailukokemus." },
            { label: "Myöhäisillan keittiö", prompt: "Keittiö auki myöhään — kunnon ruokaa kun useimmat paikat ovat jo sammuttaneet grillin." },
          ],
        },
      ],
    },
  },
};

// Templates without wizards — just fill the textarea directly
// (VIP Experience, Signature Evening, Theme Night)

/** Maps promotion template IDs (kebab-case) to wizard config labels (Title Case) */
const PROMO_TEMPLATE_WIZARD_MAP: Record<string, string> = {
  "after-work": "After-Work",
  "live-music": "Live Music",
  "quiz-night": "Game Night",
  "food-drink-pairing": "Food Special",
  "group-celebration": "Ladies Night",
};

/**
 * Get the wizard config for a template label or promotion template ID, or null if it doesn't have one.
 * Accepts both old Title Case labels and new kebab-case promotion template IDs.
 */
export function getWizardForTemplate(labelOrId: string): WizardConfig | null {
  // Direct match first (old Title Case labels)
  if (WIZARDS[labelOrId]) return WIZARDS[labelOrId];

  // Try the promotion template ID mapping (new kebab-case IDs)
  const mappedLabel = PROMO_TEMPLATE_WIZARD_MAP[labelOrId];
  if (mappedLabel && WIZARDS[mappedLabel]) return WIZARDS[mappedLabel];

  return null;
}

/**
 * Assemble the wizard answers into a final prompt string.
 */
export function assembleWizardPrompt(
  answers: Record<string, string>,
  barName: string,
  language: "en" | "fi",
): string {
  const parts = Object.values(answers).filter(Boolean);
  if (parts.length === 0) return "";

  if (language === "fi") {
    return `Luo tarjous baarille ${barName}.\n\n${parts.join(" ")}\n\nLuo 3 täysin erilaista varianttia. KAIKKI teksti SUOMEKSI.`;
  }

  return `Create a promotion for ${barName}.\n\n${parts.join(" ")}\n\nGenerate 3 completely different variants.`;
}
