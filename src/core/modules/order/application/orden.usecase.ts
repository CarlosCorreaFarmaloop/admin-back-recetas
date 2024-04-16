import { ICotizacionRespository } from '../../cotizacion/domain/cotizacion.repository';
import { calcularDocumentos } from '../../cotizacion/domain/utils/cotizacion';
import { OrdenEntity } from '../domain/order.entity';
import { IOrdenRepository } from '../domain/order.repository';
import { IOrdenUseCase, IRespuesta } from './orden.usecase.interface';
import { OrdenOValue } from './orden.vo';
import { IAsignacionCourier, IOrigin, ITrackingCourier } from '.././../../../interface/event';
import { actualizarStock, crearCourier, notificarEstadoDeOrden, ordenSocketEvent } from '../domain/eventos';
import { MovementRepository } from '../../../modules/movements/domain/movements.repositoy';
import { v4 as uuid } from 'uuid';
import { CourierValueObject } from './courier.vo';

export class OrdenUseCase implements IOrdenUseCase {
  constructor(
    private readonly ordenRepository: IOrdenRepository,
    private readonly cotizacionRespository: ICotizacionRespository,
    private readonly movements: MovementRepository
  ) {}

  async createOrder(order: OrdenEntity, origin: IOrigin) {
    const nuevaOrden = await this.ordenRepository.createOrder(order);

    if (!nuevaOrden) {
      // Return Lambda Error
      return { statusCode: 400, body: JSON.stringify({ message: 'Error al crear la orden.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(nuevaOrden),
    };
  }

  async updateOrder(order: OrdenEntity, origin: IOrigin): Promise<IRespuesta> {
    console.log('--- Actualizar Orden: ', order);
    const ordenActualizada = await this.ordenRepository.updateOrder(order);

    if (!ordenActualizada) {
      console.log('--- Error al actualizar la orden: ', order);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al actualizar la orden.' }),
      };
    }

    console.log('--- Orden Actualizada: ', ordenActualizada);

    await ordenSocketEvent(ordenActualizada);

    return {
      statusCode: 200,
      body: JSON.stringify(ordenActualizada),
    };
  }

  async updatePayment(order: OrdenEntity, origin: IOrigin): Promise<IRespuesta> {
    if (order.cotizacion) {
      const cotizacion = await this.cotizacionRespository.findCotizacion(order.cotizacion);

      const documentos = await calcularDocumentos(order, cotizacion);

      const orderToUpdate: OrdenEntity = {
        ...order,
        documentos,
      };

      const orderVO = new OrdenOValue().actualizarTrackingpayment(
        {
          responsible: origin,
          toStatus: order.statusOrder,
        },
        orderToUpdate
      );

      const ordenActualizada = await this.ordenRepository.updateOrder(orderVO);

      if (!ordenActualizada) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Error al actualizar la orden.' }),
        };
      }

      if (['VALIDANDO_RECETA', 'RECETA_VALIDADA', 'OBSERVACIONES_RECETAS'].includes(ordenActualizada.statusOrder)) {
        await notificarEstadoDeOrden(ordenActualizada);
      }
      await actualizarStock(ordenActualizada);

      await ordenSocketEvent(ordenActualizada);

      return {
        statusCode: 200,
        body: JSON.stringify(ordenActualizada),
      };
    }

    const orderVO = new OrdenOValue().actualizarTrackingpayment(
      {
        responsible: origin,
        toStatus: order.statusOrder,
      },
      order
    );

    const ordenActualizada = await this.ordenRepository.updateOrder(orderVO);

    if (!ordenActualizada) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al actualizar la orden.' }),
      };
    }

    if (ordenActualizada?.payment?.payment.status === 'Aprobado') {
      await this.movements.createMovements(
        ordenActualizada.productsOrder.map((producto) => {
          return {
            batch: producto.batchId,
            createAt: new Date(),
            documentNumber: ordenActualizada.id,
            documentType: 'Order',
            id: uuid(),
            movementType: 'Salida',
            quantity: producto.qty * -1,
            sku: producto.sku,
            documento_referencia: ordenActualizada.id,
          };
        })
      );

      await actualizarStock(ordenActualizada);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(ordenActualizada),
    };
  }

  updateToEnvio = async (order: OrdenEntity, origin: IOrigin): Promise<IRespuesta> => {
    const orderVO = new OrdenOValue().actualizarTrackingpayment(
      {
        responsible: origin,
        toStatus: order.statusOrder,
      },
      order
    );

    const ordenActualizada = await this.ordenRepository.updateOrder(orderVO);

    if (!ordenActualizada) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al actualizar la orden.' }),
      };
    }

    const courierVO = new CourierValueObject().crearCourier(order);

    await crearCourier(courierVO);

    // TODO: Generar Documento Tributario

    await ordenSocketEvent(ordenActualizada);

    return {
      statusCode: 200,
      body: JSON.stringify(ordenActualizada),
    };
  };

  updateToRetiro = async (order: OrdenEntity, origin: IOrigin) => {
    const ordenActualizada = await this.ordenRepository.updateOrder(order);

    if (!ordenActualizada) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al actualizar la orden.' }),
      };
    }

    await ordenSocketEvent(ordenActualizada);

    // TODO:  Generar Documento Tributario

    return {
      statusCode: 200,
      body: JSON.stringify(ordenActualizada),
    };
  };

  confirmarCourier = async (payload: IAsignacionCourier, origin: IOrigin) => {
    const order = await this.ordenRepository.findOrderById(payload.id);

    if (!order) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al encontrar la orden.' }),
      };
    }

    const orderVO = new OrdenOValue().confirmacionCourier(payload, order);

    const ordenActualizada = await this.ordenRepository.updateOrder(orderVO);

    if (!ordenActualizada) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al actualizar la orden.' }),
      };
    }

    await ordenSocketEvent(ordenActualizada);

    return {
      statusCode: 200,
      body: JSON.stringify(ordenActualizada),
    };
  };

  updateTrackingCourier = async (payload: ITrackingCourier, origin: IOrigin) => {
    const order = await this.ordenRepository.findOrderById(payload.id);

    if (!order) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al encontrar la orden.' }),
      };
    }

    const orderVO = new OrdenOValue().actualizarTrackingCourier(payload, order);

    const ordenActualizada = await this.ordenRepository.updateOrder(orderVO);

    if (!ordenActualizada) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al actualizar la orden.' }),
      };
    }

    await ordenSocketEvent(ordenActualizada);

    return {
      statusCode: 200,
      body: JSON.stringify(ordenActualizada),
    };
  };
}
