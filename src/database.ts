import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI ?? '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? '';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectToDatabase = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(MONGODB_DB_NAME);
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw new Error('Database connection failed');
  }
};
