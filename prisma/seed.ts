import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Clean up existing data first to avoid conflicts
    console.log("🧹 Cleaning up existing data...");
    await prisma.vIPPassScan.deleteMany();
    await prisma.vIPPass.deleteMany();
    await prisma.barPromotion.deleteMany();
    await prisma.barStaff.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.bar.deleteMany();
    await prisma.adminUser.deleteMany();

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
        permissions: ["all"],
        hashedPassword: await hashPassword("owner123"),
      },
    });
    console.log(`✅ Bar owner created: ${barOwner.email}`);

    // Create bar staff
    console.log("👥 Creating bar staff...");
    const barStaff = await prisma.barStaff.create({
      data: {
        barId: bar.id,
        email: "tom@midnightclub.com",
        name: "Tom Wilson",
        role: "STAFF",
        permissions: ["scan_vip_passes", "view_analytics"],
        hashedPassword: await hashPassword("staff123"),
      },
    });
    console.log(`✅ Bar staff created: ${barStaff.email}`);

    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📋 Test Accounts:");
    console.log("   Admin 1: siegy@hoppr.com / superadmin123");
    console.log("   Admin 2: pierce@hoppr.com / admin123");
    console.log("   Bar Owner: pierce@midnightclub.com / owner123");
    console.log("   Bar Staff: tom@midnightclub.com / staff123");
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
