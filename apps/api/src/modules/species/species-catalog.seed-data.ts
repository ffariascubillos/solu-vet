import type { PrismaClient } from "../../generated/prisma/client.js"

type SpeciesSeed = {
  name: string
  breeds: string[]
}

export const SPECIES_SEED_DATA: SpeciesSeed[] = [
  {
    name: "Canino",
    breeds: [
      "Labrador Retriever",
      "Golden Retriever",
      "Pastor Alemán",
      "Bulldog Francés",
      "Poodle",
      "Chihuahua",
      "Beagle",
      "Mestizo / Sin raza definida",
      "Fox Terrier Chileno",
      "Schnauzer",
      "Yorkshire Terrier",
      "Shih Tzu",
      "Cocker Spaniel",
      "Dachshund",
      "Border Collie",
      "Husky Siberiano",
      "Pug",
      "Boxer",
      "Rottweiler",
    ],
  },
  {
    name: "Felino",
    breeds: [
      "Común Europeo",
      "Siamés",
      "Persa",
      "Maine Coon",
      "Angora",
      "Doméstico de pelo corto",
      "Doméstico de pelo largo",
      "Bengalí",
      "Ragdoll",
      "Británico de pelo corto",
      "Esfinge",
    ],
  },
  {
    name: "Lagomorfo",
    breeds: [
      "Conejo doméstico / Mestizo",
      "Enano holandés",
      "Belier (Lop)",
      "Cabeza de león",
      "Rex",
    ],
  },
  {
    name: "Erizo de tierra",
    breeds: ["Erizo africano pigmeo"],
  },
  {
    name: "Hurón",
    breeds: ["Hurón doméstico"],
  },
  {
    name: "Cobayo",
    breeds: [
      "Americano (pelo corto)",
      "Abisinio",
      "Peruano (pelo largo)",
      "Mestizo",
    ],
  },
  {
    name: "Hámster",
    breeds: ["Sirio", "Ruso (enano)", "Roborovski", "Chino"],
  },
  {
    name: "Reptil",
    breeds: ["Tortuga de tierra", "Tortuga de agua", "Otro reptil"],
  },
  {
    name: "Ave",
    breeds: [
      "Ninfa (Cacatúa ninfa)",
      "Canario",
      "Catita australiana",
      "Agapornis",
      "Loro",
      "Loro Tricahue",
      "Loro Choroy",
      "Cachaña",
      "Perico Cordillerano",
      "Otra ave",
    ],
  },
  {
    name: "Chinchilla",
    breeds: ["Chinchilla doméstica"],
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
