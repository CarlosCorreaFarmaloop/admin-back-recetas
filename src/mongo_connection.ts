import { MongoClient } from 'mongodb';

export const getMongoClient = () => {
  try {
    const mongo_connection_string = process.env.MONGO_CONNECTION_STRING as string;

    if (!mongo_connection_string) {
      console.log('Fallo al conectar mongo, falta el string de conexión.');
    }

    const mongoClient = new MongoClient(mongo_connection_string);

    return mongoClient;
  } catch (error) {
    console.error('Error conectando a MongoDB. ', error);
    throw error;
  }
};
