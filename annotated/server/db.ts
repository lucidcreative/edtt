// Database configuration and connection setup using Neon serverless PostgreSQL
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use WebSocket constructor for serverless environment
neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL environment variable exists before attempting connection
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool using the database URL from environment variables
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Initialize Drizzle ORM with connection pool and schema definitions
export const db = drizzle({ client: pool, schema });