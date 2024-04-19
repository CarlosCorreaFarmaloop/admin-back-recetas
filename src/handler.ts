import { SQSEvent, EventBridgeEvent } from 'aws-lambda';
import { OrdenUseCase } from './core/modules/order/application/orden.usecase';
import { OrdenMongoRepository } from './infra/repository/orden/orden.mongo.repository';
import { connectoToMongoDB } from './infra/db/mongo';
import { CotizacionRepository } from './infra/repository/cotizacion/cotizacion.mongo.respository';
import { MovementMongoRepository } from './infra/repository/movements/movements.mongo.repository';
import { v4 as uuid } from 'uuid';
import { actualizarStock } from './core/modules/order/domain/eventos';
import { ApiResponse, HttpCodes } from './core/modules/order/application/api.response';
import { IAsignarDocumentosTributarios, IEventDetail, IUpdateStatusOrder } from './interface/event';
import {
  IUpdatePrescriptionState,
  IUpdateProvisionalStatusOrder,
  IUploadPrescription,
} from './core/modules/order/application/interface';

// event can be event: EventBridgeEvent<string, IEventDetail> or event: EventBridgeEvent<string, IEventDetail>  {body: IEventDetail}
export const handler = async (event: SQSEvent) => {
  // Connect to Mongo
  try {
    await connectoToMongoDB();

    console.log('--- Event: ', event);

    const bodyEvent: EventBridgeEvent<string, IEventDetail> = JSON.parse(event.Records[0].body);
    const { origin, body, action } = bodyEvent.detail;

    // Only Development Environment
    // // const bodyDetail = JSON.parse(event.body);
    // // const { origin, body, action } = bodyDetail;

    const orderRespository = new OrdenMongoRepository();
    const cotizacionRespository = new CotizacionRepository();
    const movementsRepository = new MovementMongoRepository();

    const orderUseCase = new OrdenUseCase(orderRespository, cotizacionRespository, movementsRepository);

    if (origin === 'ecommerce' && action === 'crear-order') await orderUseCase.createOrderFromEcommerce(body, origin);

    if (origin === 'ecommerce' && action === 'actualizar-pago') await orderUseCase.updatePayment(body, origin);

    if (origin === 'admin' && action === 'actualizar-estado') {
      const payload = body as IUpdateStatusOrder;

      if (payload.newStatus === 'VALIDANDO_RECETA') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'RECETA_VALIDADA') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'OBSERVACIONES_RECETAS') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'PREPARANDO') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'LISTO_PARA_RETIRO') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'ASIGNAR_A_DELIVERY') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'EN_DELIVERY') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'ENTREGADO') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'EN_OBSERVACION') {
        await orderUseCase.updateStatusOrder(
          payload.order,
          payload.previousStatus,
          payload.newStatus,
          payload.responsible
        );
      }

      if (payload.newStatus === 'CANCELADO') {
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

    if (origin === 'documento-tributario' && action === 'asignar-documento-tributario')
      await orderUseCase.asignarDocumentosTributarios(body as IAsignarDocumentosTributarios);

    if (
      body?.payment?.payment.status === 'Aprobado' &&
      origin === 'ecommerce' &&
      (action === 'actualizar-pago' || action === 'crear-order')
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

    return { statusCode: 200, body: JSON.stringify(event) };
  } catch (error) {
    console.log('--- Error: ', error);
    return { statusCode: 400, body: JSON.stringify(error) };
  }
};
