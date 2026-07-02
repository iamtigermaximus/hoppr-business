// SVG pattern + gradient backgrounds for share cards — organized by vibe
// Each background is tagged with matching categories and occasions for smart defaults

export type SvgBackground =
  // Drink-focused
  | "cheers" | "hops" | "wine-glasses" | "cocktail-shaker"
  // Nightlife / energy
  | "neon-pulse" | "disco-ball" | "laser-grid" | "bass-waves"
  // Elegant / upscale
  | "gold-accents" | "marble" | "velvet" | "champagne-bubbles"
  // Casual / cozy
  | "wood-grain" | "cozy-lights" | "rooftop-sunset"
  // Party / celebration
  | "confetti-burst" | "fireworks" | "balloon-pop"
  // Music / events
  | "soundwaves" | "vinyl-grooves" | "stage-lights"
  // Seasonal
  | "summer-vibes" | "winter-frost" | "autumn-leaves"
  | "stripes-bg";

// ---- SVG Pattern Data URIs ----

export const SVG_PATTERNS: Record<SvgBackground, string> = {
  // ── Drink-focused ──
  cheers: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M35 20 L35 10 Q35 5 40 5 L45 5 Q50 5 50 10 L50 25' fill='none' stroke='%23059669' stroke-width='1.5' opacity='0.18'/%3E%3Cpath d='M75 20 L75 10 Q75 5 80 5 L85 5 Q90 5 90 10 L90 25' fill='none' stroke='%23059669' stroke-width='1.5' opacity='0.18'/%3E%3Ccircle cx='42' cy='32' r='6' fill='%23059669' opacity='0.10'/%3E%3Ccircle cx='82' cy='32' r='6' fill='%23059669' opacity='0.10'/%3E%3Ccircle cx='62' cy='90' r='6' fill='%23059669' opacity='0.08'/%3E%3C/svg%3E")`,

  hops: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='20' cy='25' r='4' fill='%23f59e0b' opacity='0.12'/%3E%3Ccircle cx='20' cy='25' r='2' fill='%23f59e0b' opacity='0.08'/%3E%3Ccircle cx='70' cy='55' r='5' fill='%23f59e0b' opacity='0.10'/%3E%3Ccircle cx='70' cy='55' r='2.5' fill='%23f59e0b' opacity='0.07'/%3E%3Ccircle cx='40' cy='75' r='3.5' fill='%23f59e0b' opacity='0.11'/%3E%3Ccircle cx='85' cy='20' r='3' fill='%23f59e0b' opacity='0.09'/%3E%3Cline x1='20' y1='29' x2='20' y2='55' stroke='%23f59e0b' stroke-width='0.8' opacity='0.08'/%3E%3Cline x1='70' y1='60' x2='70' y2='85' stroke='%23f59e0b' stroke-width='0.9' opacity='0.07'/%3E%3C/svg%3E")`,

  "wine-glasses": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='140' viewBox='0 0 100 140'%3E%3Cpath d='M25 10 L35 50 L15 50 Z' fill='none' stroke='%23dc2626' stroke-width='1.2' opacity='0.14'/%3E%3Cline x1='25' y1='50' x2='25' y2='80' stroke='%23dc2626' stroke-width='1.2' opacity='0.10'/%3E%3Cpath d='M65 10 L75 50 L55 50 Z' fill='none' stroke='%23dc2626' stroke-width='1.2' opacity='0.14'/%3E%3Cline x1='65' y1='50' x2='65' y2='80' stroke='%23dc2626' stroke-width='1.2' opacity='0.10'/%3E%3C/svg%3E")`,

  "cocktail-shaker": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='120' viewBox='0 0 100 120'%3E%3Cpath d='M40 20 L35 55 Q35 65 50 65 Q65 65 65 55 L60 20' fill='none' stroke='%23059669' stroke-width='2' opacity='0.14'/%3E%3Ccircle cx='50' cy='20' r='8' fill='none' stroke='%23059669' stroke-width='1.5' opacity='0.14'/%3E%3Cline x1='55' y1='12' x2='58' y2='8' stroke='%23059669' stroke-width='1.5' opacity='0.12'/%3E%3Ccircle cx='50' cy='85' r='3' fill='%23059669' opacity='0.06'/%3E%3C/svg%3E")`,

  // ── Nightlife / energy ──
  "neon-pulse": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%237c3aed' stroke-width='2' opacity='0.15'/%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%237c3aed' stroke-width='1' opacity='0.08'/%3E%3Ccircle cx='150' cy='100' r='25' fill='none' stroke='%23ec4899' stroke-width='2' opacity='0.13'/%3E%3Ccircle cx='150' cy='100' r='40' fill='none' stroke='%23ec4899' stroke-width='1' opacity='0.07'/%3E%3C/svg%3E")`,

  "disco-ball": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='25' cy='20' r='2' fill='%23f59e0b' opacity='0.25'/%3E%3Ccircle cx='60' cy='30' r='1.5' fill='%23f59e0b' opacity='0.2'/%3E%3Ccircle cx='40' cy='60' r='2.5' fill='%23f59e0b' opacity='0.18'/%3E%3Ccircle cx='80' cy='70' r='1.8' fill='%23f59e0b' opacity='0.22'/%3E%3Ccircle cx='15' cy='75' r='1.5' fill='%23f59e0b' opacity='0.15'/%3E%3Ccircle cx='55' cy='85' r='2' fill='%23f59e0b' opacity='0.2'/%3E%3Ccircle cx='90' cy='15' r='1.5' fill='%23f59e0b' opacity='0.18'/%3E%3Ccircle cx='10' cy='45' r='2' fill='%23f59e0b' opacity='0.16'/%3E%3C/svg%3E")`,

  "laser-grid": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Cline x1='0' y1='30' x2='150' y2='30' stroke='%237c3aed' stroke-width='0.5' opacity='0.12'/%3E%3Cline x1='0' y1='70' x2='150' y2='70' stroke='%237c3aed' stroke-width='0.5' opacity='0.10'/%3E%3Cline x1='0' y1='120' x2='150' y2='120' stroke='%237c3aed' stroke-width='0.5' opacity='0.12'/%3E%3Cline x1='50' y1='0' x2='50' y2='150' stroke='%23ec4899' stroke-width='0.5' opacity='0.10'/%3E%3Cline x1='100' y1='0' x2='100' y2='150' stroke='%23ec4899' stroke-width='0.5' opacity='0.10'/%3E%3C/svg%3E")`,

  "bass-waves": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'%3E%3Cpath d='M0 50 Q25 20 50 50 Q75 80 100 50 Q125 20 150 50 Q175 80 200 50' fill='none' stroke='%237c3aed' stroke-width='1.5' opacity='0.15'/%3E%3Cpath d='M0 60 Q25 30 50 60 Q75 90 100 60 Q125 30 150 60 Q175 90 200 60' fill='none' stroke='%237c3aed' stroke-width='1' opacity='0.09'/%3E%3C/svg%3E")`,

  // ── Elegant / upscale ──
  "gold-accents": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cline x1='0' y1='10' x2='100' y2='10' stroke='%23f59e0b' stroke-width='0.5' opacity='0.12'/%3E%3Cline x1='0' y1='90' x2='100' y2='90' stroke='%23f59e0b' stroke-width='0.5' opacity='0.12'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23f59e0b' stroke-width='0.3' opacity='0.08'/%3E%3Ccircle cx='50' cy='50' r='15' fill='none' stroke='%23f59e0b' stroke-width='0.5' opacity='0.10'/%3E%3C/svg%3E")`,

  marble: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cpath d='M20 80 Q60 40 100 80 Q140 120 180 80' fill='none' stroke='%239ca3af' stroke-width='0.6' opacity='0.10'/%3E%3Cpath d='M0 120 Q50 60 100 120 Q150 180 200 120' fill='none' stroke='%239ca3af' stroke-width='0.4' opacity='0.07'/%3E%3Cpath d='M10 160 Q60 100 120 160 Q170 200 200 160' fill='none' stroke='%239ca3af' stroke-width='0.5' opacity='0.08'/%3E%3C/svg%3E")`,

  velvet: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='v' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23dc2626' stop-opacity='0.06'/%3E%3Cstop offset='100%25' stop-color='%237c3aed' stop-opacity='0.08'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' fill='url(%23v)'/%3E%3C/svg%3E")`,

  "champagne-bubbles": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'%3E%3Ccircle cx='30' cy='30' r='3' fill='%23f59e0b' opacity='0.15'/%3E%3Ccircle cx='60' cy='20' r='4' fill='%23f59e0b' opacity='0.12'/%3E%3Ccircle cx='90' cy='40' r='2.5' fill='%23f59e0b' opacity='0.14'/%3E%3Ccircle cx='20' cy='70' r='5' fill='%23f59e0b' opacity='0.10'/%3E%3Ccircle cx='80' cy='80' r='3.5' fill='%23f59e0b' opacity='0.13'/%3E%3Ccircle cx='50' cy='100' r='4' fill='%23f59e0b' opacity='0.11'/%3E%3Ccircle cx='100' cy='120' r='3' fill='%23f59e0b' opacity='0.12'/%3E%3Ccircle cx='35' cy='130' r='2' fill='%23f59e0b' opacity='0.14'/%3E%3C/svg%3E")`,

  // ── Casual / cozy ──
  "wood-grain": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='40' viewBox='0 0 200 40'%3E%3Cpath d='M0 10 Q50 8 100 12 Q150 16 200 10' fill='none' stroke='%2392480e' stroke-width='0.8' opacity='0.10'/%3E%3Cpath d='M0 20 Q50 18 100 22 Q150 24 200 20' fill='none' stroke='%2392480e' stroke-width='0.6' opacity='0.08'/%3E%3Cpath d='M0 30 Q60 28 120 32 Q180 34 200 30' fill='none' stroke='%2392480e' stroke-width='0.5' opacity='0.07'/%3E%3C/svg%3E")`,

  "cozy-lights": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'%3E%3Ccircle cx='20' cy='20' r='6' fill='%23f59e0b' opacity='0.12'/%3E%3Ccircle cx='60' cy='15' r='5' fill='%23f59e0b' opacity='0.10'/%3E%3Ccircle cx='100' cy='20' r='7' fill='%23f59e0b' opacity='0.13'/%3E%3Ccircle cx='40' cy='45' r='6' fill='%23f59e0b' opacity='0.09'/%3E%3Ccircle cx='80' cy='42' r='5' fill='%23f59e0b' opacity='0.10'/%3E%3C/svg%3E")`,

  "rooftop-sunset": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120' viewBox='0 0 200 120'%3E%3Cdefs%3E%3ClinearGradient id='rs' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f59e0b' stop-opacity='0.06'/%3E%3Cstop offset='50%25' stop-color='%23ec4899' stop-opacity='0.06'/%3E%3Cstop offset='100%25' stop-color='%237c3aed' stop-opacity='0.10'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='120' fill='url(%23rs)'/%3E%3Cpath d='M0 90 L50 60 L100 75 L150 55 L200 70 L200 120 L0 120 Z' fill='%231a1a1a' opacity='0.6'/%3E%3C/svg%3E")`,

  // ── Party / celebration ──
  "confetti-burst": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect x='25' y='15' width='8' height='3' rx='1' fill='%237c3aed' opacity='0.18' transform='rotate(30 29 16)'/%3E%3Crect x='80' y='20' width='6' height='2.5' rx='1' fill='%23ec4899' opacity='0.16' transform='rotate(-25 83 21)'/%3E%3Crect x='110' y='60' width='7' height='3' rx='1' fill='%23059669' opacity='0.17' transform='rotate(45 113 61)'/%3E%3Crect x='15' y='80' width='5' height='2.5' rx='1' fill='%23f59e0b' opacity='0.19' transform='rotate(-40 17 81)'/%3E%3Crect x='60' y='100' width='9' height='3' rx='1' fill='%237c3aed' opacity='0.15' transform='rotate(15 64 101)'/%3E%3Ccircle cx='50' cy='40' r='2.5' fill='%23ec4899' opacity='0.16'/%3E%3Ccircle cx='100' cy='90' r='2' fill='%23f59e0b' opacity='0.18'/%3E%3Ccircle cx='130' cy='30' r='3' fill='%23059669' opacity='0.14'/%3E%3Ccircle cx='35' cy='110' r='2' fill='%237c3aed' opacity='0.16'/%3E%3C/svg%3E")`,

  fireworks: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Cline x1='50' y1='40' x2='35' y2='15' stroke='%23f59e0b' stroke-width='1' opacity='0.14'/%3E%3Cline x1='50' y1='40' x2='65' y2='15' stroke='%23f59e0b' stroke-width='1' opacity='0.12'/%3E%3Cline x1='50' y1='40' x2='20' y2='35' stroke='%23f59e0b' stroke-width='1' opacity='0.10'/%3E%3Cline x1='50' y1='40' x2='80' y2='35' stroke='%23f59e0b' stroke-width='1' opacity='0.10'/%3E%3Ccircle cx='50' cy='40' r='3' fill='%23f59e0b' opacity='0.18'/%3E%3C/svg%3E")`,

  "balloon-pop": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='140' viewBox='0 0 100 140'%3E%3Cellipse cx='30' cy='35' rx='12' ry='16' fill='none' stroke='%23ec4899' stroke-width='1.2' opacity='0.12'/%3E%3Cline x1='30' y1='51' x2='28' y2='65' stroke='%23ec4899' stroke-width='0.8' opacity='0.08'/%3E%3Cellipse cx='65' cy='30' rx='10' ry='14' fill='none' stroke='%237c3aed' stroke-width='1.2' opacity='0.12'/%3E%3Cline x1='65' y1='44' x2='63' y2='58' stroke='%237c3aed' stroke-width='0.8' opacity='0.08'/%3E%3C/svg%3E")`,

  // ── Music / events ──
  soundwaves: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'%3E%3Cpath d='M60 10 L60 70' stroke='%237c3aed' stroke-width='3' opacity='0.10'/%3E%3Cpath d='M50 20 Q40 40 50 60' fill='none' stroke='%237c3aed' stroke-width='1.5' opacity='0.10'/%3E%3Cpath d='M70 20 Q80 40 70 60' fill='none' stroke='%237c3aed' stroke-width='1.5' opacity='0.10'/%3E%3Cpath d='M36 30 Q20 40 36 50' fill='none' stroke='%237c3aed' stroke-width='1.2' opacity='0.08'/%3E%3Cpath d='M84 30 Q100 40 84 50' fill='none' stroke='%237c3aed' stroke-width='1.2' opacity='0.08'/%3E%3C/svg%3E")`,

  "vinyl-grooves": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='35' fill='none' stroke='%231a1a1a' stroke-width='20' opacity='0.12'/%3E%3Ccircle cx='50' cy='50' r='28' fill='none' stroke='%23374151' stroke-width='1' opacity='0.10'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23374151' stroke-width='1' opacity='0.10'/%3E%3Ccircle cx='50' cy='50' r='12' fill='none' stroke='%23374151' stroke-width='1' opacity='0.10'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%23374151' opacity='0.15'/%3E%3C/svg%3E")`,

  "stage-lights": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='30' r='15' fill='%237c3aed' opacity='0.06'/%3E%3Ccircle cx='40' cy='40' r='10' fill='%23ec4899' opacity='0.05'/%3E%3Ccircle cx='160' cy='40' r='10' fill='%23f59e0b' opacity='0.05'/%3E%3Cpath d='M100 45 L60 200 L140 200 Z' fill='%237c3aed' opacity='0.02'/%3E%3Cpath d='M40 50 L10 200 L70 200 Z' fill='%23ec4899' opacity='0.02'/%3E%3Cpath d='M160 50 L130 200 L190 200 Z' fill='%23f59e0b' opacity='0.02'/%3E%3C/svg%3E")`,

  // ── Seasonal ──
  "summer-vibes": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='100' viewBox='0 0 150 100'%3E%3Ccircle cx='120' cy='25' r='12' fill='%23f59e0b' opacity='0.12'/%3E%3Ccircle cx='120' cy='25' r='16' fill='%23f59e0b' opacity='0.06'/%3E%3Cpath d='M0 80 Q30 60 60 75 Q90 90 120 70 Q140 58 150 65 L150 100 L0 100 Z' fill='%23059669' opacity='0.06'/%3E%3C/svg%3E")`,

  "winter-frost": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cline x1='20' y1='10' x2='20' y2='30' stroke='%239ca3af' stroke-width='0.8' opacity='0.12'/%3E%3Cline x1='10' y1='20' x2='30' y2='20' stroke='%239ca3af' stroke-width='0.8' opacity='0.12'/%3E%3Cline x1='70' y1='50' x2='70' y2='70' stroke='%239ca3af' stroke-width='0.8' opacity='0.10'/%3E%3Cline x1='60' y1='60' x2='80' y2='60' stroke='%239ca3af' stroke-width='0.8' opacity='0.10'/%3E%3Ccircle cx='45' cy='80' r='1.5' fill='%239ca3af' opacity='0.12'/%3E%3Ccircle cx='85' cy='30' r='1.5' fill='%239ca3af' opacity='0.10'/%3E%3C/svg%3E")`,

  "autumn-leaves": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M20 20 Q25 10 35 15 Q30 25 20 20Z' fill='%23f59e0b' opacity='0.10'/%3E%3Cpath d='M80 30 Q85 20 95 25 Q90 35 80 30Z' fill='%23dc2626' opacity='0.08'/%3E%3Cpath d='M50 70 Q55 58 65 63 Q60 75 50 70Z' fill='%23f59e0b' opacity='0.09'/%3E%3Cpath d='M100 80 Q105 70 115 75 Q110 85 100 80Z' fill='%23dc2626' opacity='0.07'/%3E%3C/svg%3E")`,

  "stripes-bg": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cline x1='0' y1='40' x2='40' y2='0' stroke='%23059669' stroke-width='2' opacity='0.08'/%3E%3Cline x1='-10' y1='40' x2='30' y2='0' stroke='%23059669' stroke-width='1.5' opacity='0.06'/%3E%3Cline x1='10' y1='40' x2='50' y2='0' stroke='%23059669' stroke-width='1' opacity='0.05'/%3E%3C/svg%3E")`,
};

// ---- Category-to-background mapping ----

export type ShareCategory =
  | "cocktails" | "craft-beer" | "wine-bar"
  | "live-music" | "dj-set" | "club-night"
  | "sports-bar" | "lounge" | "rooftop" | "pub"
  | "karaoke" | "brunch" | "fine-dining" | "dance-club";

export type ShareOccasion =
  | "after-work" | "friday-night" | "weekend" | "date-night"
  | "girls-night" | "party" | "chill-vibes" | "late-night"
  | "happy-hour" | "game-night" | "brunch-time" | "celebration";

// Which backgrounds suit each category (first = default)
export const CATEGORY_BACKGROUNDS: Record<ShareCategory, SvgBackground[]> = {
  cocktails: ["cocktail-shaker", "gold-accents", "neon-pulse"],
  "craft-beer": ["hops", "wood-grain", "cozy-lights"],
  "wine-bar": ["wine-glasses", "velvet", "champagne-bubbles"],
  "live-music": ["soundwaves", "stage-lights", "bass-waves"],
  "dj-set": ["bass-waves", "laser-grid", "neon-pulse"],
  "club-night": ["laser-grid", "neon-pulse", "disco-ball"],
  "sports-bar": ["stripes-bg", "confetti-burst", "cozy-lights"],
  lounge: ["velvet", "gold-accents", "marble"],
  rooftop: ["rooftop-sunset", "summer-vibes", "gold-accents"],
  pub: ["wood-grain", "cheers", "cozy-lights"],
  karaoke: ["stage-lights", "disco-ball", "confetti-burst"],
  brunch: ["champagne-bubbles", "summer-vibes", "marble"],
  "fine-dining": ["marble", "gold-accents", "velvet"],
  "dance-club": ["bass-waves", "laser-grid", "disco-ball"],
};

// Which backgrounds suit each occasion
export const OCCASION_BACKGROUNDS: Record<ShareOccasion, SvgBackground[]> = {
  "after-work": ["cozy-lights", "wood-grain", "cheers"],
  "friday-night": ["neon-pulse", "disco-ball", "confetti-burst"],
  weekend: ["confetti-burst", "summer-vibes", "fireworks"],
  "date-night": ["velvet", "gold-accents", "champagne-bubbles"],
  "girls-night": ["disco-ball", "neon-pulse", "balloon-pop"],
  party: ["confetti-burst", "fireworks", "balloon-pop"],
  "chill-vibes": ["cozy-lights", "summer-vibes", "wood-grain"],
  "late-night": ["neon-pulse", "bass-waves", "laser-grid"],
  "happy-hour": ["cheers", "cocktail-shaker", "hops"],
  "game-night": ["confetti-burst", "cozy-lights", "stripes-bg"],
  "brunch-time": ["champagne-bubbles", "summer-vibes", "marble"],
  celebration: ["fireworks", "champagne-bubbles", "confetti-burst"],
};

// Helper: best background for given category + occasion
export function bgForCategoryAndOccasion(
  category?: ShareCategory,
  occasion?: ShareOccasion,
): SvgBackground {
  // Try occasion first, then category, fall back to cheers
  if (occasion && OCCASION_BACKGROUNDS[occasion]?.[0]) {
    return OCCASION_BACKGROUNDS[occasion][0];
  }
  if (category && CATEGORY_BACKGROUNDS[category]?.[0]) {
    return CATEGORY_BACKGROUNDS[category][0];
  }
  return "cheers";
}

/** All backgrounds for a category (for picker UI) */
export function backgroundsForCategory(category?: ShareCategory): SvgBackground[] {
  if (category && CATEGORY_BACKGROUNDS[category]) {
    return CATEGORY_BACKGROUNDS[category];
  }
  return ["cheers", "neon-pulse", "gold-accents", "wood-grain", "confetti-burst", "soundwaves"];
}

// ---- Labels ----

export const CATEGORY_LABELS: Record<ShareCategory, { fi: string; en: string; emoji: string }> = {
  cocktails: { fi: "Cocktailit", en: "Cocktails", emoji: "🍸" },
  "craft-beer": { fi: "Käsityöoluet", en: "Craft Beer", emoji: "🍺" },
  "wine-bar": { fi: "Viinibaari", en: "Wine Bar", emoji: "🍷" },
  "live-music": { fi: "Elävä musiikki", en: "Live Music", emoji: "🎵" },
  "dj-set": { fi: "DJ Set", en: "DJ Set", emoji: "🎧" },
  "club-night": { fi: "Klubi-ilta", en: "Club Night", emoji: "🪩" },
  "sports-bar": { fi: "Urheilubaari", en: "Sports Bar", emoji: "⚽" },
  lounge: { fi: "Lounge", en: "Lounge", emoji: "🛋️" },
  rooftop: { fi: "Kattoterassi", en: "Rooftop", emoji: "🌇" },
  pub: { fi: "Pubi", en: "Pub", emoji: "🍻" },
  karaoke: { fi: "Karaoke", en: "Karaoke", emoji: "🎤" },
  brunch: { fi: "Brunssi", en: "Brunch", emoji: "🥂" },
  "fine-dining": { fi: "Fine Dining", en: "Fine Dining", emoji: "🍽️" },
  "dance-club": { fi: "Tanssiklubi", en: "Dance Club", emoji: "💃" },
};

export const OCCASION_LABELS: Record<ShareOccasion, { fi: string; en: string; emoji: string }> = {
  "after-work": { fi: "After Work", en: "After Work", emoji: "🕔" },
  "friday-night": { fi: "Perjantai-ilta", en: "Friday Night", emoji: "🔥" },
  weekend: { fi: "Viikonloppu", en: "Weekend", emoji: "🎉" },
  "date-night": { fi: "Treffi-ilta", en: "Date Night", emoji: "💕" },
  "girls-night": { fi: "Tyttöjen ilta", en: "Girls Night", emoji: "💃" },
  party: { fi: "Bileet", en: "Party", emoji: "🥳" },
  "chill-vibes": { fi: "Chillailu", en: "Chill Vibes", emoji: "😌" },
  "late-night": { fi: "Myöhäisilta", en: "Late Night", emoji: "🌙" },
  "happy-hour": { fi: "Happy Hour", en: "Happy Hour", emoji: "⏰" },
  "game-night": { fi: "Peli-ilta", en: "Game Night", emoji: "🎲" },
  "brunch-time": { fi: "Brunssi-aika", en: "Brunch Time", emoji: "🥐" },
  celebration: { fi: "Juhlat", en: "Celebration", emoji: "🎊" },
};

/** Map a promotion's target audience to a suggested occasion */
export function occasionForAudience(audience: string): ShareOccasion | null {
  switch (audience) {
    case "WEEKEND": return "weekend";
    case "WEEKDAY": return "after-work";
    case "STUDENTS": return "party";
    case "VIP": return "date-night";
    default: return null;
  }
}

// Keep backward compat alias
export const bgForType = (type: string): SvgBackground => {
  const map: Record<string, ShareCategory> = {
    DRINK_SPECIAL: "cocktails",
    HAPPY_HOUR: "cocktails",
    FOOD_SPECIAL: "brunch",
    LADIES_NIGHT: "club-night",
    THEME_NIGHT: "club-night",
    VIP_OFFER: "lounge",
    COVER_DISCOUNT: "club-night",
    LIVE_MUSIC_EVENT: "live-music",
    GAME_NIGHT: "sports-bar",
    SEASONAL: "brunch",
  };
  const cat = map[type];
  return cat ? CATEGORY_BACKGROUNDS[cat][0] : "cheers";
};
