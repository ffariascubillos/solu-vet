if (!process.env.APP_URL) {
  throw new Error(
    "APP_URL no está definida. Configúrala en apps/api/.env antes de arrancar la API.",
  )
}

export const APP_URL: string = process.env.APP_URL
