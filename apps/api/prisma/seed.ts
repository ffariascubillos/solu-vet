import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client.js"
import { seedCatalog } from "../src/modules/species/species-catalog.seed-data.js"

async function main() {
  const connectionString = process.env.DATABASE_URL!
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  await seedCatalog(prisma)

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
