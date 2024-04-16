import mongoose from 'mongoose';

export const connectoToMongoDB = async () => {
  try {
    const mongo_connection_url = process.env.MONGO_CONNECTION_STRING ?? '';
    const mongo_db = process.env.MONGO_DATA_BASE ?? '';

    await mongoose.connect(`${mongo_connection_url}/${mongo_db}`);
    console.log('Conectado a MongoDB.');
  } catch (error) {
    console.log('Error en la conexión a MongoDB.');
    console.log(error);
  }
};
