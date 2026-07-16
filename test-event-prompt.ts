// Smoke test for prompt builders (Steps 1-3 of Gap 12)
// Run: npx tsx test-event-prompt.ts

import { buildEventPrompt, inferEventCategory } from "./src/lib/prompts/build-event-prompt";
import { buildPassPrompt, inferPassCategory } from "./src/lib/prompts/build-pass-prompt";
import { buildSocialPrompt } from "./src/lib/prompts/build-social-prompt";

// ---- Test 1: Category inference ----
console.log("=== Category Inference ===\n");
const briefs = [
  "live jazz trio this saturday, 8pm",
  "DJ set with house music all night long",
  "pub quiz every tuesday, teams of 4, prizes",
  "watching the champions league final on big screen",
  "whiskey tasting with master distiller, limited spots",
  "birthday party for 20 people, private area",
  "open mic for comedians and poets",
  "karaoke night with prizes and drink specials",
  "80s retro theme night with costume contest",
  "standup comedy showcase, 3 comedians",
];
for (const b of briefs) {
  console.log(`  "${b}" → ${inferEventCategory(b)}`);
}

// ---- Test 2: Full prompt generation (English) ----
console.log("\n\n=== English Prompt Generation ===\n");
const en = buildEventPrompt({
  barName: "Mikko's Bar",
  barType: "BAR",
  district: "Kallio",
  cityName: "Helsinki",
  amenities: ["terrace", "live music", "sound system", "dance floor"],
  priceRange: "MODERATE",
  description:
    "Kallio's neighborhood living room — craft beer, live music, and Helsinki's best terrace.",
  musicTags: ["jazz", "indie", "folk"],
  vipEnabled: false,
  userBrief: "Live jazz trio this Saturday, starts 8pm, free entry, cocktail specials",
  tone: "WARM_INVITING",
  language: "en",
});

console.log("--- SYSTEM PROMPT (first 600 chars) ---");
console.log(en.systemPrompt.slice(0, 600));
console.log("...\n");

console.log("--- USER PROMPT (first 500 chars) ---");
console.log(en.userPrompt.slice(0, 500));
console.log("...\n");

console.log("--- Event category ---");
console.log(en.eventCategory);

// ---- Test 3: Finnish output ----
console.log("\n\n=== Finnish Prompt Generation ===\n");
const fi = buildEventPrompt({
  barName: "Mikon Baari",
  barType: "NIGHTCLUB",
  district: "Kamppi",
  cityName: "Helsinki",
  amenities: ["dj booth", "dance floor", "sound system", "large capacity"],
  priceRange: "EXPENSIVE",
  vipEnabled: true,
  userBrief: "DJ-ilta lauantaina, house ja techno, klo 22-04, liput 10€",
  tone: "BOLD_ENERGETIC",
  language: "fi",
});

console.log("--- SYSTEM PROMPT (first 600 chars, FI) ---");
console.log(fi.systemPrompt.slice(0, 600));
console.log("...\n");

console.log("--- USER PROMPT (first 500 chars, FI) ---");
console.log(fi.userPrompt.slice(0, 500));
console.log("...\n");

console.log("--- Event category ---");
console.log(fi.eventCategory);

// ---- Test 4: No tone, no amenities ----
console.log("\n\n=== Minimal input (no tone, no amenities) ===\n");
const minimal = buildEventPrompt({
  barName: "Test Bar",
  barType: "BAR",
  userBrief: "Quiz night on Thursday, general knowledge, teams of up to 6",
  language: "en",
});

console.log("--- System prompt length ---");
console.log(minimal.systemPrompt.length, "chars");
console.log("--- User prompt length ---");
console.log(minimal.userPrompt.length, "chars");
console.log("--- Event category ---");
console.log(minimal.eventCategory);

// ---- Test 5: Pass prompt builder ----
console.log("\n\n=== Pass Prompt Builder ===\n");
const passCategoryTests = [
  "skip the line pass for saturday, 10€",
  "bottle service with sparkler, 150€, includes table",
  "drink package: 3 drinks for 25€",
  "table reservation for up to 8 people",
  "group package for birthday, 20 people",
];
for (const b of passCategoryTests) {
  console.log(`  "${b}" → ${inferPassCategory(b)}`);
}

const pass = buildPassPrompt({
  barName: "Mikko's Bar",
  barType: "NIGHTCLUB",
  district: "Kallio",
  cityName: "Helsinki",
  amenities: ["vip", "dj booth", "private rooms"],
  priceRange: "EXPENSIVE",
  vipEnabled: true,
  userBrief: "Bottle service for Saturdays, includes premium bottle, mixers, reserved table, 150€",
  tone: "ELEGANT_PREMIUM",
  language: "en",
});
console.log("--- Pass system prompt (first 500 chars) ---");
console.log(pass.systemPrompt.slice(0, 500));
console.log("...\n");

// ---- Test 6: Social prompt builder ----
console.log("\n=== Social Prompt Builder ===\n");
const socialIg = buildSocialPrompt({
  barName: "Mikko's Bar",
  title: "Live Jazz Trio — This Saturday",
  description: "Smooth jazz, craft cocktails, and Kallio's best terrace. Free entry, music from 8pm.",
  sourceType: "event",
  details: { date: "Saturday, July 19", time: "8pm-11pm", price: "Free entry", location: "Kallio" },
  platform: "instagram",
  language: "en",
});
console.log("--- Instagram system prompt (first 400 chars) ---");
console.log(socialIg.systemPrompt.slice(0, 400));
console.log("...\n");

const socialFb = buildSocialPrompt({
  barName: "Mikko's Bar",
  title: "VIP Skip-the-Line Pass",
  description: "Walk straight in on Friday and Saturday nights. Priority entry, no waiting, show this at the door. €10 per person, per night.",
  sourceType: "pass",
  details: { price: "€10", location: "Kallio, Helsinki" },
  platform: "facebook",
  language: "fi",
});
console.log("--- Facebook system prompt (first 400 chars, FI) ---");
console.log(socialFb.systemPrompt.slice(0, 400));
console.log("...\n");

console.log("✅ All smoke tests completed");
