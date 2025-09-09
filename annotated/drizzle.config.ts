// Drizzle ORM configuration for database schema management
import { defineConfig } from "drizzle-kit";

// Ensure DATABASE_URL environment variable is set - required for database connection
if (!process.env.DATABASE_URL) {
  // Throw error if DATABASE_URL is missing to prevent runtime failures
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Export Drizzle configuration object
export default defineConfig({
  // Directory where migration files will be generated
  out: "./migrations",
  // Path to database schema definition file
  schema: "./shared/schema.ts",
  // Database type - using PostgreSQL
  dialect: "postgresql",
  // Database connection credentials
  dbCredentials: {
    // Use environment variable for database connection string (Neon serverless)
    url: process.env.DATABASE_URL,
  },
});