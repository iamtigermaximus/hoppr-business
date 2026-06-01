import { PrismaClient } from "@prisma/client";
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

  // Create bar staff records linked to existing bars
  const bars = await prisma.bar.findMany({ take: 5, select: { id: true, name: true } });
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
          role: "MANAGER",
          permissions: ["manage_promos", "manage_events", "view_analytics"],
        },
      });
      console.log(`✅ BarStaff: ${staffEmail} → ${bar.name}`);
    }
  }

  console.log(`\n🎉 Done!`);

  // Create a test claim for the first bar
  if (bars.length > 0) {
    const claimBar = bars[0];
    const ownerEmail = `owner@${claimBar.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.fi`;
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        name: `${claimBar.name} Owner`,
        hashedPassword,
        role: "BAR_STAFF",
      },
    });

    await prisma.barClaim.upsert({
      where: { id: `test-claim-${claimBar.id}` },
      update: {},
      create: {
        id: `test-claim-${claimBar.id}`,
        barId: claimBar.id,
        userId: owner.id,
        documentUrls: [],
        notes: "I am the owner of this bar. Please verify my claim.",
        status: "CLAIMED",
      },
    });
    console.log(`✅ Test claim created for ${claimBar.name}`);
  }

  console.log(`\n🎉 Done!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
