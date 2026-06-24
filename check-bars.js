const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const bars = await prisma.bar.findMany({
    select: { id: true, name: true, type: true, status: true },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  console.log(JSON.stringify(bars, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
