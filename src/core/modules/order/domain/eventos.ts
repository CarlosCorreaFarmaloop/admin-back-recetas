import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { OrdenEntity } from './order.entity';

const eventBridgeClient = new EventBridgeClient();
const env = process.env.ENV?.toLowerCase() ?? '';

export const notificarEstadoDeOrden = async (orden: OrdenEntity) => {
  const { id } = orden;

  const evento = await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: [
        {
          Detail: JSON.stringify({ id }),
          DetailType: 'Notificacion de orden.',
          EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
          Source: `notify_status_order_${env}`,
          Time: new Date(),
        },
      ],
    })
  );
  console.log('--- EVENTO NOTIFICACION --- ', evento);
};

export const actualizarStock = async (orden: OrdenEntity) => {
  const { productsOrder } = orden;

  await Promise.all(
    productsOrder.map(async (producto) => {
      const evento = await eventBridgeClient.send(
        new PutEventsCommand({
          Entries: [
            {
              Detail: JSON.stringify({ id: producto.sku }),
              DetailType: 'Descontar stock.',
              EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
              Source: `update_all_product_${env}`,
              Time: new Date(),
            },
          ],
        })
      );
      console.log('--- EVENTO DESCONTAR STOCK --- ', evento);
    })
  );
};
