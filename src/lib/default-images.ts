// src/lib/default-images.ts
// Curated default images for events, promotions, and VIP passes.
// Images live in /public/defaults/ as themed SVG placeholders.
// Replace with real photography before production launch.

export interface DefaultImage {
  name: string;
  path: string;
  label: string;
  /** Which content types this image is suited for */
  types: ("event" | "promotion" | "pass" | "campaign" | "brand")[];
}

export const DEFAULT_IMAGES: DefaultImage[] = [
  {
    name: "cocktails",
    path: "/defaults/cocktails.svg",
    label: "Cocktails",
    types: ["event", "promotion"],
  },
  {
    name: "live-music",
    path: "/defaults/live-music.svg",
    label: "Live Music",
    types: ["event"],
  },
  {
    name: "party",
    path: "/defaults/party.svg",
    label: "Party Night",
    types: ["event", "promotion"],
  },
  {
    name: "beer",
    path: "/defaults/beer.svg",
    label: "Beer Selection",
    types: ["promotion", "event"],
  },
  {
    name: "vip",
    path: "/defaults/vip.svg",
    label: "VIP Experience",
    types: ["pass", "event"],
  },
  {
    name: "wine",
    path: "/defaults/wine.svg",
    label: "Wine Evening",
    types: ["event", "promotion"],
  },
  {
    name: "special-offer",
    path: "/defaults/special-offer.svg",
    label: "Special Offer",
    types: ["promotion"],
  },
  {
    name: "karaoke",
    path: "/defaults/karaoke.svg",
    label: "Karaoke Night",
    types: ["event"],
  },
  {
    name: "sports",
    path: "/defaults/sports.svg",
    label: "Sports Viewing",
    types: ["event", "promotion"],
  },
  {
    name: "outdoor-terrace",
    path: "/defaults/outdoor-terrace.svg",
    label: "Outdoor Terrace",
    types: ["event", "promotion"],
  },
  {
    name: "dj-night",
    path: "/defaults/dj-night.svg",
    label: "DJ Night",
    types: ["event"],
  },
  {
    name: "bar-ambiance",
    path: "/defaults/bar-ambiance.svg",
    label: "Bar Ambiance",
    types: ["event", "promotion", "pass", "campaign"],
  },
  {
    name: "craft-beer",
    path: "/defaults/craft-beer.svg",
    label: "Craft Beer",
    types: ["event", "promotion"],
  },
  {
    name: "club-night",
    path: "/defaults/club-night.svg",
    label: "Club Night",
    types: ["event", "promotion"],
  },
  {
    name: "lounge",
    path: "/defaults/lounge.svg",
    label: "Lounge Vibes",
    types: ["event"],
  },
  {
    name: "rooftop",
    path: "/defaults/rooftop.svg",
    label: "Rooftop Sunset",
    types: ["event", "promotion"],
  },
  {
    name: "pub",
    path: "/defaults/pub.svg",
    label: "Pub Evening",
    types: ["event", "promotion"],
  },
  {
    name: "brunch",
    path: "/defaults/brunch.svg",
    label: "Brunch Time",
    types: ["event", "promotion"],
  },
  {
    name: "fine-dining",
    path: "/defaults/fine-dining.svg",
    label: "Fine Dining",
    types: ["event", "promotion"],
  },
  {
    name: "game-night",
    path: "/defaults/game-night.svg",
    label: "Game Night",
    types: ["event", "promotion"],
  },
  {
    name: "comedy-show",
    path: "/defaults/comedy-show.svg",
    label: "Comedy Show",
    types: ["event"],
  },
  {
    name: "dance-club",
    path: "/defaults/dance-club.svg",
    label: "Dance Club",
    types: ["event", "promotion"],
  },
  {
    name: "halloween",
    path: "/defaults/halloween.svg",
    label: "Halloween",
    types: ["event", "promotion"],
  },
  {
    name: "anniversary",
    path: "/defaults/anniversary.svg",
    label: "Anniversary",
    types: ["event", "promotion"],
  },
  {
    name: "summer",
    path: "/defaults/summer.svg",
    label: "Summer Vibes",
    types: ["event", "promotion"],
  },
  {
    name: "christmas",
    path: "/defaults/christmas.svg",
    label: "Christmas",
    types: ["event", "promotion"],
  },
  {
    name: "new-years",
    path: "/defaults/new-years.svg",
    label: "New Year's Eve",
    types: ["event", "promotion"],
  },
  {
    name: "valentines",
    path: "/defaults/valentines.svg",
    label: "Valentine's Day",
    types: ["event", "promotion"],
  },
  {
    name: "vappu",
    path: "/defaults/vappu.svg",
    label: "Vappu / May Day",
    types: ["event", "promotion"],
  },
  {
    name: "easter",
    path: "/defaults/easter.svg",
    label: "Easter",
    types: ["event", "promotion"],
  },
  {
    name: "midsummer",
    path: "/defaults/midsummer.svg",
    label: "Juhannus",
    types: ["event", "promotion"],
  },
];

/**
 * Get default images filtered by content type.
 * Returns all images that match at least one of the given types.
 */
export function getDefaultImagesForType(
  type: "event" | "promotion" | "pass" | "campaign" | "brand",
): DefaultImage[] {
  return DEFAULT_IMAGES.filter((img) => img.types.includes(type));
}
