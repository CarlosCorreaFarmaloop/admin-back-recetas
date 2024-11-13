import { writeFile } from 'fs/promises';

import { connectToDatabase } from './database';
import { Order } from './types';
// import { handler as handlerOne } from './handler';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';

export const handler = async () => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API Key not configured');
    }

    const db = await connectToDatabase();
    const collection = db.collection<Order>('orders');

    const orders = await collection
      .find({
        id: { $regex: '^(CL-E|CL-CC)' },
        statusOrder: 'ENTREGADO',
        'productsOrder.requirePrescription': true,
        createdAt: { $gte: new Date('2024-10-29T20:55:00Z'), $lt: new Date('2024-11-01T04:00:00Z') },
        'resumeOrder.prediccion_clinica': { $exists: false },
        'resumeOrder.prediccion_doctor': { $exists: false },
        'resumeOrder.prediccion_especialidad': { $exists: false },
      })
      .toArray();

    if (!orders) {
      throw new Error('Orders not found');
    }

    console.log('Orders to be updated: ', orders.length);

    const ordersProcessed = [];

    for (const order of orders) {
      try {
        ordersProcessed.push(order.id);
        // await handlerOne(order.id);
        await sleep(3000);
      } catch (error) {
        const err = error as Error;
        console.log(`${order.id} - ${err.message}`);
      }
    }

    console.log(ordersProcessed);

    const jsonContent = JSON.stringify(ordersProcessed, null, 2);

    await writeFile('ordenes_creadas.json', jsonContent, 'utf-8');
  } catch (error) {
    const err = error as Error;
    console.log(err.message);
    throw new Error('General error');
  }
};

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
