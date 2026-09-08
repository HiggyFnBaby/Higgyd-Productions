import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seeds the single Owner account this app supports in v1 — there is no
// public signup route. Re-running this script is safe: it upserts on email.
async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD in .env before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const owner = await prisma.owner.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), passwordHash },
    update: { passwordHash },
  });

  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  console.log(`Seeded owner account: ${owner.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
