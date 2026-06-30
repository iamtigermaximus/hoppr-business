# Hoppr Business — Agency Replacement Roadmap

## Overview

A marketing agency does three things for a bar: plans what to do and when, executes across channels, and proves it worked. Hoppr currently provides creation tools (AI Create Hub, campaigns, passes) but the bar owner drives everything manually. This roadmap turns Hoppr from a passive tool into a proactive agency replacement.

---

## Ordering: Easiest to Hardest

| # | Feature | Effort | Depends On |
|---|---------|--------|------------|
| 1 | One-Tap Social Export | Easy | Nothing |
| 2 | Performance Benchmarking | Easy-Med | Nothing |
| 3 | ROI Dashboard | Medium | Nothing |
| 4 | Push Notifications to Consumers | Hard | Nothing (new infra) |
| 5 | Automated Retargeting | Hard | Push (#4) |
| 6 | AI Marketing Scheduler | Hardest | Analytics + Push (#3, #4) |

---

## Feature #1: One-Tap Social Export

### Current State

A bar owner creates a promotion or event in the Create Hub. It goes live on Hoppr's consumer feed — and nowhere else. If they want it on Instagram or Facebook, they have to manually recreate the post: copy the text, find or take a photo, design a graphic, write a caption, post it separately. This is exactly the busywork that marketing agencies charge for.

### What We're Adding

Two things appear after a promo/event is created:

1. **Share Card image generator** — A clean, branded image with the bar's logo (if uploaded), the promo/event title, date/time, key details, and a QR code that links to the consumer page. They download it and post to Instagram/Facebook.
2. **AI-generated caption** — Pre-written social media copy in Finnish and English, tailored to the content type. They tap to copy and paste into their post.

Both appear on the success screen after creating content, and also on the existing content list (promotions page, events page) via a small share icon.

Beyond manual download: integrate Meta Graph API so the bar owner connects their Instagram/Facebook once, then taps one button to publish directly — no download, no copy-paste, no app-switching. Eventually, the Marketing Scheduler auto-posts at the optimal time.

### How It Relates to Everything

- Uses the Create Hub's existing form data (title, description, dates, images)
- Uses the bar profile (name, logo, address) for branding
- Links to the consumer app via QR code (drives app installs)
- Feeds into the analytics dashboard (track how many times share cards were generated/downloaded)
- Eventually feeds into the Marketing Scheduler (auto-post at optimal time)

### How It's More Intelligent

An agency would charge €50-200 to design a single promo graphic. The AI generates it instantly from the same data you already typed into the Create Hub. No design skills needed, no Canva, no waiting 3 days for a freelancer.

### How It's Better Than an Agency

A bar paying €800/month for social media management gets maybe 12-15 posts. Hoppr gives them unlimited share cards, generated in seconds, for free as part of their subscription. The same content that's already on Hoppr now reaches Instagram/Facebook audiences with zero extra work.

### Outcome & Impact

A bar creates 3 promos and 2 events per week. Before: posts only on Hoppr. After: those 5 pieces of content also hit Instagram and Facebook, reaching 3-5x more people. The QR code on every image drives new users into the Hoppr consumer app. The bar's Instagram looks active and professional without hiring anyone.

### Scenario

Tiina creates a "Saturday DJ Night" event in the Create Hub. The AI fills in the title, description, and time. She picks a DJ night default image from the 30-image library. On the success screen, she sees:

- **Share Card preview** — a polished dark-themed card with Apollo's logo badge, "Saturday DJ Night — Apollo" in bold, the date/time, a QR code linking to the consumer event page, and `apollo · hoppr.fi` at the bottom.
- **AI Caption (FI)** — "Saturday DJ Night Apollossa 5.7. klo 22! 🎵 Liity mukaan Hopprissa: hoppr.fi/e/apollo-dj-night #hoppr #helsinki #tapahtumat"
- **AI Caption (EN)** — "Saturday DJ Night at Apollo on Jul 5 at 22:00! Join on Hoppr: hoppr.fi/e/apollo-dj-night #hoppr #helsinki #events"

She taps "Post to Instagram." Done. Previously: open Instagram, create post, upload image (find it first), write caption (think of hashtags), post. Open Facebook, repeat. Five minutes of friction, gone.

---

## Feature #2: Performance Benchmarking

### Current State

Bar analytics show individual venue metrics: your promo views, your event joins, your follower count. There is no cross-bar comparison. A bar owner cannot answer the most natural question: "Am I doing well compared to other bars like mine?" They operate in the dark — no idea if 340 promo views is good or bad, if +12 followers this week is normal or terrible.

### What We're Adding

A benchmarking dashboard that compares each bar against peers in the same district, same bar type (cocktail bar, pub, club), and same price range. Percentile rankings for every key metric: promo views, event joins, follower growth rate, campaign click-through rate. Specific, data-backed recommendations — not generic tips, but "bars like yours that do X see Y result, and you're not doing X."

The dashboard answers: where am I winning, where am I losing, and what should I do about it? Agencies charge for quarterly benchmarking reports. Hoppr delivers them continuously, for free.

### How It Relates to Everything

- Uses existing bar analytics data (views, joins, followers, campaign CTR)
- Segments bars by district, type, and price range for fair comparisons
- Recommendation engine ties directly to Hoppr features: "Post your first event" → links to Create Hub. "Your campaign CTR is above average" → suggests increasing budget
- Feeds into the AI Marketing Scheduler: the scheduler uses percentile data to know whether a bar needs aggressive promotion or is already performing well
- Benchmarks prove Hoppr's value: bar sees they went from bottom 30% to top 20% after using the platform

### How It's More Intelligent

A marketing agency would manually compile a quarterly report by pulling data from multiple sources, formatting slides, and writing commentary. Hoppr does it live, for every bar, every day — and ties every recommendation to a specific action the bar can take immediately inside the app.

### How It's Better Than an Agency

Agency benchmarking is slow (quarterly), expensive (hours of analyst time), and static (a PDF you read once). Hoppr benchmarking is real-time, free, and interactive — tap a recommendation, land on the page where you can fix it.

### Outcome & Impact

A bar owner in Kallio sees they're top 20% for promo views but bottom 30% for event joins. The recommendation engine flags: "Bars in Kallio with at least 1 active event per week grow followers 3x faster. You haven't posted an event in 3 weeks." They tap "Create an event," use the Create Hub, and two weeks later their follower growth hits the district average. No agency report needed — Hoppr surfaced the insight and gave them the tool to act on it in the same screen.

### Scenario

Jussi runs a cocktail bar in Punavuori. He opens his benchmarking dashboard:

| Metric | Your Value | District Average | Your Rank |
|--------|-----------|-----------------|-----------|
| Promo views (month) | 340 | 210 | Top 20% ✅ |
| Event joins (month) | 12 | 28 | Bottom 30% ⚠️ |
| Follower growth (week) | +3 | +9 | Bottom 25% ⚠️ |
| Campaign CTR | 4.2% | 3.1% | Top 15% ✅ |

The recommendation panel surfaces:

> **You're missing out on follower growth.** Bars in Punavuori with at least 1 active event per week grow followers 3x faster than those without. You haven't posted an event in 3 weeks.
>
> **[Create an event →]**

Jussi taps the button. The Create Hub opens. He types "Cocktail masterclass next Thursday, 2 hours, max 15 people, €25 per person includes 3 drinks." The AI generates the event. Two weeks later, his follower growth ticks up to +8/week. He didn't need an agency report — Hoppr told him what was wrong, why it mattered, and took him exactly where to fix it.

---

## Feature #3: ROI Dashboard

### Current State

Hoppr tracks campaign budgets, impressions, clicks, promo redemptions, event joins, and QR scans. But these numbers live in separate places. A bar owner sees campaign clicks on one page, event attendees on another, and promo redemptions on a third. There is no consolidated view that answers the only question they actually care about: "Did I make money from this?"

Marketing agencies survive on this ambiguity. They report "impressions" and "engagement" because those numbers are big and unprovable. Hoppr has the data to do better — to connect spend directly to confirmed visits and estimated revenue.

### What We're Adding

A single ROI dashboard at `/bar/[id]/roi` that shows:

- **Money in:** total campaign spend for the period
- **What happened:** impressions, clicks, promo redemptions, event check-ins
- **Money out:** confirmed visits × average spend per customer = estimated revenue
- **The number:** ROI multiplier (estimated revenue ÷ spend)
- **What drove it:** breakdown of which promos, events, and campaigns contributed most

Bar owners can configure their average customer spend (default: Helsinki bar average) and export reports as PDF. The dashboard shows week-over-week and month-over-month trends, so they can see if things are improving.

### How It Relates to Everything

- Aggregates data from campaigns (spend, impressions, clicks), promotions (redemptions), events (joins/check-ins), and QR scans (confirmed door visits)
- Attribution: links QR scans and redemptions back to the campaign or promotion that drove them
- Feeds into the AI Marketing Scheduler: the scheduler uses ROI data to know which types of content and which time slots generate the best returns
- Becomes the retention feature: when a bar owner sees "I spent €120 and made €510," they don't cancel their subscription — they increase their budget

### How It's More Intelligent

Agencies report soft metrics: reach, impressions, engagement rate. These sound impressive but don't mean revenue. Hoppr reports hard metrics: confirmed door scans tied to specific campaigns, estimated revenue based on real Helsinki spending data. The bar owner sees actual return, not vanity numbers.

### How It's Better Than an Agency

Agencies have an incentive to keep ROI vague — if the bar owner knew exactly what they were getting, they might negotiate or leave. Hoppr has the opposite incentive: prove the ROI clearly, and the bar owner increases their campaign budget. Transparency is a competitive advantage.

### Outcome & Impact

A bar owner logs in at the end of the month and sees: "You spent €150 on campaigns. 1,560 impressions, 112 clicks, 41 confirmed door scans. Estimated customer value: €615 (at €15/visit). ROI: 4.1x." They think: "I made €615 from €150. Next month I'll double my budget." No agency pitch needed — the numbers do the selling.

### Scenario

Maria owns Bar Siltanen. She opens her ROI dashboard at the end of June:

| Period | Spend | Impressions | Clicks | Door Scans | Est. Revenue | ROI |
|--------|-------|-------------|--------|------------|-------------|-----|
| June | €150 | 1,560 | 112 | 41 | €615 | 4.1x |
| May | €100 | 980 | 67 | 22 | €330 | 3.3x |
| April | €80 | 720 | 41 | 14 | €210 | 2.6x |

The trend is clear: ROI is improving every month. The breakdown shows the student discount promo drove 22 of the 41 scans. The Saturday event campaign drove the rest. She sees exactly what's working.

She compares June to May: ROI went from 3.3x to 4.1x. She thinks: "This is working better every month. I'm doubling my July budget." She increases it from the same screen. No agency called her to pitch this — the numbers told the story themselves.

---

## Feature #4: Push Notifications to Consumers

### Current State

Hoppr is entirely passive. Users must open the app to see anything — new promos, upcoming events, crowd activity. There is no way to reach users directly. A bar could post the best happy hour deal in Helsinki, and the only people who see it are those who happen to open the app during the 3-hour window it's active.

This is the single biggest gap between Hoppr and a real marketing platform. A marketing tool that cannot reach its audience is a publishing tool, not a marketing tool. Push notifications are the delivery mechanism for everything else on this roadmap — without them, retargeting can't retarget, the scheduler can't remind, and loyalty can't re-engage.

### What We're Adding

Full push notification infrastructure using Firebase Cloud Messaging (FCM):

**Consumer side:**
- Permission request on first login ("Get notified about deals near you")
- Device token registration and management
- Rich notifications with images (using share card images), deep links into the app
- User preferences: opt-in per notification type, quiet hours, location awareness

**Platform side:**
- Notification service: queuing, batching, delivery tracking, rate limiting
- Notification types: promo alerts, event reminders, crowd reports, retargeting, loyalty offers, nearby recommendations, birthday offers
- Smart delivery: timezone-aware, rate-limited (max 1 promo per bar per day, max 3 total per user per day), geolocation-aware
- Analytics: delivery rate, open rate, conversion rate (opened → visited bar within 2 hours)

**Business side:**
- Bar owners see notification history and performance for their content
- No manual sending (prevents spam) — all notifications are platform-triggered based on rules

### How It Relates to Everything

- **Automated Retargeting (#5):** the delivery channel for re-engagement notifications. Cannot function without push.
- **AI Marketing Scheduler (#6):** the delivery channel for scheduled reminders, promo alerts, and crowd-response notifications. Cannot function without push.
- **ROI Dashboard (#3):** push attribution feeds back into ROI — track how many door scans came from push notifications vs organic app opens.
- **Share Cards (#1):** share card images become rich notification attachments — the same image from Instagram also appears in the push notification.
- **Consumer app growth:** notifications are the primary driver of daily active users. Users who enable notifications open the app 3-4x more often.

### How It's More Intelligent

A bar owner sending push notifications manually would: spam too much, send at wrong times, not personalize, not A/B test. Hoppr's notification engine: respects user preferences, sends at optimal times based on historical open rates, personalizes based on user behavior and location, rate-limits to prevent fatigue, and continuously measures what works.

An agency running SMS/email campaigns charges per send and has no real-time context. Hoppr's push notifications are triggered by live data: user location, crowd density, time of day, weather — context no agency can replicate at scale.

### How It's Better Than an Agency

Agencies charge for reach. Hoppr delivers reach for free as part of the platform. An agency might send a weekly email blast with a 12% open rate. Hoppr sends a push notification at 17:30 on Friday: "2-for-1 Happy Hour at Siltanen, 400m from you, ends in 30 min" — with a 40%+ open rate because it's timely, relevant, and location-aware.

### Outcome & Impact

Users receive timely, relevant notifications instead of having to remember to open the app. Bars see their content reach users directly at the moment of decision. The consumer app becomes a daily habit instead of a weekly browse. Every feature that follows on this roadmap now has a delivery channel. The platform transforms from passive publishing to active marketing.

### Scenario

It's 17:30 on a Friday. A user who follows Siltanen is walking through Kallio, 400 meters from the bar based on their last known location. Hoppr's notification engine evaluates in real-time:

- User follows Siltanen ✓
- User is within 2km of Siltanen ✓
- Siltanen has an active Happy Hour ending in 30 minutes ✓
- User hasn't received a promo notification today ✓
- User has Happy Hour notifications enabled ✓
- Historical data: this user opened 78% of Friday-afternoon promo notifications ✓

A push notification fires:

> 🍸 **2-for-1 Happy Hour ends soon**
> Siltanen — 400m from you. Valid until 18:00.
> [Open in Hoppr →]

The user taps, opens Hoppr, sees the promo, and walks 3 minutes to Siltanen. They scan the QR at the bar for their discount. Hoppr tracks: notification delivered, opened, converted to visit.

Previously: the user walks past Siltanen, never knowing about the deal. The bar loses a customer. Hoppr records nothing. Now: the bar gained a customer, the user found a deal they wanted, and Hoppr captured the full attribution chain from notification to door scan. This is the difference between passive and active.

---

## Feature #5: Automated Retargeting

### Current State

Marketing is entirely manual and one-directional. A bar owner creates a promotion, it goes live, and... that's it. There is no follow-up. If a user views a promotion 5 times but never redeems it, nobody notices. If they attended a similar event last month, nobody tells them about this month's. Every interested-but-not-converted user is permanently lost.

This is behavioral waste — and it's something no bar owner manually addresses because it's impossible to do at scale. Even agencies don't retarget at the individual user level for bars because the margins don't support the labor.

### What We're Adding

A behavioral tracking and retargeting engine that watches user actions across the platform and automatically re-engages users who show interest but don't convert:

**Behavioral tracking:** log every meaningful action — promo views, event interest, bar profile browsing, campaign clicks, QR scans, event attendance — with timestamps and context.

**Retargeting rules:**
- *Repeated Interest, No Conversion* — viewed same promo 3+ times in 7 days without redeeming. Send: "Still thinking about [promo] at [bar]? Valid until [end]."
- *Attended Similar, Suggest Next* — attended event type X at a bar, similar event exists. Send: "Loved [past event]? [New event] is this Friday."
- *Browsed, Didn't Follow* — viewed bar profile 3+ times but hasn't followed. Send: "You've been checking out [bar]. Follow to see their events first."
- *Inactive Regular* — visited bar 5+ times historically, no visit in 21+ days. Send with re-engagement offer.

**Safety rails:** max 1 retargeting notification per user per day, max 3 per week, opt-out per type, quiet hours respected. Retargeting should feel helpful, not creepy.

**Bar portal:** see retargeting stats — how many users retargeted, how many re-engaged (opened app within 24h), how many converted (redeemed/attended within 7 days), conversion rate.

### How It Relates to Everything

- **Push Notifications (#4):** the delivery channel. Cannot function without it.
- **ROI Dashboard (#3):** retargeting conversions feed into ROI — show how much additional revenue came from retargeted users vs organic.
- **Performance Benchmarking (#2):** bar sees their retargeting conversion rate vs district average. "Your retargeting converts at 18% — top 10% in Kallio."
- **AI Marketing Scheduler (#6):** retargeting data tells the scheduler which users are warm leads, which promos need a nudge, and when re-engagement is most effective.

### How It's More Intelligent

A bar owner would never manually track: "Anna viewed the student promo 4 times this week but didn't redeem — I should message her." Even if they wanted to, they have no way to know. An agency would never do it either — the labor cost per-retargeted-user would exceed the margin on a few drinks.

Hoppr does it automatically, at zero marginal cost, for every user and every bar. The behavioral data already exists in the platform — it's just not being used. This feature turns wasted data into recovered revenue.

### How It's Better Than an Agency

No agency offers individual-level retargeting for bars. The closest they get is "we'll run a Facebook retargeting ad" — which is generic, expensive, and shows up as an ad, not a helpful nudge. Hoppr's retargeting is: personalized to the exact promo the user viewed, delivered at the optimal time, in a format they already trust (Hoppr notifications), with a direct path to redemption. It doesn't feel like an ad — it feels like the app being helpful.

### Outcome & Impact

Interested users who would have been lost become customers. Every bar sees a conversion lift from retargeted users without doing any work. The platform captures value that currently evaporates — the 70-80% of interested users who view content but never convert. Even a 5% recovery rate on those users represents significant incremental revenue across all bars.

### Scenario

Anna, a student in Helsinki, views Apollo's 20% student discount promo on Monday. She views it again Tuesday. She opens it a third time Thursday. She checks it a fourth time Friday afternoon. Zero redemptions.

The retargeting engine evaluates at 15:00 on Friday (students plan their evening between classes):

- Same promo viewed 4 times in 6 days ✓
- No redemption ✓
- Promo still active (valid until Sunday) ✓
- Friday afternoon = peak student decision time ✓
- Anna hasn't received a retargeting notification today ✓

A push notification fires:

> 🎓 **Still thinking about those student deals at Apollo?**
> 20% off all drinks. Valid until Sunday.
> [View promo →]

Anna taps, opens the promo, and this time she screenshots the QR code. Saturday night, she brings 3 friends to Apollo. All 4 scan the QR. The bar gets a table of 4 students on a Saturday night.

Apollo's retargeting dashboard ticks up: 1 user retargeted, 1 re-engaged, 1 converted (with 3 friends in tow). Estimated additional revenue: €60 (4 people × €15 average spend). Cost to Apollo: €0. The platform did the thinking, the timing, and the delivery. No human was involved.

---

## Feature #6: AI Marketing Scheduler

### Current State

The Create Hub uses AI to generate content from natural language — the bar owner describes what they want, and DeepSeek produces a complete event, promotion, or pass with all fields filled. This is reactive: the bar owner must initiate. Campaigns have budgets but no intelligent optimization. Content goes live immediately when created — not when it would perform best.

What's missing is the proactive layer. A marketing agency doesn't just execute — they plan. They look at the calendar, the weather, the competition, the bar's historical performance, and say: "Here's what you should do this week and when." Hoppr has all the data to do this automatically, but currently waits for the bar owner to think of everything themselves.

### What We're Adding

The AI becomes the marketing strategist. Each morning, every bar gets a "Today's Plan" — a timeline of recommended actions, each with the reasoning behind it. The bar owner approves or tweaks. The platform executes.

**Data the scheduler ingests:**
- Historical performance: which days/times drove the most redemptions, event joins, campaign clicks
- Weather: 7-day forecast (rain drives people indoors to bars, sun drives people to terraces)
- Day context: weekday vs weekend, payday (25th in Finland), public holidays, seasonal patterns (Vappu, Juhannus, Christmas party season)
- Competitor awareness: other bars in the same district with active events/promos at the same time
- Crowd patterns: typical crowd density by hour for this bar, current density from live data
- Active content: what promos/events/campaigns the bar already has queued

**What the AI generates:**
A ranked, time-stamped list of 3-5 actions per day. Each action includes: what to do, when to do it, why this timing was chosen (data-backed reasoning), and expected impact. Action types: schedule a promo to go live, send event reminder to followers, boost campaign budget during peak hours, react to crowd density, suggest creating new content if nothing is active.

**Execution:**
Approved actions execute automatically at their scheduled times. A promo auto-activates at 14:00. A push notification fires to 47 followers at 15:30. A campaign budget adjusts at 22:00 based on real-time performance. Mid-day adjustments: if crowd data shows the bar is BUSY, the scheduler auto-boosts promo visibility. If a campaign is underperforming, it suggests pausing or adjusting.

### How It Relates to Everything

- **ROI Dashboard (#3):** historical ROI data tells the scheduler which content types and time slots generate the best returns. The scheduler optimizes for ROI, not vanity metrics.
- **Push Notifications (#4):** the delivery channel for every scheduled action. Reminders, alerts, and crowd-response notifications all flow through push.
- **Performance Benchmarking (#2):** the scheduler knows whether a bar is above or below district averages and adjusts its aggressiveness accordingly. A bottom-quartile bar gets more proactive recommendations.
- **One-Tap Social Export (#1):** scheduled social posts become part of the daily plan. "14:00 — Post Saturday event to Instagram/Facebook" appears alongside other actions.
- **Automated Retargeting (#5):** retargeting data tells the scheduler which users are warm leads and which promos need a re-engagement push.

The scheduler is the brain. Everything else on this roadmap is the senses and the limbs. The scheduler consumes data from 1-5 and acts through 4.

### How It's More Intelligent

A marketing agency assigns a junior strategist to each bar account. That strategist spends maybe 2-3 hours per month on planning — looking at last month's numbers, checking the calendar, writing a one-page plan. They do this across 20-30 accounts. The quality is inconsistent, the data is shallow, and the updates are monthly.

Hoppr's AI scheduler analyzes every data point for every bar, every day. It sees patterns no human would catch: "This bar's Tuesday happy hours underperform unless it's raining, in which case they perform 2.5x better. Rain is forecast tomorrow — schedule the happy hour." It updates in real-time — if the bar is unexpectedly BUSY at 18:00, it boosts visibility within minutes, not at the next monthly check-in.

The agency strategist costs the bar €300-500/month. Hoppr's scheduler is included in the platform. And it works every day, not once a month.

### How It's Better Than an Agency

Speed: agency plans monthly, Hoppr plans daily with mid-day adjustments.
Data depth: agency sees what the bar tells them, Hoppr sees every impression, click, redemption, and door scan.
Scale: agency can't personalize per-user, Hoppr retargets individuals automatically.
Consistency: agency quality varies by strategist, Hoppr applies the same intelligence to every bar.
Cost: agency charges for planning, Hoppr includes it.

The scheduler doesn't replace the agency's output — it replaces the agency's thinking. The bar owner still controls the content (via the Create Hub). They still approve the plan. But they no longer have to be the strategist.

### Outcome & Impact

The bar owner wakes up, checks their phone, sees what Hoppr recommends today, taps "Approve All," and goes about their day. The platform handles: optimal timing, cross-channel distribution, real-time adjustments, and end-of-day reporting. The bar gets agency-grade marketing strategy for the cost of their Hoppr subscription. They would lose their marketing brain if they left the platform — that's the retention moat.

### Scenario

It's Wednesday, June 4th. Tiina opens Hoppr Business at 10:00 and sees her Today's Plan:

---

**Today's Plan — Apollo · Wednesday, June 4**

⛅ 18°C, light rain after 16:00. 1 competing event in Kallio tonight.

| Time | Action | Why |
|------|--------|-----|
| **13:00** | 🎓 Student Discount goes live | Wednesdays at 13:00 had 2.1x more redemptions last month than other weekdays. Students browse between classes. Rain forecast from 16:00 increases indoor bar traffic ~30%. Est. 12-18 redemptions. |
| **15:30** | 📢 DJ Night reminder → 47 followers within 2km | Kaiku has a competing event at the same time tonight. Sending reminder 2 hours before = users commit to Apollo before they commit elsewhere. These 47 followers attended 1+ Apollo events in the past 3 months. |
| **18:00** | 📊 Crowd check | If BUSY → boost promo visibility to nearby users. If QUIET → send last-minute push to 120+ followers within 3km. Past 4 Wednesdays were BUSY by 18:00. |
| **22:00** | 💰 Budget review | Campaign currently at 3.2x better CTR than last week's average. Budget has €30 remaining. Recommend +€20 to capture peak hours (22:00-01:00) when CTR is historically highest. |

**[✨ Approve All] [Edit individual items]**

---

Tiina reads the reasoning for each recommendation. The weather insight is new — she hadn't considered that rain drives people indoors and makes happy hours more effective. The competing event warning catches her attention — she didn't know Kaiku had a DJ tonight too. The early reminder timing makes sense when she thinks about it: get the commitment before the other option appears.

She taps "Approve All."

At 13:00, the student discount auto-activates. 34 students within 3km get a push notification. By 15:00, 8 have already redeemed.

At 15:30, 47 phones buzz with: "🎵 DJ Night tonight at Apollo — 22:00. 400m from you. 22 people going." By 16:00, 14 more confirm "Going" on the event.

At 18:00, crowd detection shows Apollo is BUSY. The scheduler auto-boosts promo visibility for 1 hour. Campaign CTR climbs from 3.2% to 4.8%.

At 22:00, Tiina gets a notification: "Campaign at 3.2x last week's performance. Budget 70% spent. +€20 recommended to capture peak hours." She taps Approve.

At 02:00, the day wraps. Tiina gets a summary notification:

> **Today's Results — Apollo**
> - Student Discount: 19 redemptions (est. 12-18 ✓)
> - DJ Night: 47 reminders sent, 22 confirmed going
> - Crowd response: BUSY at 18:00, boosted 1 hour
> - Campaign: €70 total spend, 920 impressions, 58 clicks, 31 estimated door scans
> - **Est. revenue driven today: €465** (31 visits × €15 avg)

Tiina did three things: opened the app, read the plan, tapped "Approve" twice. The platform did everything else. Apollo had one of its best Wednesdays of the year. No agency strategist planned this — the AI watched the data, the weather, the competition, and made the calls. Tiina just said yes.

---

## Build Phases

### Phase 1 — Quick Wins (now)
**#1 One-Tap Social Export** + **#2 Performance Benchmarking**

No new infrastructure needed. Both build on existing data and components. Social export extends the share cards we already built. Benchmarking extends the analytics pages we already have. Together they deliver immediate, visible value: bars post to Instagram in one tap and see how they compare to peers.

### Phase 2 — The Delivery Channel (next)
**#4 Push Notifications to Consumers**

New infrastructure — Firebase Cloud Messaging, device token management, notification service. This is a dependency for Phases 3 and 4. Build it thoroughly because everything downstream relies on it. Ship it to consumers as "Get notified about deals near you" — a feature that stands on its own while laying the groundwork.

### Phase 3 — Proof + Intelligence (then)
**#3 ROI Dashboard** + **#5 Automated Retargeting**

ROI can be built in parallel with Push since it has no dependency. But it's most impactful once push is live because push attribution feeds the ROI numbers. Retargeting requires push (#4) but is otherwise self-contained — the behavioral tracking is new, but the rules engine is straightforward.

### Phase 4 — The Crown Jewel (last)
**#6 AI Marketing Scheduler**

Builds on everything: consumes benchmarking data (#2), uses ROI history (#3) for optimization, delivers through push (#4), incorporates retargeting signals (#5), distributes via social export (#1). This is the hardest feature because it touches every system and must be reliable — bar owners are trusting it to run their marketing day. Get Phases 1-3 solid first, then the scheduler has rich data to work with from day one.

---

## What We Already Have (Foundations)

| Capability | Status | What It Enables |
|-----------|--------|-----------------|
| AI Create Hub | ✅ Live | Content generation for the scheduler to schedule |
| Share Cards | ✅ Live | Image source for social export + push notifications |
| 30 Default Images | ✅ Live | Visual library for all distribution channels |
| Campaign System | ✅ Live | Budget tracking → feeds ROI calculations |
| VIP Passes + QR Scanning | ✅ Live | Visit tracking → feeds loyalty + attribution |
| Compliance Engine | ✅ Live | All automated content stays Finland-compliant |
| Crowd Density | ✅ Partial | Feeds scheduler's real-time adjustment engine |
| Bar Analytics | ✅ Live | Seeds benchmarking + ROI calculations |
