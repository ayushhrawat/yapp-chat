import { MongoClient } from 'mongodb';

// MongoDB connection
const uri = import.meta.env.VITE_MONGODB_URI;
const dbName = import.meta.env.VITE_MONGODB_DATABASE || 'yapp-chat';

if (!uri) {
  throw new Error('Please add your MongoDB URI to the .env file');
}

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable to avoid multiple connections
  if (!global._mongoClientPromise) {
   client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise
export async function getDb() {
 const client = await clientPromise;
 return client.db(dbName);
}

export default clientPromise;
