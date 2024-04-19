import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { OrdenEntity } from './order.entity';
import { IDocumentoTributarioEventInput } from './documentos_tributarios.interface';
import { ICourierEventInput } from './courier.interface';

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

export const emitirDocumentoTributario = async (payload: IDocumentoTributarioEventInput) => {
  const evento = await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: [
        {
          Detail: JSON.stringify(payload),
          DetailType: 'Emitir documento tributario.',
          EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
          Source: `generar-documento-tributario-${env}`,
          Time: new Date(),
        },
      ],
    })
  );

  console.log('--- EVENTO EMITIR DOCUMENTO TRIBUTARIO --- ', evento);
};

export const generarCourierEvent = async (payload: ICourierEventInput) => {
  const evento = await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: [
        {
          Detail: JSON.stringify(payload),
          DetailType: 'Generar courier.',
          EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
          Source: `generar-orden-courier-${env}`,
          Time: new Date(),
        },
      ],
    })
  );

  console.log('--- EVENTO GENERAR COURIER --- ', evento);
};

export const actualizarOrdenEccomerce = async (orden: OrdenEntity, toPos: boolean) => {
  const evento = await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: [
        {
          Detail: JSON.stringify({
            orderEvento: {
              id: orden.id,
              customer: orden.customer,
              statusOrder: orden.statusOrder,
              billing: orden.billing,
              delivery: orden.delivery,
            },
            toPos,
          }),
          DetailType: 'Actualizar orden ecommerce.',
          EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
          Source: process.env.ACTUALIZAR_PEDIDO,
          Time: new Date(),
        },
      ],
    })
  );
  console.log('--- EVENTO ACTUALIZAR ORDEN ECOMMERCE --- ', evento);
};
