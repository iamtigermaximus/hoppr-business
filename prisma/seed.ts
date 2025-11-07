// import { PrismaClient } from "@prisma/client";
// import { hash } from "bcryptjs";

// const prisma = new PrismaClient();

// async function hashPassword(password: string): Promise<string> {
//   return await hash(password, 12);
// }

// async function main() {
//   console.log("🌱 Starting database seed...");

//   try {
//     // Clean up existing data first to avoid conflicts
//     console.log("🧹 Cleaning up existing data...");
//     await prisma.vIPPassScan.deleteMany();
//     await prisma.vIPPass.deleteMany();
//     await prisma.barPromotion.deleteMany();
//     await prisma.barStaff.deleteMany();
//     await prisma.auditLog.deleteMany();
//     await prisma.bar.deleteMany();
//     await prisma.adminUser.deleteMany();

//     // Create admin users
//     console.log("👤 Creating admin users...");

//     const admin1 = await prisma.adminUser.create({
//       data: {
//         email: "siegy@hoppr.com",
//         name: "Siegfred Gamboa",
//         role: "SUPER_ADMIN",
//         hashedPassword: await hashPassword("superadmin123"),
//       },
//     });
//     console.log(`✅ Admin created: ${admin1.email}`);

//     const admin2 = await prisma.adminUser.create({
//       data: {
//         email: "pierce@hoppr.com",
//         name: "Pierce Cosgrove",
//         role: "SUPER_ADMIN",
//         hashedPassword: await hashPassword("admin123"),
//       },
//     });
//     console.log(`✅ Admin created: ${admin2.email}`);

//     // Create a sample bar
//     console.log("🍻 Creating sample bar...");
//     const bar = await prisma.bar.create({
//       data: {
//         name: "Midnight Club",
//         description: "Premium nightclub with VIP experience",
//         address: "123 Nightlife Street",
//         city: "Metropolis",
//         type: "CLUB",
//         phone: "+1234567890",
//         email: "info@midnightclub.com",
//         priceRange: "PREMIUM",
//         capacity: 300,
//         amenities: ["VIP", "Dance Floor", "Cocktail Bar", "DJ"],
//         coverImage: "/images/midnight-club-cover.jpg",
//         status: "CLAIMED",
//         isVerified: true,
//         isActive: true,
//         vipEnabled: true,
//         createdById: admin1.id,
//       },
//     });
//     console.log(`✅ Bar created: ${bar.name}`);

//     // Create bar owner
//     console.log("👑 Creating bar owner...");
//     const barOwner = await prisma.barStaff.create({
//       data: {
//         barId: bar.id,
//         email: "pierce@midnightclub.com",
//         name: "Pierce Cosgrove",
//         role: "OWNER",
//         permissions: ["all"],
//         hashedPassword: await hashPassword("owner123"),
//       },
//     });
//     console.log(`✅ Bar owner created: ${barOwner.email}`);

//     // Create bar staff
//     console.log("👥 Creating bar staff...");
//     const barStaff = await prisma.barStaff.create({
//       data: {
//         barId: bar.id,
//         email: "tom@midnightclub.com",
//         name: "Tom Wilson",
//         role: "STAFF",
//         permissions: ["scan_vip_passes", "view_analytics"],
//         hashedPassword: await hashPassword("staff123"),
//       },
//     });
//     console.log(`✅ Bar staff created: ${barStaff.email}`);

//     console.log("\n🎉 Seeding completed successfully!");
//     console.log("\n📋 Test Accounts:");
//     console.log("   Admin 1: siegy@hoppr.com / superadmin123");
//     console.log("   Admin 2: pierce@hoppr.com / admin123");
//     console.log("   Bar Owner: pierce@midnightclub.com / owner123");
//     console.log("   Bar Staff: tom@midnightclub.com / staff123");
//   } catch (error) {
//     console.error("❌ Seeding failed:", error);
//     throw error;
//   }
// }

// main()
//   .catch((e) => {
//     console.error("💥 Fatal error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Don't clean up - tables are empty after reset
    console.log("📦 Setting up fresh database...");

    // Create admin users
    console.log("👤 Creating admin users...");

    const admin1 = await prisma.adminUser.create({
      data: {
        email: "siegy@hoppr.com",
        name: "Siegfred Gamboa",
        role: "SUPER_ADMIN",
        hashedPassword: await hashPassword("superadmin123"),
      },
    });
    console.log(`✅ Admin created: ${admin1.email}`);

    const admin2 = await prisma.adminUser.create({
      data: {
        email: "pierce@hoppr.com",
        name: "Pierce Cosgrove",
        role: "SUPER_ADMIN",
        hashedPassword: await hashPassword("admin123"),
      },
    });
    console.log(`✅ Admin created: ${admin2.email}`);

    // Create a sample bar
    console.log("🍻 Creating sample bar...");
    const bar = await prisma.bar.create({
      data: {
        name: "Midnight Club",
        description: "Premium nightclub with VIP experience",
        address: "123 Nightlife Street",
        city: "Metropolis",
        type: "CLUB",
        phone: "+1234567890",
        email: "info@midnightclub.com",
        priceRange: "PREMIUM",
        capacity: 300,
        amenities: ["VIP", "Dance Floor", "Cocktail Bar", "DJ"],
        coverImage: "/images/midnight-club-cover.jpg",
        status: "CLAIMED",
        isVerified: true,
        isActive: true,
        vipEnabled: true,
        createdById: admin1.id,
      },
    });
    console.log(`✅ Bar created: ${bar.name}`);

    // Create bar owner
    console.log("👑 Creating bar owner...");
    const barOwner = await prisma.barStaff.create({
      data: {
        barId: bar.id,
        email: "pierce@midnightclub.com",
        name: "Pierce Cosgrove",
        role: "OWNER",
        permissions: ["*"],
        hashedPassword: await hashPassword("owner123"),
      },
    });
    console.log(`✅ Bar owner created: ${barOwner.email}`);

    // Create bar manager
    console.log("💼 Creating bar manager...");
    const barManager = await prisma.barStaff.create({
      data: {
        barId: bar.id,
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

    // Create bar staff
    console.log("👥 Creating bar staff...");
    const barStaff = await prisma.barStaff.create({
      data: {
        barId: bar.id,
        email: "tom@midnightclub.com",
        name: "Tom Wilson",
        role: "STAFF",
        permissions: ["scan_passes"],
        hashedPassword: await hashPassword("staff123"),
      },
    });
    console.log(`✅ Bar staff created: ${barStaff.email}`);

    // Create promotions manager
    console.log("📢 Creating promotions manager...");
    const promotionsManager = await prisma.barStaff.create({
      data: {
        barId: bar.id,
        email: "promo@midnightclub.com",
        name: "Emma Davis",
        role: "PROMOTIONS_MANAGER",
        permissions: ["manage_promotions", "view_analytics"],
        hashedPassword: await hashPassword("promo123"),
      },
    });
    console.log(`✅ Promotions manager created: ${promotionsManager.email}`);

    // Create a sample promotion
    console.log("🎉 Creating sample promotion...");
    const promotion = await prisma.barPromotion.create({
      data: {
        barId: bar.id,
        title: "Friday Night VIP Experience",
        description: "Skip the line and get 2 complimentary drinks",
        type: "VIP_OFFER",
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
    });
    console.log(`✅ Promotion created: ${promotion.title}`);

    // Create a sample VIP pass
    console.log("🎫 Creating sample VIP pass...");
    const vipPass = await prisma.vIPPass.create({
      data: {
        barId: bar.id,
        name: "Weekend Skip-the-Line Pass",
        description: "Fast entry for you and 3 friends",
        type: "SKIP_LINE",
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
    });
    console.log(`✅ VIP pass created: ${vipPass.name}`);

    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📋 Test Accounts:");
    console.log("   Admin 1: siegy@hoppr.com / superadmin123");
    console.log("   Admin 2: pierce@hoppr.com / admin123");
    console.log("   Bar Owner: pierce@midnightclub.com / owner123");
    console.log("   Bar Manager: manager@midnightclub.com / manager123");
    console.log("   Bar Staff: tom@midnightclub.com / staff123");
    console.log("   Promotions Manager: promo@midnightclub.com / promo123");
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
