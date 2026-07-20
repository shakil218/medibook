import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medibook";
export const client = new MongoClient(uri);

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");
    db = client.db("medibook");

    // Create required indexes
    try {
      await db.collection("doctorProfile").createIndex({ specialty: 1 });
      await db.collection("doctorProfile").createIndex({ city: 1 });
      await db.collection("doctorProfile").createIndex({ avgRating: -1 });

      const appointmentsCol = db.collection("appointments");
      
      const existingIndexes = await appointmentsCol.listIndexes().toArray();
      const indexName = "doctorId_1_date_1_timeSlot_1";
      const conflictIndex = existingIndexes.find(idx => idx.name === indexName);
      
      if (conflictIndex) {
        console.log(`Dropping unique booking index: ${indexName}`);
        await appointmentsCol.dropIndex(indexName);
      }
      
      console.log("Database indexes verified/created successfully.");
    } catch (idxError) {
      console.error("Warning: Failed to create database indexes:", idxError);
    }

    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error; // Let the caller handle the failure (important for Vercel serverless)
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
}
