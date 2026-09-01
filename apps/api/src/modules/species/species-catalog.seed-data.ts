import type { PrismaClient } from "../../generated/prisma/client.js"

type SpeciesSeed = {
  name: string
  breeds: string[]
}

export const SPECIES_SEED_DATA: SpeciesSeed[] = [
  {
    name: "Perro",
    breeds: [
      "Labrador Retriever",
      "Golden Retriever",
      "Pastor Alemán",
      "Bulldog Francés",
      "Poodle",
      "Chihuahua",
      "Beagle",
      "Mestizo / Sin raza definida",
    ],
  },
  {
    name: "Gato",
    breeds: [
      "Común Europeo",
      "Siamés",
      "Persa",
      "Maine Coon",
      "Angora",
      "Mestizo / Sin raza definida",
    ],
  },
]

export async function seedCatalog(prisma: PrismaClient) {
  for (const speciesSeed of SPECIES_SEED_DATA) {
    const species = await prisma.species.upsert({
      where: { name: speciesSeed.name },
      update: {},
      create: { name: speciesSeed.name },
    })

    for (const breedName of speciesSeed.breeds) {
      await prisma.breed.upsert({
        where: { name_speciesId: { name: breedName, speciesId: species.id } },
        update: {},
        create: { name: breedName, speciesId: species.id },
      })
    }
  }
}
