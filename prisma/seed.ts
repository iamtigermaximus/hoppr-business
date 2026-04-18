import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    console.log("📦 Checking and seeding database...");

    // Create or update admin users
    console.log("👤 Creating/updating admin users...");

    const admin1 = await prisma.adminUser.upsert({
      where: { email: "siegy@hoppr.com" },
      update: {
        name: "Siegfred Gamboa",
        role: "SUPER_ADMIN",
        hashedPassword: await hashPassword("superadmin123"),
      },
      create: {
        email: "siegy@hoppr.com",
        name: "Siegfred Gamboa",
        role: "SUPER_ADMIN",
        hashedPassword: await hashPassword("superadmin123"),
      },
    });
    console.log(`✅ Admin upserted: ${admin1.email}`);

    const admin2 = await prisma.adminUser.upsert({
      where: { email: "pierce@hoppr.com" },
      update: {
        name: "Pierce Cosgrove",
        role: "SUPER_ADMIN",
        hashedPassword: await hashPassword("admin123"),
      },
      create: {
        email: "pierce@hoppr.com",
        name: "Pierce Cosgrove",
        role: "SUPER_ADMIN",
        hashedPassword: await hashPassword("admin123"),
      },
    });
    console.log(`✅ Admin upserted: ${admin2.email}`);

    // Clean up existing bars and related data to avoid conflicts
    console.log("🧹 Cleaning up existing bars and related data...");
    await prisma.promotionUsage.deleteMany();
    await prisma.vIPPassScan.deleteMany();
    await prisma.vIPPass.deleteMany();
    await prisma.barPromotion.deleteMany();
    await prisma.barStaff.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.bar.deleteMany();

    // Create multiple sample bars
    console.log("🍻 Creating sample bars...");

    const bars = [
      {
        name: "The Golden Pint",
        description: "Cozy pub with craft beers and live sports",
        address: "Main Street 123",
        city: "Helsinki",
        district: "Kallio",
        type: "PUB" as const,
        phone: "+358401234567",
        email: "info@goldenpint.fi",
        website: "https://goldenpint.fi",
        instagram: "@goldenpint",
        priceRange: "MODERATE" as const,
        capacity: 120,
        amenities: ["Terrace", "Sports TV", "Craft Beer"],
        operatingHours: {
          monday: { open: "16:00", close: "02:00" },
          tuesday: { open: "16:00", close: "02:00" },
          wednesday: { open: "16:00", close: "02:00" },
          thursday: { open: "16:00", close: "02:00" },
          friday: { open: "16:00", close: "04:00" },
          saturday: { open: "14:00", close: "04:00" },
          sunday: { open: "14:00", close: "02:00" },
        },
        vipEnabled: true,
        coverImage:
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800",
        imageUrls: [
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800",
          "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
        ],
        logoUrl:
          "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400",
        status: "UNCLAIMED" as const,
        isVerified: false,
        isActive: true,
      },
      {
        name: "Midnight Club",
        description: "Premium nightclub with VIP experience",
        address: "Night Avenue 45",
        city: "Helsinki",
        district: "Kamppi",
        type: "CLUB" as const,
        phone: "+358409876543",
        email: "events@midnightclub.fi",
        website: "https://midnightclub.fi",
        instagram: "@midnightclub",
        priceRange: "PREMIUM" as const,
        capacity: 300,
        amenities: ["VIP Area", "DJ", "Cocktails"],
        operatingHours: {
          thursday: { open: "22:00", close: "04:00" },
          friday: { open: "22:00", close: "04:00" },
          saturday: { open: "22:00", close: "04:00" },
        },
        vipEnabled: true,
        coverImage:
          "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
        imageUrls: [
          "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
          "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800",
        ],
        logoUrl:
          "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400",
        status: "CLAIMED" as const,
        isVerified: true,
        isActive: true,
      },
      {
        name: "Jazz Lounge",
        description: "Intimate jazz venue with live performances",
        address: "Music Street 67",
        city: "Espoo",
        district: "Tapiola",
        type: "LOUNGE" as const,
        phone: "+358405551122",
        email: "bookings@jazzlounge.fi",
        website: "https://jazzlounge.fi",
        instagram: "@jazzlounge",
        priceRange: "PREMIUM" as const,
        capacity: 80,
        amenities: ["Live Music", "Cocktails", "Reservations"],
        operatingHours: {
          monday: { open: "18:00", close: "01:00" },
          tuesday: { open: "18:00", close: "01:00" },
          wednesday: { open: "18:00", close: "01:00" },
          thursday: { open: "18:00", close: "02:00" },
          friday: { open: "18:00", close: "02:00" },
          saturday: { open: "20:00", close: "02:00" },
        },
        vipEnabled: false,
        coverImage:
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
        imageUrls: [
          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
          "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800",
        ],
        logoUrl:
          "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400",
        status: "VERIFIED" as const,
        isVerified: true,
        isActive: true,
      },
      {
        name: "Sports Arena Bar",
        description: "Best spot to watch sports with friends",
        address: "Stadium Road 10",
        city: "Helsinki",
        district: "Töölö",
        type: "SPORTS_BAR" as const,
        phone: "+358407774455",
        email: "info@sportsarena.fi",
        website: "https://sportsarena.fi",
        instagram: "@sportsarena",
        priceRange: "MODERATE" as const,
        capacity: 150,
        amenities: ["Big Screens", "Beer Pong", "Pool Tables"],
        operatingHours: {
          monday: { open: "15:00", close: "01:00" },
          tuesday: { open: "15:00", close: "01:00" },
          wednesday: { open: "15:00", close: "01:00" },
          thursday: { open: "15:00", close: "02:00" },
          friday: { open: "15:00", close: "03:00" },
          saturday: { open: "12:00", close: "03:00" },
          sunday: { open: "12:00", close: "01:00" },
        },
        vipEnabled: true,
        coverImage:
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
        imageUrls: [
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
          "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800",
        ],
        logoUrl:
          "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400",
        status: "UNCLAIMED" as const,
        isVerified: false,
        isActive: true,
      },
      {
        name: "Cocktail Corner",
        description: "Artisanal cocktail bar with mixology",
        address: "Bar Lane 89",
        city: "Vantaa",
        district: "Aviapolis",
        type: "COCKTAIL_BAR" as const,
        phone: "+358406663344",
        email: "hello@cocktailcorner.fi",
        website: "https://cocktailcorner.fi",
        instagram: "@cocktailcorner",
        priceRange: "PREMIUM" as const,
        capacity: 60,
        amenities: ["Craft Cocktails", "Lounge", "Mixology"],
        operatingHours: {
          tuesday: { open: "17:00", close: "01:00" },
          wednesday: { open: "17:00", close: "01:00" },
          thursday: { open: "17:00", close: "02:00" },
          friday: { open: "17:00", close: "02:00" },
          saturday: { open: "18:00", close: "02:00" },
        },
        vipEnabled: true,
        coverImage:
          "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800",
        imageUrls: [
          "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800",
          "https://images.unsplash.com/photo-1570598912132-0ba1dc952b7d?w=800",
        ],
        logoUrl:
          "https://images.unsplash.com/photo-1570598912132-0ba1dc952b7d?w=400",
        status: "CLAIMED" as const,
        isVerified: true,
        isActive: true,
      },
    ];

    const createdBars = [];
    for (const barData of bars) {
      const bar = await prisma.bar.create({
        data: {
          ...barData,
          createdById: admin1.id,
        },
      });
      createdBars.push(bar);
      console.log(`✅ Bar created: ${bar.name}`);
    }

    // Create staff for Midnight Club (bar index 1)
    const midnightClub = createdBars[1];

    console.log("👑 Creating bar owner for Midnight Club...");
    const barOwner = await prisma.barStaff.create({
      data: {
        barId: midnightClub.id,
        email: "pierce@midnightclub.com",
        name: "Pierce Cosgrove",
        role: "OWNER",
        permissions: ["*"],
        hashedPassword: await hashPassword("owner123"),
      },
    });
    console.log(`✅ Bar owner created: ${barOwner.email}`);

    console.log("💼 Creating bar manager for Midnight Club...");
    const barManager = await prisma.barStaff.create({
      data: {
        barId: midnightClub.id,
        email: "manager@midnightclub.com",
        name: "Sarah Johnson",
        role: "MANAGER",
        permissions: [
          "manage_staff",
          "manage_promotions",
          "view_analytics",
          "scan_passes",
        ],
        hashedPassword: await hashPassword("manager123"),
      },
    });
    console.log(`✅ Bar manager created: ${barManager.email}`);

    console.log("👥 Creating bar staff for Midnight Club...");
    const barStaff = await prisma.barStaff.create({
      data: {
        barId: midnightClub.id,
        email: "tom@midnightclub.com",
        name: "Tom Wilson",
        role: "STAFF",
        permissions: ["scan_passes"],
        hashedPassword: await hashPassword("staff123"),
      },
    });
    console.log(`✅ Bar staff created: ${barStaff.email}`);

    // Create owner for Cocktail Corner (bar index 4)
    console.log("👑 Creating owner for Cocktail Corner...");
    const cocktailCornerOwner = await prisma.barStaff.create({
      data: {
        barId: createdBars[4].id,
        email: "siegy@cocktailcorner.com",
        name: "Siegfred Gamboa",
        role: "OWNER",
        permissions: ["*"],
        hashedPassword: await hashPassword("siegy123"),
      },
    });
    console.log(
      `✅ Cocktail Corner owner created: ${cocktailCornerOwner.email}`,
    );

    // Create staff for The Golden Pint (bar index 0)
    console.log("👥 Creating staff for The Golden Pint...");
    const goldenPintStaff = await prisma.barStaff.create({
      data: {
        barId: createdBars[0].id,
        email: "staff@goldenpint.fi",
        name: "Anna Kowalski",
        role: "STAFF",
        permissions: ["scan_passes", "view_analytics"],
        hashedPassword: await hashPassword("golden123"),
      },
    });
    console.log(`✅ Golden Pint staff created: ${goldenPintStaff.email}`);

    // Create manager for Sports Arena Bar (bar index 3)
    console.log("💼 Creating manager for Sports Arena Bar...");
    const sportsBarManager = await prisma.barStaff.create({
      data: {
        barId: createdBars[3].id,
        email: "manager@sportsarena.fi",
        name: "Marko Virtanen",
        role: "MANAGER",
        permissions: [
          "manage_staff",
          "manage_promotions",
          "view_analytics",
          "scan_passes",
        ],
        hashedPassword: await hashPassword("sports123"),
      },
    });
    console.log(`✅ Sports Arena manager created: ${sportsBarManager.email}`);

    // Create staff for Jazz Lounge (bar index 2)
    console.log("🎷 Creating promotions manager for Jazz Lounge...");
    const jazzLoungeStaff = await prisma.barStaff.create({
      data: {
        barId: createdBars[2].id,
        email: "events@jazzlounge.fi",
        name: "Laura Mäkinen",
        role: "PROMOTIONS_MANAGER",
        permissions: ["manage_promotions", "view_analytics"],
        hashedPassword: await hashPassword("jazz123"),
      },
    });
    console.log(`✅ Jazz Lounge staff created: ${jazzLoungeStaff.email}`);

    // Create second staff for Midnight Club
    console.log("👥 Creating additional security staff for Midnight Club...");
    const midnightClubStaff2 = await prisma.barStaff.create({
      data: {
        barId: midnightClub.id,
        email: "security@midnightclub.com",
        name: "James Rodriguez",
        role: "STAFF",
        permissions: ["scan_passes"],
        hashedPassword: await hashPassword("security123"),
      },
    });
    console.log(
      `✅ Additional Midnight Club staff created: ${midnightClubStaff2.email}`,
    );

    // Create promotions for different bars
    console.log("🎉 Creating sample promotions...");

    const promotions = [
      {
        barId: createdBars[0].id,
        title: "Happy Hour Special",
        description: "50% off all craft beers during happy hour",
        type: "DRINK_SPECIAL" as const,
        accentColor: "#FFD700",
        callToAction: "Join Now",
        discount: 50,
        conditions: ["Valid 4pm-7pm", "Monday to Friday"],
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        validDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        validHours: { start: "16:00", end: "19:00" },
        isActive: true,
        isApproved: true,
        priority: 1,
      },
      {
        barId: createdBars[1].id,
        title: "Friday Night VIP Experience",
        description: "Skip the line and get 2 complimentary drinks",
        type: "VIP_OFFER" as const,
        accentColor: "#FF6B35",
        callToAction: "Book Now",
        conditions: ["18+ only", "Valid ID required", "Dress code enforced"],
        startDate: new Date("2024-12-01"),
        endDate: new Date("2024-12-31"),
        validDays: ["Friday"],
        isActive: true,
        isApproved: true,
        priority: 1,
      },
      {
        barId: createdBars[2].id,
        title: "Live Jazz Nights",
        description: "Enjoy live jazz performances every Thursday",
        type: "THEME_NIGHT" as const,
        accentColor: "#8B4513",
        callToAction: "Reserve Table",
        conditions: ["Reservation recommended", "No cover charge"],
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        validDays: ["Thursday"],
        validHours: { start: "20:00", end: "23:00" },
        isActive: true,
        isApproved: true,
        priority: 2,
      },
    ];

    for (const promoData of promotions) {
      const promotion = await prisma.barPromotion.create({
        data: promoData,
      });
      console.log(`✅ Promotion created: ${promotion.title}`);
    }

    // ============================================
    // 📊 ADD SAMPLE ANALYTICS DATA
    // ============================================
    console.log("\n📊 Adding sample analytics data...");

    const sampleUserIds = [
      "user_001_john_doe",
      "user_002_jane_smith",
      "user_003_mike_wilson",
      "user_004_sarah_johnson",
      "user_005_david_brown",
      "user_006_emma_davis",
      "user_007_chris_martinez",
      "user_008_lisa_anderson",
    ];

    for (const bar of createdBars) {
      const barPromotions = await prisma.barPromotion.findMany({
        where: { barId: bar.id },
      });

      for (const promo of barPromotions) {
        // Add random card views and redemptions
        const cardViews = Math.floor(Math.random() * 500) + 50;
        const redemptions = Math.floor(cardViews * (Math.random() * 0.5 + 0.2));

        await prisma.barPromotion.update({
          where: { id: promo.id },
          data: {
            cardViews,
            redemptions,
            views: Math.floor(Math.random() * 1000) + 100,
            clicks: Math.floor(Math.random() * 300) + 30,
          },
        });

        const conversionRate = Math.round((redemptions / cardViews) * 100);
        console.log(
          `   📊 ${promo.title}: ${cardViews} views → ${redemptions} redemptions (${conversionRate}% conversion)`,
        );

        // Add usage history (multiple uses per user)
        const numUsers = Math.floor(Math.random() * 5) + 2;
        for (let i = 0; i < numUsers; i++) {
          const userId = sampleUserIds[i % sampleUserIds.length];
          const usageCount = Math.floor(Math.random() * 4) + 1;

          await prisma.promotionUsage.upsert({
            where: {
              promotionId_userId: {
                promotionId: promo.id,
                userId: userId,
              },
            },
            update: {
              usageCount,
              lastUsedAt: new Date(),
            },
            create: {
              promotionId: promo.id,
              userId: userId,
              barId: bar.id,
              usageCount,
              firstUsedAt: new Date(),
              lastUsedAt: new Date(),
            },
          });
        }
        console.log(`      👥 Added usage history for ${numUsers} users`);
      }
    }

    // Create VIP passes
    console.log("\n🎫 Creating sample VIP passes...");

    const vipPasses = [
      {
        barId: createdBars[1].id,
        name: "Weekend Skip-the-Line Pass",
        description: "Fast entry for you and 3 friends",
        type: "SKIP_LINE" as const,
        price: 49.99,
        originalPrice: 79.99,
        benefits: [
          "Skip the line",
          "Priority entry",
          "Complimentary coat check",
        ],
        validityStart: new Date("2024-12-01"),
        validityEnd: new Date("2024-12-31"),
        validDays: ["Friday", "Saturday"],
        totalQuantity: 100,
        maxPerUser: 2,
        isActive: true,
      },
      {
        barId: createdBars[4].id,
        name: "Mixology Masterclass",
        description: "Learn cocktail making from expert mixologists",
        type: "PREMIUM_ENTRY" as const,
        price: 89.99,
        originalPrice: 120.0,
        benefits: [
          "2-hour masterclass",
          "Take home recipe book",
          "Complimentary cocktails",
        ],
        validityStart: new Date("2024-02-01"),
        validityEnd: new Date("2024-06-30"),
        validDays: ["Saturday"],
        totalQuantity: 20,
        maxPerUser: 1,
        isActive: true,
      },
    ];

    for (const passData of vipPasses) {
      const vipPass = await prisma.vIPPass.create({
        data: passData,
      });
      console.log(`✅ VIP pass created: ${vipPass.name}`);
    }

    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📋 Test Accounts:");
    console.log("   Admin 1: siegy@hoppr.com / superadmin123");
    console.log("   Admin 2: pierce@hoppr.com / admin123");
    console.log("\n📋 Bar Owners:");
    console.log("   Midnight Club Owner: pierce@midnightclub.com / owner123");
    console.log(
      "   Cocktail Corner Owner: siegy@cocktailcorner.com / siegy123",
    );
    console.log("\n📋 Bar Managers:");
    console.log(
      "   Midnight Club Manager: manager@midnightclub.com / manager123",
    );
    console.log("   Sports Arena Manager: manager@sportsarena.fi / sports123");
    console.log("\n📋 Bar Staff:");
    console.log("   Midnight Club Staff: tom@midnightclub.com / staff123");
    console.log(
      "   Midnight Club Security: security@midnightclub.com / security123",
    );
    console.log("   Golden Pint Staff: staff@goldenpint.fi / golden123");
    console.log("\n📋 Promotions Managers:");
    console.log("   Jazz Lounge: events@jazzlounge.fi / jazz123");
    console.log("\n🍻 Sample Bars Created:");
    console.log("   • The Golden Pint (Pub) - Helsinki");
    console.log("   • Midnight Club (Club) - Helsinki");
    console.log("   • Jazz Lounge (Lounge) - Espoo");
    console.log("   • Sports Arena Bar (Sports Bar) - Helsinki");
    console.log("   • Cocktail Corner (Cocktail Bar) - Vantaa");
    console.log("\n📊 Analytics Data Added:");
    console.log("   • Card views and redemptions for each promotion");
    console.log("   • Usage history for multiple users");
    console.log("   • Check Performance tab in Analytics to see the data!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("💥 Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
