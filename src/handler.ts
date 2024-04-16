import { SQSEvent, EventBridgeEvent } from 'aws-lambda';
import { IAsignacionCourier, IEventDetail, ITrackingCourier } from './interface/event';
import { OrdenUseCase } from './core/modules/order/application/orden.usecase';
import { OrdenMongoRepository } from './infra/repository/orden/orden.mongo.repository';
import { connectoToMongoDB } from './infra/db/mongo';
import { CotizacionRepository } from './infra/repository/cotizacion/cotizacion.mongo.respository';
import { MovementMongoRepository } from './infra/repository/movements/movements.mongo.repository';
import { OrdenEntity } from './core/modules/order/domain/order.entity';

// event can be event: EventBridgeEvent<string, IEventDetail> or event: EventBridgeEvent<string, IEventDetail>  {body: IEventDetail}
export const handler = async (event: SQSEvent) => {
  // Connect to Mongo
  await connectoToMongoDB();

  console.log('--- Event: ', event);

  const bodyEvent: EventBridgeEvent<string, IEventDetail> = JSON.parse(event.Records[0].body);
  // const body = JSON.parse(event.body);

  // const { origin, order, action } = body;

  const { origin, body, action } = bodyEvent.detail;
  // Orden de Ecommerce
  const orderRespository = new OrdenMongoRepository();
  const cotizacionRespository = new CotizacionRepository();
  const movementsRepository = new MovementMongoRepository();

  const orderUseCase = new OrdenUseCase(orderRespository, cotizacionRespository, movementsRepository);

  if (origin === 'ecommerce') {
    switch (action) {
      case 'crear-orden':
        console.log('--- Orden de Ecommerce Crear Orden: ', body);
        return await orderUseCase.createOrder(body, origin);
      case 'actualizar-order':
        console.log('--- Orden de Ecommerce Actualizar Orden: ', body);
        return await orderUseCase.updateOrder(body, origin);
      case 'actualizar-pago':
        console.log('--- Orden de Ecommerce Actualizar Pago: ', body);
        return await orderUseCase.updatePayment(body, origin);
      default:
        return { statusCode: 400, body: JSON.stringify(event) };
    }
  }
  if (origin === 'admin') {
    switch (action) {
      case 'crear-orden':
        console.log('--- Orden de Admin Crear Orden: ', body as OrdenEntity);
        return await orderUseCase.createOrder(body as OrdenEntity, origin);
      case 'actualizar-order':
        console.log('--- Orden de Admin Actualizar Orden: ', body);
        return await orderUseCase.updateOrder(body as OrdenEntity, origin);

      case 'actualizar-a-envio':
        console.log('--- Orden de Admin Actualizar a Envio: ', body);
        return await orderUseCase.updateToEnvio(body as OrdenEntity, origin);

      case 'actualizar-a-listo-retiro':
        console.log('--- Orden de Admin Actualizar a Listo Retiro: ', body);
        return await orderUseCase.updateToRetiro(body as OrdenEntity, origin);

      case 'generar-courier': {
        console.log('--- Orden de Admin Generar Courier: ', body);
        return await orderUseCase.updateOrder(body as OrdenEntity, origin);
      }

      case 'confirmar-asignacion-courier': {
        console.log('--- Orden de Admin Confirmar Asignacion Courier: ', body);
        return await orderUseCase.confirmarCourier(body as IAsignacionCourier, origin);
      }

      case 'actualizar-tracking-courier': {
        console.log('--- Orden de Admin Actualizar Tracking Courier: ', body);
        return await orderUseCase.updateTrackingCourier(body as ITrackingCourier, origin);
      }

      default:
        return { statusCode: 400, body: JSON.stringify(event) };
    }
  }
  return { statusCode: 400, body: JSON.stringify(event) };

  // try {
  //   const details = event.detail;
  //   const order = details.order;
  //   console.log('--- Orden de Ecommerce: ', JSON.stringify(order, null, 2));
  //   const db_connection = mongoClient.db(process.env.MONGO_DATA_BASE);
  //   try {
  //     await db_connection.admin().ping();
  //     console.log('--- Conexión a MongoDB es válida.');
  //   } catch (error) {
  //     console.log('--- Intentando nueva conexión a MongoDB.');
  //     await mongoClient.connect();
  //   }
  //   const orders_collection = db_connection.collection('orders');
  //   const fecha_hoy = new Date();
  //   const new_order: AdminOrderEntity = {
  //     id: order.id,
  //     billing: { type: '', number: '', emitter: '', urlBilling: '' },
  //     createdAt: fecha_hoy,
  //     customer: order.customer,
  //     delivery: { ...order.delivery, provider: { provider: '', orderTransport: '', urlLabel: '' } },
  //     extras: order.extras,
  //     payment: order.payment,
  //     productsOrder: order.productsOrder.map((product) => {
  //       return {
  //         ...product,
  //         expiration: new Date(product.expiration).getTime(),
  //         prescription: product.prescription,
  //       };
  //     }),
  //     resumeOrder: order.resumeOrder,
  //     statusOrder: order.statusOrder,
  //     tracking: [{ date: fecha_hoy, responsible: 'eCommerce', toStatus: order.statusOrder }],
  //   };
  //   if (order.cotizacion) {
  //     const cotizacion_id = order.cotizacion;
  //     const cotizaciones_collection = db_connection.collection('cotizaciones');
  //     const cotizacion_db = await cotizaciones_collection.findOne<CotizacionEntity>({ id: cotizacion_id });
  //     if (cotizacion_db) {
  //       const productos_con_cotizacion: ProductOrder[] = new_order.productsOrder.map((productOrder) => {
  //         const producto_encontrado = cotizacion_db.productos.find(
  //           (cotizacionProduct) =>
  //             cotizacionProduct.sku === productOrder.sku && cotizacionProduct.lote === productOrder.batchId
  //         );
  //         if (!producto_encontrado) return productOrder;
  //         return {
  //           ...productOrder,
  //           seguro_complementario: {
  //             beneficio_unitario: producto_encontrado.beneficio_unitario,
  //             cantidad: producto_encontrado.cantidad,
  //             copago_unitario: producto_encontrado.copago_unitario,
  //             deducible_unitario: producto_encontrado.deducible_unitario,
  //             observacion: producto_encontrado.observacion,
  //             precio_unitario: producto_encontrado.precio_unitario,
  //           },
  //         };
  //       });
  //       const { tracking, ...restoCotizacion } = cotizacion_db;
  //       new_order.cotizacion = order.cotizacion;
  //       new_order.seguro_complementario = restoCotizacion;
  //       new_order.productsOrder = productos_con_cotizacion;
  //     }
  //   }
  //   console.log('Se va a crear orden: ', JSON.stringify(new_order, null, 2));
  //   await orders_collection.insertOne(new_order);
  //   return { statusCode: 200, body: JSON.stringify(event) };
  // } catch (error) {
  //   return { statusCode: 400, body: JSON.stringify(event) };
  // }
};
