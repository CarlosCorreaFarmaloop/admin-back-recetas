import { ICotizacionRespository } from '../../cotizacion/domain/cotizacion.repository';
import { calcularDocumentos } from '../../cotizacion/domain/utils/cotizacion';
import { OrdenEntity } from '../domain/order.entity';
import { IOrdenRepository } from '../domain/order.repository';
import { IOrdenUseCase, IRespuesta } from './orden.usecase.interface';
import { OrdenOValue } from './orden.vo';
import { IOrigin } from '.././../../../interface/event';
import { actualizarStock, notificarEstadoDeOrden } from '../domain/eventos';
import { MovementRepository } from '../../../modules/movements/domain/movements.repositoy';
import { v4 as uuid } from 'uuid';

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
    const ordenActualizada = await this.ordenRepository.updateOrder(order);

    if (!ordenActualizada) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al actualizar la orden.' }),
      };
    }

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
}
