UPDATE "Species" SET "name" = 'Canino', "updatedAt" = NOW() WHERE "name" = 'Perro';
UPDATE "Species" SET "name" = 'Felino', "updatedAt" = NOW() WHERE "name" = 'Gato';
UPDATE "Breed" SET "name" = 'Doméstico de pelo corto', "updatedAt" = NOW()
  WHERE "name" = 'Mestizo / Sin raza definida'
    AND "speciesId" = (SELECT "id" FROM "Species" WHERE "name" = 'Felino');
