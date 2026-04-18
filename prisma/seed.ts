import {
  PrismaClient,
  BarType,
  PriceRange,
  BarStatus,
  SocialVibe,
  SocialStatus,
  InteractionType,
  InteractionStatus,
  CrawlStatus,
  MeetupStatus,
  ParticipantStatus,
  MessageType,
  VIPPassType,
  VIPPassStatus,
  AdminRole,
  BarStaffRole,
  PromotionType,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

// Operating hours templates
const standardHours = {
  Monday: { open: "16:00", close: "02:00" },
  Tuesday: { open: "16:00", close: "02:00" },
  Wednesday: { open: "16:00", close: "02:00" },
  Thursday: { open: "16:00", close: "02:00" },
  Friday: { open: "16:00", close: "04:00" },
  Saturday: { open: "14:00", close: "04:00" },
  Sunday: { open: "14:00", close: "02:00" },
};

const eveningHours = {
  Monday: { open: "17:00", close: "01:00" },
  Tuesday: { open: "17:00", close: "01:00" },
  Wednesday: { open: "17:00", close: "01:00" },
  Thursday: { open: "17:00", close: "02:00" },
  Friday: { open: "17:00", close: "02:00" },
  Saturday: { open: "16:00", close: "02:00" },
  Sunday: { open: "16:00", close: "24:00" },
};

const restaurantHours = {
  Monday: { open: "11:00", close: "23:00" },
  Tuesday: { open: "11:00", close: "23:00" },
  Wednesday: { open: "11:00", close: "23:00" },
  Thursday: { open: "11:00", close: "24:00" },
  Friday: { open: "11:00", close: "24:00" },
  Saturday: { open: "12:00", close: "24:00" },
  Sunday: { open: "12:00", close: "22:00" },
};

const sportsHours = {
  Monday: { open: "14:00", close: "01:00" },
  Tuesday: { open: "14:00", close: "01:00" },
  Wednesday: { open: "14:00", close: "01:00" },
  Thursday: { open: "14:00", close: "02:00" },
  Friday: { open: "14:00", close: "02:00" },
  Saturday: { open: "12:00", close: "02:00" },
  Sunday: { open: "12:00", close: "24:00" },
};

const karaokeHours = {
  Monday: { open: "17:00", close: "02:00" },
  Tuesday: { open: "17:00", close: "02:00" },
  Wednesday: { open: "17:00", close: "02:00" },
  Thursday: { open: "17:00", close: "03:00" },
  Friday: { open: "17:00", close: "03:00" },
  Saturday: { open: "15:00", close: "03:00" },
  Sunday: { open: "15:00", close: "02:00" },
};

const liveMusicHours = {
  Monday: { open: "19:00", close: "02:00" },
  Tuesday: { open: "19:00", close: "02:00" },
  Wednesday: { open: "19:00", close: "02:00" },
  Thursday: { open: "19:00", close: "03:00" },
  Friday: { open: "19:00", close: "03:00" },
  Saturday: { open: "18:00", close: "03:00" },
  Sunday: { open: "18:00", close: "02:00" },
};

async function main() {
  console.log("🌱 Starting unified database seed...");

  // ============================================
  // CLEAR EXISTING DATA
  // ============================================
  console.log("🧹 Clearing existing data...");

  // Order matters for foreign keys
  await prisma.promotionUsage.deleteMany();
  await prisma.barPromotion.deleteMany();
  await prisma.barStaff.deleteMany();
  await prisma.userVIPPass.deleteMany();
  await prisma.vIPPassEnhanced.deleteMany();
  await prisma.vIPPass.deleteMany();
  await prisma.vIPPassScan.deleteMany();
  await prisma.barSocialActivity.deleteMany();
  await prisma.userSocialProfile.deleteMany();
  await prisma.socialMeetup.deleteMany();
  await prisma.socialInteraction.deleteMany();
  await prisma.meetupParticipant.deleteMany();
  await prisma.socialChatMessage.deleteMany();
  await prisma.userSocialStats.deleteMany();
  await prisma.crawlJoinRequest.deleteMany();
  await prisma.crawlParticipant.deleteMany();
  await prisma.crawlBar.deleteMany();
  await prisma.crawl.deleteMany();
  await prisma.crawlChatMessage.deleteMany();
  await prisma.group.deleteMany();
  await prisma.userGroup.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.hopIn.deleteMany();
  await prisma.chatroomMessage.deleteMany();
  await prisma.chatroomParticipant.deleteMany();
  await prisma.chatroom.deleteMany();
  await prisma.phoneVerification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.bar.deleteMany();
  await prisma.city.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.barImport.deleteMany();
  await prisma.barInvitation.deleteMany();

  // ============================================
  // CREATE CITIES
  // ============================================
  console.log("🏙️ Creating cities...");
  const helsinki = await prisma.city.create({
    data: { name: "Helsinki", country: "Finland", isActive: true },
  });
  const tampere = await prisma.city.create({
    data: { name: "Tampere", country: "Finland", isActive: true },
  });
  const turku = await prisma.city.create({
    data: { name: "Turku", country: "Finland", isActive: true },
  });

  // ============================================
  // CREATE ADMIN USERS
  // ============================================
  console.log("👤 Creating admin users...");
  const admin1 = await prisma.adminUser.create({
    data: {
      email: "siegy@hoppr.com",
      name: "Siegfred Gamboa",
      role: AdminRole.SUPER_ADMIN,
      hashedPassword: await hashPassword("superadmin123"),
      isActive: true,
    },
  });
  const admin2 = await prisma.adminUser.create({
    data: {
      email: "pierce@hoppr.com",
      name: "Pierce Cosgrove",
      role: AdminRole.SUPER_ADMIN,
      hashedPassword: await hashPassword("admin123"),
      isActive: true,
    },
  });

  // ============================================
  // CREATE REGULAR USERS
  // ============================================
  console.log("👥 Creating regular users...");
  const userPassword = await hash("password123", 12);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alex Johnson",
        email: "alex.johnson@example.com",
        hashedPassword: userPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Miller",
        email: "sarah.miller@example.com",
        hashedPassword: userPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Mikko Korhonen",
        email: "mikko.korhonen@example.com",
        hashedPassword: userPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Emma Virtanen",
        email: "emma.virtanen@example.com",
        hashedPassword: userPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "David Chen",
        email: "david.chen@example.com",
        hashedPassword: userPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Lisa Park",
        email: "lisa.park@example.com",
        hashedPassword: userPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Jari Nieminen",
        email: "jari.nieminen@example.com",
        hashedPassword: userPassword,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        name: "Sofia Karlsson",
        email: "sofia.karlsson@example.com",
        hashedPassword: userPassword,
        emailVerified: new Date(),
      },
    }),
  ]);
  const [user1, user2, user3, user4, user5, user6, user7, user8] = users;

  // ============================================
  // CREATE BARS - HELSINKI
  // ============================================
  console.log("🍻 Creating Helsinki bars...");

  // Pubs (3)
  const pub1 = await prisma.bar.create({
    data: {
      name: "The Old Irish Pub",
      description: "Cozy Irish pub with live music and great beer selection",
      address: "Mannerheimintie 5, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.PUB,
      latitude: 60.1699,
      longitude: 24.9384,
      phone: "+358 10 1234567",
      website: "https://oldirishpub.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 120,
      amenities: ["Live Music", "Beer Garden", "Sports TV"],
      operatingHours: standardHours,
      vipEnabled: true,
      vipPrice: 15,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const pub2 = await prisma.bar.create({
    data: {
      name: "Helsinki Beer House",
      description: "Traditional Finnish pub with local craft beers",
      address: "Mikonkatu 13, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.PUB,
      latitude: 60.1682,
      longitude: 24.9378,
      phone: "+358 10 1234568",
      website: "https://helsinkibeerhouse.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 150,
      amenities: ["Craft Beer", "Pub Food", "Outdoor Seating"],
      operatingHours: standardHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.CLAIMED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const pub3 = await prisma.bar.create({
    data: {
      name: "The English Pub",
      description: "Authentic British pub with imported beers and pub food",
      address: "Kaisaniemenkatu 3, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kaisaniemi",
      type: BarType.PUB,
      latitude: 60.1712,
      longitude: 24.9456,
      phone: "+358 10 1234569",
      website: "https://englishpubhelsinki.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 100,
      amenities: ["British Beer", "Pub Quiz", "Darts"],
      operatingHours: standardHours,
      vipEnabled: true,
      vipPrice: 12,
      isActive: true,
      status: BarStatus.CLAIMED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // Clubs (3)
  const club1 = await prisma.bar.create({
    data: {
      name: "Nightclub Aurora",
      description: "Trendy nightclub with DJs and cocktail bar",
      address: "Eerikinkatu 11, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.CLUB,
      latitude: 60.1685,
      longitude: 24.9328,
      phone: "+358 10 1234570",
      website: "https://auroranightclub.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 300,
      amenities: ["DJ", "Cocktail Bar", "VIP Area"],
      operatingHours: standardHours,
      vipEnabled: true,
      vipPrice: 25,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const club2 = await prisma.bar.create({
    data: {
      name: "Club Helsinki",
      description: "Multi-level club with different music genres",
      address: "Annankatu 14, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.CLUB,
      latitude: 60.1678,
      longitude: 24.9352,
      phone: "+358 10 1234571",
      website: "https://clubhelsinki.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 400,
      amenities: ["Multi-level", "VIP Lounge", "Champagne Bar"],
      operatingHours: standardHours,
      vipEnabled: true,
      vipPrice: 20,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const club3 = await prisma.bar.create({
    data: {
      name: "Dance Factory",
      description: "Electronic music club with international DJs",
      address: "Fredrikinkatu 34, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Punavuori",
      type: BarType.CLUB,
      latitude: 60.1634,
      longitude: 24.9398,
      phone: "+358 10 1234572",
      website: "https://dancefactory.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 500,
      amenities: ["Electronic Music", "LED Wall", "VIP Booths"],
      operatingHours: standardHours,
      vipEnabled: true,
      vipPrice: 18,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // Lounges (3)
  const lounge1 = await prisma.bar.create({
    data: {
      name: "Sky Lounge Helsinki",
      description: "Rooftop lounge with amazing city views",
      address: "Mikonkatu 15, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.LOUNGE,
      latitude: 60.1689,
      longitude: 24.9334,
      phone: "+358 10 1234573",
      website: "https://skyloungehelsinki.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 80,
      amenities: ["Rooftop", "City Views", "Cocktails"],
      operatingHours: eveningHours,
      vipEnabled: true,
      vipPrice: 20,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const lounge2 = await prisma.bar.create({
    data: {
      name: "Velvet Lounge",
      description: "Sophisticated lounge with jazz evenings",
      address: "Pohjoisesplanadi 25, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kluuvi",
      type: BarType.LOUNGE,
      latitude: 60.1682,
      longitude: 24.9448,
      phone: "+358 10 1234574",
      website: "https://velvetlounge.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 60,
      amenities: ["Jazz Music", "Cocktails", "Intimate"],
      operatingHours: eveningHours,
      vipEnabled: true,
      vipPrice: 15,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const lounge3 = await prisma.bar.create({
    data: {
      name: "Urban Retreat Lounge",
      description: "Modern lounge with creative cocktails",
      address: "Kasarmikatu 44, 00130 Helsinki",
      cityName: "Helsinki",
      district: "Kaartinkaupunki",
      type: BarType.LOUNGE,
      latitude: 60.1628,
      longitude: 24.9462,
      phone: "+358 10 1234575",
      website: "https://urbanretreat.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 50,
      amenities: ["Creative Cocktails", "Modern Design", "Quiet"],
      operatingHours: eveningHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // Cocktail Bars (3)
  const cocktail1 = await prisma.bar.create({
    data: {
      name: "Cocktail Lounge 56",
      description: "Sophisticated cocktail bar with expert mixologists",
      address: "Pohjoisesplanadi 33, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kluuvi",
      type: BarType.COCKTAIL_BAR,
      latitude: 60.1678,
      longitude: 24.9456,
      phone: "+358 10 1234576",
      website: "https://lounge56.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 40,
      amenities: ["Mixologists", "Signature Cocktails", "Elegant"],
      operatingHours: eveningHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const cocktail2 = await prisma.bar.create({
    data: {
      name: "Spirit Society",
      description: "Craft cocktail bar with rare spirits",
      address: "Iso Roobertinkatu 16, 00120 Helsinki",
      cityName: "Helsinki",
      district: "Punavuori",
      type: BarType.COCKTAIL_BAR,
      latitude: 60.1621,
      longitude: 24.9402,
      phone: "+358 10 1234577",
      website: "https://spiritsociety.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 35,
      amenities: ["Rare Spirits", "Craft Cocktails", "Expert Staff"],
      operatingHours: eveningHours,
      vipEnabled: true,
      vipPrice: 25,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const cocktail3 = await prisma.bar.create({
    data: {
      name: "The Alchemist",
      description: "Molecular mixology and creative cocktails",
      address: "Eerikinkatu 27, 00180 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.COCKTAIL_BAR,
      latitude: 60.1662,
      longitude: 24.9318,
      phone: "+358 10 1234578",
      website: "https://alchemisthelsinki.fi",
      priceRange: PriceRange.LUXURY,
      capacity: 30,
      amenities: [
        "Molecular Mixology",
        "Creative Cocktails",
        "Reservation Only",
      ],
      operatingHours: eveningHours,
      vipEnabled: true,
      vipPrice: 30,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // Restaurant Bars (3)
  const restaurant1 = await prisma.bar.create({
    data: {
      name: "Grill & Wine Helsinki",
      description: "Fine dining restaurant with extensive wine bar",
      address: "Korkeavuorenkatu 27, 00130 Helsinki",
      cityName: "Helsinki",
      district: "Kaartinkaupunki",
      type: BarType.RESTAURANT_BAR,
      latitude: 60.1632,
      longitude: 24.9478,
      phone: "+358 10 1234579",
      website: "https://grillwine.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 80,
      amenities: ["Fine Dining", "Wine Bar", "Outdoor Seating"],
      operatingHours: restaurantHours,
      vipEnabled: true,
      vipPrice: 15,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const restaurant2 = await prisma.bar.create({
    data: {
      name: "Sea View Restaurant & Bar",
      description: "Seafood restaurant with harbor views and cocktail bar",
      address: "Kanavaranta 7, 00160 Helsinki",
      cityName: "Helsinki",
      district: "Katajanokka",
      type: BarType.RESTAURANT_BAR,
      latitude: 60.1672,
      longitude: 24.9618,
      phone: "+358 10 1234580",
      website: "https://seaviewhelsinki.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 100,
      amenities: ["Harbor View", "Seafood", "Cocktails"],
      operatingHours: restaurantHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const restaurant3 = await prisma.bar.create({
    data: {
      name: "Urban Kitchen & Bar",
      description: "Modern fusion cuisine with craft cocktail bar",
      address: "Mannerheimintie 22, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.RESTAURANT_BAR,
      latitude: 60.1692,
      longitude: 24.9338,
      phone: "+358 10 1234581",
      website: "https://urbankitchen.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 90,
      amenities: ["Fusion Cuisine", "Craft Cocktails", "Brunch"],
      operatingHours: restaurantHours,
      vipEnabled: true,
      vipPrice: 12,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // Sports Bars (3)
  const sports1 = await prisma.bar.create({
    data: {
      name: "Sports Bar Helsinki",
      description: "The best place to watch sports with friends",
      address: "Kaivokatu 8, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Keskusta",
      type: BarType.SPORTS_BAR,
      latitude: 60.1699,
      longitude: 24.9417,
      phone: "+358 10 1234582",
      website: "https://sportsbarhelsinki.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 200,
      amenities: ["Big Screens", "Pub Food", "Beer"],
      operatingHours: sportsHours,
      vipEnabled: true,
      vipPrice: 10,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const sports2 = await prisma.bar.create({
    data: {
      name: "The Goal Post",
      description: "Sports bar with multiple big screens and pub food",
      address: "Mikonkatu 9, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.SPORTS_BAR,
      latitude: 60.1688,
      longitude: 24.9342,
      phone: "+358 10 1234583",
      website: "https://goalpost.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 150,
      amenities: ["Big Screens", "Pub Food", "Beer Pong"],
      operatingHours: sportsHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.CLAIMED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const sports3 = await prisma.bar.create({
    data: {
      name: "Champions Sports Bar",
      description: "Premium sports viewing experience with VIP areas",
      address: "Kaisaniemenkatu 5, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kaisaniemi",
      type: BarType.SPORTS_BAR,
      latitude: 60.1718,
      longitude: 24.9462,
      phone: "+358 10 1234584",
      website: "https://championssports.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 180,
      amenities: ["VIP Areas", "Premium Seating", "Craft Beer"],
      operatingHours: sportsHours,
      vipEnabled: true,
      vipPrice: 15,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // Karaoke Bars (3)
  const karaoke1 = await prisma.bar.create({
    data: {
      name: "Karaoke Box Helsinki",
      description: "Private karaoke rooms with extensive song selection",
      address: "Annankatu 22, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kamppi",
      type: BarType.KARAOKE,
      latitude: 60.1672,
      longitude: 24.9356,
      phone: "+358 10 1234585",
      website: "https://karaokebox.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 50,
      amenities: ["Private Rooms", "Song Selection", "Drinks"],
      operatingHours: karaokeHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.CLAIMED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const karaoke2 = await prisma.bar.create({
    data: {
      name: "Sing Along Bar",
      description: "Public karaoke stage and private rooms",
      address: "Iso Roobertinkatu 21, 00120 Helsinki",
      cityName: "Helsinki",
      district: "Punavuori",
      type: BarType.KARAOKE,
      latitude: 60.1618,
      longitude: 24.9412,
      phone: "+358 10 1234586",
      website: "https://singalong.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 80,
      amenities: ["Public Stage", "Private Rooms", "Full Bar"],
      operatingHours: karaokeHours,
      vipEnabled: true,
      vipPrice: 8,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const karaoke3 = await prisma.bar.create({
    data: {
      name: "Voice Factory Karaoke",
      description: "High-tech karaoke with professional sound systems",
      address: "Fredrikinkatu 45, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Punavuori",
      type: BarType.KARAOKE,
      latitude: 60.1624,
      longitude: 24.9386,
      phone: "+358 10 1234587",
      website: "https://voicefactory.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 60,
      amenities: ["High-Tech", "Professional Sound", "VIP Rooms"],
      operatingHours: karaokeHours,
      vipEnabled: true,
      vipPrice: 12,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // Live Music Bars (3)
  const liveMusic1 = await prisma.bar.create({
    data: {
      name: "Helsinki Jazz Club",
      description: "Intimate jazz venue with live performances",
      address: "Pohjoisesplanadi 21, 00100 Helsinki",
      cityName: "Helsinki",
      district: "Kluuvi",
      type: BarType.LIVE_MUSIC,
      latitude: 60.1685,
      longitude: 24.9442,
      phone: "+358 10 1234588",
      website: "https://helsinkijazz.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 80,
      amenities: ["Live Jazz", "Cocktails", "Intimate"],
      operatingHours: liveMusicHours,
      vipEnabled: true,
      vipPrice: 20,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const liveMusic2 = await prisma.bar.create({
    data: {
      name: "Rock Arena Helsinki",
      description: "Live rock music venue with local and international bands",
      address: "Siltasaarenkatu 6, 00530 Helsinki",
      cityName: "Helsinki",
      district: "Sörnäinen",
      type: BarType.LIVE_MUSIC,
      latitude: 60.1872,
      longitude: 24.9678,
      phone: "+358 10 1234589",
      website: "https://rockarena.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 300,
      amenities: ["Live Rock", "Standing Area", "Bar"],
      operatingHours: liveMusicHours,
      vipEnabled: true,
      vipPrice: 15,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const liveMusic3 = await prisma.bar.create({
    data: {
      name: "The Blues Corner",
      description: "Authentic blues bar with nightly live music",
      address: "Albertinkatu 25, 00150 Helsinki",
      cityName: "Helsinki",
      district: "Punavuori",
      type: BarType.LIVE_MUSIC,
      latitude: 60.1598,
      longitude: 24.9384,
      phone: "+358 10 1234590",
      website: "https://bluescorner.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 60,
      amenities: ["Live Blues", "Cozy", "Whiskey Selection"],
      operatingHours: liveMusicHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.CLAIMED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // ============================================
  // CREATE TAMPERE BARS
  // ============================================
  console.log("🍻 Creating Tampere bars...");

  const tamperePub = await prisma.bar.create({
    data: {
      name: "Tampere Pub Crawl Hub",
      description: "Popular student pub with great atmosphere",
      address: "Hämeenkatu 10, 33100 Tampere",
      cityName: "Tampere",
      district: "Keskusta",
      type: BarType.PUB,
      latitude: 61.4978,
      longitude: 23.761,
      phone: "+358 10 1234591",
      website: "https://tamperepubs.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 150,
      amenities: ["Student Friendly", "Beer Selection", "Outdoor Area"],
      operatingHours: standardHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.CLAIMED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const tampereLiveMusic = await prisma.bar.create({
    data: {
      name: "Klubi Tampere",
      description: "Live music venue and club in the heart of Tampere",
      address: "Tullikamarin aukio 2, 33100 Tampere",
      cityName: "Tampere",
      district: "Tulli",
      type: BarType.LIVE_MUSIC,
      latitude: 61.4991,
      longitude: 23.7612,
      phone: "+358 10 1234592",
      website: "https://klubi.net",
      priceRange: PriceRange.MODERATE,
      capacity: 400,
      amenities: ["Live Music", "Club", "Bar"],
      operatingHours: eveningHours,
      vipEnabled: true,
      vipPrice: 12,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const tampereSports = await prisma.bar.create({
    data: {
      name: "Tampere Sports Arena Bar",
      description: "Sports bar with big screens and game day specials",
      address: "Rautatienkatu 25, 33100 Tampere",
      cityName: "Tampere",
      district: "Keskusta",
      type: BarType.SPORTS_BAR,
      latitude: 61.4985,
      longitude: 23.7734,
      phone: "+358 10 1234593",
      website: "https://tamperesports.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 120,
      amenities: ["Big Screens", "Game Day Specials", "Pub Food"],
      operatingHours: sportsHours,
      vipEnabled: true,
      vipPrice: 8,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // ============================================
  // CREATE TURKU BARS
  // ============================================
  console.log("🍻 Creating Turku bars...");

  const turkuCocktail = await prisma.bar.create({
    data: {
      name: "Uusi Apteekki",
      description: "Stylish pharmacy-themed cocktail bar",
      address: "Kaskenkatu 1, 20700 Turku",
      cityName: "Turku",
      district: "Kaskenranta",
      type: BarType.COCKTAIL_BAR,
      latitude: 60.4518,
      longitude: 22.2666,
      phone: "+358 10 1234594",
      website: "https://uusiapteekki.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 50,
      amenities: ["Pharmacy Theme", "Signature Cocktails", "Unique"],
      operatingHours: eveningHours,
      vipEnabled: true,
      vipPrice: 18,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const turkuPub = await prisma.bar.create({
    data: {
      name: "Koulu Brewery",
      description: "Brewpub in a historic school building",
      address: "Eerikinkatu 18, 20100 Turku",
      cityName: "Turku",
      district: "VII",
      type: BarType.PUB,
      latitude: 60.4521,
      longitude: 22.2693,
      phone: "+358 10 1234595",
      website: "https://koulu.fi",
      priceRange: PriceRange.MODERATE,
      capacity: 200,
      amenities: ["Brewpub", "Historic Building", "Beer Garden"],
      operatingHours: standardHours,
      vipEnabled: false,
      isActive: true,
      status: BarStatus.CLAIMED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  const turkuLounge = await prisma.bar.create({
    data: {
      name: "Turku Harbor Lounge",
      description: "Lounge bar with beautiful harbor views",
      address: "Linnankatu 32, 20100 Turku",
      cityName: "Turku",
      district: "Portsa",
      type: BarType.LOUNGE,
      latitude: 60.4345,
      longitude: 22.2334,
      phone: "+358 10 1234596",
      website: "https://turkuharborlounge.fi",
      priceRange: PriceRange.PREMIUM,
      capacity: 70,
      amenities: ["Harbor View", "Cocktails", "Relaxed"],
      operatingHours: eveningHours,
      vipEnabled: true,
      vipPrice: 15,
      isActive: true,
      status: BarStatus.VERIFIED,
      isVerified: true,
      createdById: admin1.id,
    },
  });

  // ============================================
  // CREATE BAR STAFF
  // ============================================
  console.log("👥 Creating bar staff...");

  const staffPassword = await hashPassword("staff123");

  // Staff for Midnight Club (club2)
  await prisma.barStaff.create({
    data: {
      barId: club2.id,
      email: "pierce@midnightclub.com",
      name: "Pierce Cosgrove",
      role: BarStaffRole.OWNER,
      permissions: ["*"],
      hashedPassword: await hashPassword("owner123"),
      isActive: true,
    },
  });

  await prisma.barStaff.create({
    data: {
      barId: club2.id,
      email: "manager@midnightclub.com",
      name: "Sarah Johnson",
      role: BarStaffRole.MANAGER,
      permissions: [
        "manage_staff",
        "manage_promotions",
        "view_analytics",
        "scan_passes",
      ],
      hashedPassword: staffPassword,
      isActive: true,
    },
  });

  await prisma.barStaff.create({
    data: {
      barId: club2.id,
      email: "tom@midnightclub.com",
      name: "Tom Wilson",
      role: BarStaffRole.STAFF,
      permissions: ["scan_passes"],
      hashedPassword: staffPassword,
      isActive: true,
    },
  });

  // Staff for The English Pub (pub3)
  await prisma.barStaff.create({
    data: {
      barId: pub3.id,
      email: "owner@englishpub.com",
      name: "James Murphy",
      role: BarStaffRole.OWNER,
      permissions: ["*"],
      hashedPassword: await hashPassword("owner456"),
      isActive: true,
    },
  });

  // Staff for Sky Lounge (lounge1)
  await prisma.barStaff.create({
    data: {
      barId: lounge1.id,
      email: "manager@skylounge.com",
      name: "Emma Watson",
      role: BarStaffRole.MANAGER,
      permissions: ["manage_staff", "manage_promotions", "view_analytics"],
      hashedPassword: staffPassword,
      isActive: true,
    },
  });

  // ============================================
  // CREATE PROMOTIONS
  // ============================================
  console.log("🎉 Creating promotions...");

  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  // Promotions for Midnight Club (club2)
  await prisma.barPromotion.create({
    data: {
      barId: club2.id,
      title: "Friday Night VIP Experience",
      description: "Skip the line and get 2 complimentary drinks",
      type: PromotionType.VIP_OFFER,
      discount: 0,
      conditions: ["18+ only", "Valid ID required", "Dress code enforced"],
      startDate: now,
      endDate: nextYear,
      validDays: ["Friday"],
      isActive: true,
      isApproved: true,
      priority: 1,
    },
  });

  // Promotions for The Old Irish Pub (pub1)
  await prisma.barPromotion.create({
    data: {
      barId: pub1.id,
      title: "Happy Hour Special",
      description: "50% off all drinks 5-7 PM",
      type: PromotionType.DRINK_SPECIAL,
      discount: 50,
      conditions: ["Valid 5-7 PM", "Monday to Friday"],
      startDate: now,
      endDate: nextYear,
      validDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      isActive: true,
      isApproved: true,
      priority: 1,
    },
  });

  // Promotions for Helsinki Jazz Club (liveMusic1)
  await prisma.barPromotion.create({
    data: {
      barId: liveMusic1.id,
      title: "Jazz Night Special",
      description: "Free entry before 8 PM + 10% off cocktails",
      type: PromotionType.COVER_DISCOUNT,
      discount: 10,
      conditions: ["Free entry before 8 PM", "Valid on Thursday jazz nights"],
      startDate: now,
      endDate: nextYear,
      validDays: ["Thursday"],
      isActive: true,
      isApproved: true,
      priority: 2,
    },
  });

  // Promotions for Sports Bar Helsinki (sports1)
  await prisma.barPromotion.create({
    data: {
      barId: sports1.id,
      title: "Game Day Special",
      description: "Buy one beer, get one free during live matches",
      type: PromotionType.DRINK_SPECIAL,
      discount: 50,
      conditions: ["During live matches only", "One per customer"],
      startDate: now,
      endDate: nextYear,
      validDays: ["Saturday", "Sunday"],
      isActive: true,
      isApproved: true,
      priority: 1,
    },
  });

  // Promotions for Karaoke Box (karaoke1)
  await prisma.barPromotion.create({
    data: {
      barId: karaoke1.id,
      title: "Karaoke Night",
      description: "Free private room for groups of 4+ on Wednesdays",
      type: PromotionType.THEME_NIGHT,
      discount: 0,
      conditions: ["Groups of 4 or more", "Wednesday nights only"],
      startDate: now,
      endDate: nextYear,
      validDays: ["Wednesday"],
      isActive: true,
      isApproved: true,
      priority: 2,
    },
  });

  // ============================================
  // ADD SAMPLE ANALYTICS DATA
  // ============================================
  console.log("\n📊 Adding sample analytics data...");

  const allPromotions = await prisma.barPromotion.findMany();

  for (const promo of allPromotions) {
    const cardViews = Math.floor(Math.random() * 500) + 50;
    const redemptions = Math.floor(cardViews * (Math.random() * 0.5 + 0.2));
    const views = Math.floor(Math.random() * 1000) + 100;
    const clicks = Math.floor(views * (Math.random() * 0.3 + 0.1));

    await prisma.barPromotion.update({
      where: { id: promo.id },
      data: {
        cardViews,
        redemptions,
        views,
        clicks,
      },
    });

    console.log(
      `   📊 ${promo.title}: ${cardViews} views → ${redemptions} redemptions`,
    );
  }

  // ============================================
  // CREATE VIP PASSES
  // ============================================
  console.log("\n🎫 Creating VIP passes...");

  // VIP passes for Midnight Club (club2)
  await prisma.vIPPassEnhanced.create({
    data: {
      barId: club2.id,
      name: "Weekend Skip-the-Line Pass",
      description: "Fast entry for you and 3 friends",
      type: VIPPassType.SKIP_LINE,
      priceCents: 4999,
      originalPriceCents: 7999,
      benefits: ["Skip the line", "Priority entry", "Complimentary coat check"],
      validityStart: now,
      validityEnd: nextYear,
      validDays: ["Friday", "Saturday"],
      totalQuantity: 100,
      soldCount: 45,
      maxPerUser: 2,
      isActive: true,
    },
  });

  // VIP passes for The Alchemist (cocktail3)
  await prisma.vIPPassEnhanced.create({
    data: {
      barId: cocktail3.id,
      name: "Mixology Masterclass",
      description: "Learn cocktail making from expert mixologists",
      type: VIPPassType.PREMIUM_ENTRY,
      priceCents: 8999,
      originalPriceCents: 12999,
      benefits: [
        "2-hour masterclass",
        "Take home recipe book",
        "Complimentary cocktails",
      ],
      validityStart: now,
      validityEnd: nextYear,
      validDays: ["Saturday"],
      totalQuantity: 20,
      soldCount: 12,
      maxPerUser: 1,
      isActive: true,
    },
  });

  // VIP passes for Helsinki Jazz Club (liveMusic1)
  await prisma.vIPPassEnhanced.create({
    data: {
      barId: liveMusic1.id,
      name: "Jazz VIP Experience",
      description: "Front row seating + meet the artists",
      type: VIPPassType.COVER_INCLUDED,
      priceCents: 3499,
      originalPriceCents: 4999,
      benefits: ["Front row seating", "Meet the artists", "Welcome champagne"],
      validityStart: now,
      validityEnd: nextYear,
      validDays: ["Thursday", "Friday", "Saturday"],
      totalQuantity: 30,
      soldCount: 18,
      maxPerUser: 2,
      isActive: true,
    },
  });

  // ============================================
  // CREATE SOCIAL PROFILES
  // ============================================
  console.log("🎭 Creating social profiles...");

  await prisma.userSocialProfile.create({
    data: {
      userId: user1.id,
      bio: "Digital nomad and nightlife enthusiast!",
      vibe: SocialVibe.ADVENTUROUS,
      interests: ["Craft Beer", "Live Music", "Cocktails"],
      isSocialMode: true,
      socialStatus: SocialStatus.SOCIAL_MODE,
      lastActive: new Date(),
      locationLat: 60.1699,
      locationLng: 24.9384,
      currentBarId: pub1.id,
      isVisibleOnMap: true,
      maxDistance: 1000,
    },
  });

  await prisma.userSocialProfile.create({
    data: {
      userId: user2.id,
      bio: "Cocktail connoisseur and jazz lover!",
      vibe: SocialVibe.NETWORKING,
      interests: ["Cocktails", "Jazz", "Wine Tasting"],
      isSocialMode: true,
      socialStatus: SocialStatus.SOCIAL_MODE,
      lastActive: new Date(),
      locationLat: 60.1685,
      locationLng: 24.9328,
      currentBarId: club1.id,
      isVisibleOnMap: true,
      maxDistance: 800,
    },
  });

  await prisma.userSocialProfile.create({
    data: {
      userId: user3.id,
      bio: "Sports fan and pub regular!",
      vibe: SocialVibe.CASUAL,
      interests: ["Sports", "Craft Beer", "Pub Food"],
      isSocialMode: false,
      socialStatus: SocialStatus.OFFLINE,
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
      currentBarId: null,
      isVisibleOnMap: false,
      maxDistance: 500,
    },
  });

  // ============================================
  // CREATE USER SOCIAL STATS
  // ============================================
  console.log("📊 Creating user social stats...");

  await prisma.userSocialStats.createMany({
    data: [
      {
        userId: user1.id,
        totalMeetups: 5,
        successfulMeetups: 4,
        hopInCount: 12,
        socialScore: 95,
        badges: ["Social Butterfly"],
      },
      {
        userId: user2.id,
        totalMeetups: 3,
        successfulMeetups: 3,
        hopInCount: 8,
        socialScore: 88,
        badges: ["Cocktail Expert"],
      },
      {
        userId: user3.id,
        totalMeetups: 2,
        successfulMeetups: 1,
        hopInCount: 5,
        socialScore: 72,
        badges: ["Sports Fan"],
      },
      {
        userId: user4.id,
        totalMeetups: 4,
        successfulMeetups: 3,
        hopInCount: 7,
        socialScore: 81,
        badges: ["History Buff"],
      },
      {
        userId: user5.id,
        totalMeetups: 3,
        successfulMeetups: 2,
        hopInCount: 6,
        socialScore: 76,
        badges: ["Tech Guru"],
      },
      {
        userId: user6.id,
        totalMeetups: 6,
        successfulMeetups: 5,
        hopInCount: 15,
        socialScore: 92,
        badges: ["Party Starter"],
      },
      {
        userId: user7.id,
        totalMeetups: 4,
        successfulMeetups: 4,
        hopInCount: 9,
        socialScore: 89,
        badges: ["Jazz Lover"],
      },
      {
        userId: user8.id,
        totalMeetups: 5,
        successfulMeetups: 4,
        hopInCount: 11,
        socialScore: 87,
        badges: ["Karaoke Star"],
      },
    ],
  });

  // ============================================
  // CREATE BAR SOCIAL ACTIVITIES
  // ============================================
  console.log("🏢 Creating bar social activities...");

  await prisma.barSocialActivity.createMany({
    data: [
      {
        barId: pub1.id,
        activeUsersCount: 3,
        socialMeetupsCount: 2,
        isHotspot: true,
        heatLevel: 8,
      },
      {
        barId: pub3.id,
        activeUsersCount: 2,
        socialMeetupsCount: 1,
        isHotspot: true,
        heatLevel: 6,
      },
      {
        barId: liveMusic1.id,
        activeUsersCount: 2,
        socialMeetupsCount: 1,
        isHotspot: true,
        heatLevel: 7,
      },
      {
        barId: karaoke1.id,
        activeUsersCount: 2,
        socialMeetupsCount: 1,
        isHotspot: true,
        heatLevel: 5,
      },
      {
        barId: tamperePub.id,
        activeUsersCount: 1,
        socialMeetupsCount: 0,
        isHotspot: false,
        heatLevel: 2,
      },
      {
        barId: turkuCocktail.id,
        activeUsersCount: 1,
        socialMeetupsCount: 0,
        isHotspot: false,
        heatLevel: 2,
      },
    ],
  });

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n✅ Unified seed completed successfully!");
  console.log("\n📊 SEED SUMMARY:");
  console.log(`   🏙️ Cities: ${await prisma.city.count()}`);
  console.log(`   🍻 Bars: ${await prisma.bar.count()}`);
  console.log(`   👤 Admin Users: ${await prisma.adminUser.count()}`);
  console.log(`   👥 Regular Users: ${await prisma.user.count()}`);
  console.log(`   👔 Bar Staff: ${await prisma.barStaff.count()}`);
  console.log(`   🎉 Promotions: ${await prisma.barPromotion.count()}`);
  console.log(`   🎫 VIP Passes: ${await prisma.vIPPassEnhanced.count()}`);
  console.log(
    `   🎭 Social Profiles: ${await prisma.userSocialProfile.count()}`,
  );

  console.log("\n📋 TEST ACCOUNTS:");
  console.log("   === BUSINESS APP (Bar Owners) ===");
  console.log("   Admin: siegy@hoppr.com / superadmin123");
  console.log("   Admin: pierce@hoppr.com / admin123");
  console.log("   Bar Owner: pierce@midnightclub.com / owner123");
  console.log("   Bar Manager: manager@midnightclub.com / staff123");
  console.log("   Bar Staff: tom@midnightclub.com / staff123");
  console.log("\n   === USER APP (Customers) ===");
  console.log("   Alex Johnson: alex.johnson@example.com / password123");
  console.log("   Sarah Miller: sarah.miller@example.com / password123");
  console.log("   (Password for all customer accounts: password123)");
  console.log("\n🍻 SAMPLE BARS (24+ bars):");
  console.log(
    "   Helsinki: 21 bars (Pubs, Clubs, Lounges, Cocktail, Sports, Karaoke, Live Music)",
  );
  console.log("   Tampere: 3 bars");
  console.log("   Turku: 3 bars");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
