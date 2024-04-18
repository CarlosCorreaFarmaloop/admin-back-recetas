import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { OrdenEntity } from './order.entity';
import { IDocumentoTributarioEventInput } from './documentos_tributarios.interface';

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

export const ordenSocketEvent = async (orden: OrdenEntity) => {
  const evento = await eventBridgeClient.send(
    new PutEventsCommand({
      Entries: [
        {
          Detail: JSON.stringify(orden),
          DetailType: 'Orden socket.',
          EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
          Source: process.env.ENVIAR_ORDEN_SQS_SOCKET,
          Time: new Date(),
        },
      ],
    })
  );
  console.log('--- EVENTO SOCKET ORDEN --- ', evento);
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

// export const emitirDocumentoTributario = async (payload: any) => {
//   const evento = await eventBridgeClient.send(
//     new PutEventsCommand({
//       Entries: [
//         {
//           Detail: JSON.stringify(payload),
//           DetailType: 'Emitir documento tributario.',
//           EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
//           Source: `emitir_documento_tributario_${env}`,
//           Time: new Date(),
//         },
//       ],
//     })
//   );
//   console.log('--- EVENTO EMITIR DOCUMENTO TRIBUTARIO --- ', evento);
// };

// export const crearCourier = async (courier: CourierEventPayload) => {
//   const evento = await eventBridgeClient.send(
//     new PutEventsCommand({
//       Entries: [
//         {
//           Detail: JSON.stringify(courier),
//           DetailType: 'Crear courier.',
//           EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
//           Source: `genera_orden_courier_${env}`,
//           Time: new Date(),
//         },
//       ],
//     })
//   );
//   console.log('--- EVENTO CREAR COURIER --- ', evento);
// };
