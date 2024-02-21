import { OrderFromEcommerce } from './interface';
import { getMongoClient } from './mongo_connection';
import { EventBridge } from './services/eventBridge/eventBridge.service';

const mongoClient = getMongoClient();

export const handler = async (event: any, _context: any, _callback: any) => {
  try {
    const eventBridge = new EventBridge();
    const order: OrderFromEcommerce = event.detail;

    console.log('--- Orden de Ecommerce: ', JSON.stringify(order, null, 2));

    const db_connection = mongoClient.db(process.env.MONGO_DATA_BASE);

    try {
      await db_connection.admin().ping();
      console.log('--- Conexión a MongoDB es válida.');
    } catch (error) {
      console.log('--- Intentando nueva conexión a MongoDB.');
      await mongoClient.connect();
    }

    const orders_collection = db_connection.collection('orders');

    const new_order: any = {
      id: order.id,
      customer: order.customer,
      productsOrder: order.productsOrder.map((product) => {
        return {
          ...product,
          prescription: { state: '', file: product.prescription ?? '', validation: { rut: '', comments: '' } },
        };
      }),
      delivery: { ...order.delivery, provider: { provider: '', orderTransport: '', urlLabel: '' } },
      payment: order.payment,
      resumeOrder: order.resumeOrder,
      statusOrder: order.statusOrder,
      createdAt: new Date(),
      billing: { type: '', number: '', emitter: '', urlBilling: '' },
      tracking: [{ date: new Date(), responsible: 'eCommerce', toStatus: order.statusOrder }],
    };

    if (order.cotizacion) {
      new_order.cotizacion = order.cotizacion;
    }

    console.log('Se va a crear orden: ', JSON.stringify(new_order, null, 2));

    await orders_collection.insertOne(new_order);

    await eventBridge.emit({
      detail: {
        action: 'ordenes',
        type: 'ORDEN_ACTUALIZADA',
        body: {
          orderId: order.id,
        },
      },
      detailType: 'Orden creada notifica a Admin',
      eventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
      source: process.env.ENVIAR_ORDEN_SQS_SOCKET ?? '',
    });

    return {
      statusCode: '200',
      body: JSON.stringify(event),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(event),
    };
  }
};
