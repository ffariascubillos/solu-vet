import dotenv from "dotenv"

dotenv.config()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run API tests")
}

const testDatabaseUrl = new URL(databaseUrl)
testDatabaseUrl.pathname = "/solu_vet_test"

process.env.DATABASE_URL = testDatabaseUrl.toString()
