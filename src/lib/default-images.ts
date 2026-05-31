// src/lib/default-images.ts
// Curated default images for events, promotions, and VIP passes.
// Images live in /public/defaults/ as themed SVG placeholders.
// Replace with real photography before production launch.

export interface DefaultImage {
  name: string;
  path: string;
  label: string;
  /** Which content types this image is suited for */
  types: ("event" | "promotion" | "pass")[];
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
    types: ["event", "promotion", "pass"],
  },
];

/**
 * Get default images filtered by content type.
 * Returns all images that match at least one of the given types.
 */
export function getDefaultImagesForType(
  type: "event" | "promotion" | "pass",
): DefaultImage[] {
  return DEFAULT_IMAGES.filter((img) => img.types.includes(type));
}
