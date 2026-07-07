import { PrismaClient, BarStaffRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding business app data...\n");

  const hashedPassword = await hash("admin123", 12);

  // Create SUPER_ADMIN in dedicated AdminUser table
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@hoppr.fi" },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: "admin@hoppr.fi",
      name: "Hoppr Admin",
      hashedPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✅ SUPER_ADMIN: ${admin.email}`);

  // Seed AI credit pools for admin monitoring
  console.log("\n💰 Seeding AI credit pools...");

  await prisma.creditPool.upsert({
    where: { provider: "deepseek" },
    update: {},
    create: {
      provider: "deepseek",
      totalCredits: 10.0,
      alertThreshold: 2.0,
      alertEmail: "admin@hoppr.fi",
      isActive: true,
    },
  });
  console.log("✅ CreditPool: deepseek ($10.00, alert at $2.00)");

  await prisma.creditPool.upsert({
    where: { provider: "bfl_flux" },
    update: {},
    create: {
      provider: "bfl_flux",
      totalCredits: 5.0,
      alertThreshold: 1.0,
      alertEmail: "admin@hoppr.fi",
      isActive: true,
    },
  });
  console.log("✅ CreditPool: bfl_flux ($5.00, alert at $1.00)");

  // Create bar staff records linked to existing bars
  const bars = await prisma.bar.findMany({
    take: 5,
    select: { id: true, name: true },
  });
  if (bars.length > 0) {
    for (const bar of bars) {
      const staffEmail = `staff@${bar.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.fi`;
      const user = await prisma.user.upsert({
        where: { email: staffEmail },
        update: {},
        create: {
          email: staffEmail,
          name: `${bar.name} Staff`,
          hashedPassword,
          role: "BAR_STAFF",
        },
      });

      await prisma.barStaff.upsert({
        where: { barId_email: { barId: bar.id, email: staffEmail } },
        update: { userId: user.id },
        create: {
          barId: bar.id,
          userId: user.id,
          email: staffEmail,
          name: `${bar.name} Staff`,
          role: BarStaffRole.MANAGER,
          permissions: ["manage_promos", "manage_events", "view_analytics"],
        },
      });
      console.log(`✅ BarStaff: ${staffEmail} → ${bar.name}`);
    }
  }

  // Create Midnight Club staff credentials
  console.log("\n🎯 Creating Midnight Club staff...");

  // Find Midnight Club bar
  const midnightClub = await prisma.bar.findFirst({
    where: {
      name: {
        contains: "Midnight Club",
        mode: "insensitive",
      },
    },
    select: { id: true, name: true },
  });

  if (midnightClub) {
    // Create multiple staff members for Midnight Club
    // Using actual enum values from your schema
    const staffMembers = [
      {
        email: "manager@midnightclub.fi",
        name: "Midnight Club Manager",
        role: BarStaffRole.MANAGER,
      },
      {
        email: "promotions@midnightclub.fi",
        name: "Midnight Club Promotions Manager",
        role: BarStaffRole.PROMOTIONS_MANAGER,
      },
      {
        email: "bartender1@midnightclub.fi",
        name: "Midnight Club Bartender",
        role: BarStaffRole.STAFF,
      },
      {
        email: "bartender2@midnightclub.fi",
        name: "Midnight Club Senior Bartender",
        role: BarStaffRole.STAFF,
      },
      {
        email: "security@midnightclub.fi",
        name: "Midnight Club Security",
        role: BarStaffRole.STAFF,
      },
    ];

    for (const staff of staffMembers) {
      // Create user
      const user = await prisma.user.upsert({
        where: { email: staff.email },
        update: {},
        create: {
          email: staff.email,
          name: staff.name,
          hashedPassword,
          role: "BAR_STAFF",
        },
      });

      // Create bar staff record
      let permissions: string[] = [];

      if (staff.role === BarStaffRole.MANAGER) {
        permissions = [
          "manage_promos",
          "manage_events",
          "view_analytics",
          "manage_staff",
        ];
      } else if (staff.role === BarStaffRole.PROMOTIONS_MANAGER) {
        permissions = ["manage_promos", "manage_events", "view_analytics"];
      } else {
        permissions = ["view_promos", "view_events"];
      }

      await prisma.barStaff.upsert({
        where: { barId_email: { barId: midnightClub.id, email: staff.email } },
        update: {
          userId: user.id,
          name: staff.name,
          role: staff.role,
          permissions: permissions,
        },
        create: {
          barId: midnightClub.id,
          userId: user.id,
          email: staff.email,
          name: staff.name,
          role: staff.role,
          permissions: permissions,
        },
      });
      console.log(`✅ Midnight Club Staff: ${staff.email} (${staff.role})`);
    }

    // Create a test claim for Midnight Club
    const ownerEmail = "owner@midnightclub.fi";
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        name: "Midnight Club Owner",
        hashedPassword,
        role: "BAR_STAFF",
      },
    });

    await prisma.barClaim.upsert({
      where: { id: `test-claim-midnightclub` },
      update: {},
      create: {
        id: `test-claim-midnightclub`,
        barId: midnightClub.id,
        userId: owner.id,
        documentUrls: [],
        notes: "I am the owner of Midnight Club. Please verify my claim.",
        status: "CLAIMED",
      },
    });
    console.log(`✅ Midnight Club test claim created`);

    console.log(`\n📋 Midnight Club Staff Credentials:`);
    console.log(`   Manager:           manager@midnightclub.fi / admin123`);
    console.log(`   Promotions Mgr:    promotions@midnightclub.fi / admin123`);
    console.log(`   Bartender:         bartender1@midnightclub.fi / admin123`);
    console.log(`   Bartender:         bartender2@midnightclub.fi / admin123`);
    console.log(`   Security:          security@midnightclub.fi / admin123`);
    console.log(`   Owner:             owner@midnightclub.fi / admin123`);
  } else {
    console.log(
      `⚠️ Midnight Club bar not found in database. Please create it first.`,
    );
  }

  console.log(`\n🎉 Done!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
