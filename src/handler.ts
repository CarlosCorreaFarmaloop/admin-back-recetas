import { SQSEvent, EventBridgeEvent, Context, Callback } from 'aws-lambda';
import { OrdenUseCase } from './core/modules/order/application/orden.usecase';
import { OrdenMongoRepository } from './infra/repository/orden/orden.mongo.repository';
import { connectoToMongoDB } from './infra/db/mongo';
import { CotizacionRepository } from './infra/repository/cotizacion/cotizacion.mongo.respository';
import { MovementMongoRepository } from './infra/repository/movements/movements.mongo.repository';
import { v4 as uuid } from 'uuid';
import { actualizarStock } from './core/modules/order/domain/eventos';
import { ApiResponse, HttpCodes } from './core/modules/order/application/api.response';
import {
  IActualizarOrderStatusWebhook,
  IAddOrderObservation,
  IAsignarCourier,
  IAsignarDocumentosTributarios,
  IAsignarSeguroComplementario,
  ICancelarOrder,
  IEventDetail,
  IOrderBackToFlow,
  IUpdateEstadoCedulaIdentidad,
  IUpdateTrackingNumber,
  IUpdateStatusOderObservation,
  IUpdateStatusOrder,
} from './interface/event';
import {
  IUpdatePrescriptionState,
  IUpdateProvisionalStatusOrder,
  IUploadPrescription,
} from './core/modules/order/application/interface';
import { AdminOrderEntity } from './interface/adminOrder.entity';
import { CreateCompleteOrderEntity } from './interface/crearOrdenCompleta';

// event can be event: EventBridgeEvent<string, IEventDetail> or event: EventBridgeEvent<string, IEventDetail>  {body: IEventDetail}
export const handler = async (event: SQSEvent, context: Context, callback: Callback) => {
  // Connect to Mongo
  try {
    await connectoToMongoDB();

    console.log('--- Event: ', event);

    // if ('body' in event && typeof event.body === 'string') {
    //   console.log('--- Event Body: ', JSON.parse(event.body));

    //   const parsedBody = JSON.parse(event.body);

    //   if (parsedBody.origin === 'admin' && parsedBody.action === 'orden-pos') {
    //     const text = 'Prueba Carlitos';

    //     return {
    //       statusCode: 200,
    //       body: JSON.stringify({ text }),
    //     };
    //   }

    //   return { statusCode: 200, body: JSON.stringify(event) };
    // }

    const bodyEvent: EventBridgeEvent<string, IEventDetail> = JSON.parse(event.Records[0].body);
    const { origin, body, action } = bodyEvent.detail;

    // Only Development Environment
    // const bodyDetail = JSON.parse(event.body);
    // const { origin, body, action } = bodyDetail;

    const orderRespository = new OrdenMongoRepository();
    const cotizacionRespository = new CotizacionRepository();
    const movementsRepository = new MovementMongoRepository();

    const orderUseCase = new OrdenUseCase(orderRespository, cotizacionRespository, movementsRepository);

    if (origin === 'ecommerce' && action === 'crear-order') await orderUseCase.createOrderFromEcommerce(body, origin);

    if (origin === 'ecommerce' && action === 'actualizar-pago') await orderUseCase.updatePayment(body, origin);

    if (origin === 'auto-gestion' && action === 'crear-order')
      await orderUseCase.createCompleteOrder(body as CreateCompleteOrderEntity, origin);

    if (origin === 'admin' && action === 'crear-order') {
      await orderUseCase.createOrderFromAdmin(body as AdminOrderEntity, origin);
    }

    if (origin === 'admin' && action === 'actualizar-estado') {
      const payload = body as IUpdateStatusOrder;

      if (payload.newStatus === 'VALIDANDO_RECETA') {
        await orderUseCase.updateProvisionalStatusOrder({
          id: payload.order.id,
          provisionalStatusOrder: 'Pendiente',
        });

        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'RECETA_VALIDADA') {
        await orderUseCase.updateProvisionalStatusOrder({
          id: payload.order.id,
          provisionalStatusOrder: 'Pendiente',
        });

        await orderUseCase.updateCanalConvenio({
          id: payload.order.id,
          convenio: payload.order.resumeOrder.convenio,
          canal: payload.order.resumeOrder.canal,
        });

        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'OBSERVACIONES_RECETAS') {
        await orderUseCase.updateProvisionalStatusOrder({
          id: payload.order.id,
          provisionalStatusOrder: 'Pendiente',
        });

        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'PREPARANDO') {
        await orderUseCase.updateProvisionalStatusOrder({
          id: payload.order.id,
          provisionalStatusOrder: 'Pendiente',
        });

        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'LISTO_PARA_RETIRO') {
        await orderUseCase.updatePreparandoToRetiro({
          order: payload.order,
          responsible: payload.responsible,
        });
      }

      if (payload.newStatus === 'ASIGNAR_A_DELIVERY') {
        await orderUseCase.updatePreparandoToDelivery({
          order: payload.order,
          responsible: payload.responsible,
        });
      }

      if (payload.newStatus === 'EN_DELIVERY') {
        await orderUseCase.updateProvisionalStatusOrder({
          id: payload.order.id,
          provisionalStatusOrder: 'Pendiente',
        });

        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'ENTREGADO') {
        await orderUseCase.updateProvisionalStatusOrder({
          id: payload.order.id,
          provisionalStatusOrder: 'Pendiente',
        });

        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'EN_OBSERVACION') {
        await orderUseCase.updateProvisionalStatusOrder({
          id: payload.order.id,
          provisionalStatusOrder: 'Pendiente',
        });

        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'CANCELADO') {
        await orderUseCase.updateProvisionalStatusOrder({
          id: payload.order.id,
          provisionalStatusOrder: 'Pendiente',
        });

        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }
    }

    if (origin === 'admin' && action === 'actualizar-provisional-status-order') {
      await orderUseCase.updateProvisionalStatusOrder(body as IUpdateProvisionalStatusOrder);
    }

    if (origin === 'admin' && action === 'cargar-receta')
      await orderUseCase.uploadPrescriptionFile(body as IUploadPrescription);

    if (origin === 'admin' && action === 'actualizar-estado-receta')
      await orderUseCase.updatePrescriptionState(body as IUpdatePrescriptionState);

    if (origin === 'admin' && action === 'actualizar-order-estado-obervacion') {
      await orderUseCase.updateOrderStatusObservation(body as IUpdateStatusOderObservation);
    }

    if (origin === 'admin' && action === 'regresar-order-al-flujo') {
      await orderUseCase.regresarOrderAlFlujo(body as IOrderBackToFlow);
    }

    if (origin === 'admin' && action === 'actualizar-estado-cedula-identidad') {
      await orderUseCase.updateEstadoCedulaIdentidad(body as IUpdateEstadoCedulaIdentidad);
    }

    if (origin === 'admin' && action === 'cancelar-order') {
      await orderUseCase.cancelarOrden(body as ICancelarOrder);
    }

    if (origin === 'admin' && action === 'agregar-observacion-order') {
      await orderUseCase.addObservationToOrder(body as IAddOrderObservation);
    }

    if (origin === 'admin' && action === 'actualizar-numero-seguimiento') {
      await orderUseCase.updateTrackingNumber(body as IUpdateTrackingNumber);
    }

    // ---------- Documentos Tributarios ----------------

    if (origin === 'documento-tributario' && action === 'asignar-documento-tributario') {
      const bodyAction = body as IAsignarDocumentosTributarios;

      if (bodyAction.type !== 'Despacho')
        await orderUseCase.asignarDocumentosTributarios(body as IAsignarDocumentosTributarios);
    }

    // ---------- Courier ----------------

    if (origin === 'courier' && action === 'asignar-courier') {
      await orderUseCase.asignarCourier(body as IAsignarCourier);
    }

    if (origin === 'courier' && action === 'actualizar-order-status-webhook') {
      await orderUseCase.actualizarOrderStatusWebhook(body as IActualizarOrderStatusWebhook);
    }

    // ---------- Seguro Complementario ----------------

    if (origin === 'seguro-complementario' && action === 'confirmar-seguro-complementario') {
      await orderUseCase.confirmarSeguroComplementario(body as IAsignarSeguroComplementario);
    }

    if (
      (body?.payment?.payment?.status === 'Aprobado' &&
        origin === 'ecommerce' &&
        (action === 'actualizar-pago' || action === 'crear-order')) ||
      (origin === 'admin' && action === 'crear-order')
    ) {
      const ordenEncontrada = await orderRespository.findOrderById(body.id as string);

      if (!ordenEncontrada) {
        throw new ApiResponse(HttpCodes.NOT_FOUND, 'Order not found');
      }

      console.log('--- Orden Productos: ', ordenEncontrada.productsOrder);

      await movementsRepository.createMovements(
        ordenEncontrada.productsOrder.map((producto) => {
          return {
            batch: producto.batchId,
            createAt: new Date(),
            documentNumber: body.id,
            documentType: 'Order',
            id: uuid(),
            movementType: 'Salida',
            quantity: producto.qty * -1,
            sku: producto.sku,
            documento_referencia: body.id,
          };
        })
      );

      await actualizarStock(ordenEncontrada);
    }

    if (origin === 'admin' && action === 'cancelar-order') {
      const ordenEncontrada = await orderRespository.findOrderById(body.id as string);

      if (!ordenEncontrada) {
        throw new ApiResponse(HttpCodes.NOT_FOUND, 'Order not found');
      }

      console.log('--- Orden Productos: ', ordenEncontrada.productsOrder);

      await movementsRepository.createMovements(
        ordenEncontrada.productsOrder.map((producto) => {
          return {
            batch: producto.batchId,
            createAt: new Date(),
            documentNumber: body.id,
            documentType: 'Order',
            id: uuid(),
            movementType: 'Entrada',
            quantity: producto.qty,
            sku: producto.sku,
            documento_referencia: body.id,
          };
        })
      );

      await actualizarStock(ordenEncontrada);
    }

    return { statusCode: 200, body: JSON.stringify(event) };
  } catch (error) {
    console.log('--- Error: ', error);
    throw new Error('Error en lambda');
    // return { statusCode: 400, body: JSON.stringify(error) };
  }
};
