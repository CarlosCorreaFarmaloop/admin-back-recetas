import { ICotizacionRespository } from '../../cotizacion/domain/cotizacion.repository';
import { OrdenEntity } from '../domain/order.entity';
import { IOrdenRepository } from '../domain/order.repository';
import { IOrdenUseCase, IRespuesta } from './orden.usecase.interface';
import { OrdenOValue } from './orden.vo';
import { IAsignacionCourier, IOrigin, IRechazarOrden, ITrackingCourier } from '.././../../../interface/event';
import { crearCourier, ordenSocketEvent } from '../domain/eventos';
import { MovementRepository } from '../../../modules/movements/domain/movements.repositoy';
import { CourierValueObject } from './courier.vo';
import { EcommerceOrderEntity } from '../../../../interface/ecommerceOrder.entity';
import { ProductOrder } from '../../../../interface/adminOrder.entity';
import { validateNumberType, validateStringType } from '../domain/utils/validate';
import { AdminPayment, OrderFromEcommerce, Status, Wallet } from './updatePayment.interface';

export class OrdenUseCase implements IOrdenUseCase {
  constructor(
    private readonly ordenRepository: IOrdenRepository,
    private readonly cotizacionRespository: ICotizacionRespository,
    private readonly movements: MovementRepository
  ) {}

  async createOrderFromEcommerce(order: EcommerceOrderEntity, origin: IOrigin): Promise<IRespuesta> {
    const new_order = await this.formatOrderEcommerce(order);

    const nuevaOrden = await this.ordenRepository.createOrderFromEcommerce(new_order);

    if (!nuevaOrden) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Error al crear la orden.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(nuevaOrden),
    };
  }

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

  async updatePayment(order: OrderFromEcommerce, origin: IOrigin): Promise<IRespuesta> {
    const { id, payment, statusOrder } = order;

    const nuevo_pago: AdminPayment = {
      payment: {
        amount: validateNumberType(payment.amount),
        method: validateStringType(payment.method),
        originCode: validateStringType(payment.originCode),
        status: validateStringType(payment.status) as Status,
        wallet: validateStringType(payment.wallet) as Wallet,
      },
    };

    const updateFilter: any = {
      payment: nuevo_pago,
      statusOrder,
    };

    // const ordenFinded = await this.ordenRepository.findOrderById(id);

    // if (ordenFinded.cotizacion) {
    //   const cotizacion = await this.cotizacionRespository.findCotizacion(ordenFinded.cotizacion);

    //   const documentos = await calcularDocumentos(ordenFinded, cotizacion);

    //   updateFilter.documentos = documentos;
    // }

    const ordenActualizada = await this.ordenRepository.updatePayment(id, updateFilter);

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

  rechazarOrder = async (payload: IRechazarOrden, origin: IOrigin) => {
    const order = await this.ordenRepository.findOrderById(payload.id);

    if (!order) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error al encontrar la orden.' }),
      };
    }

    const orderVO = new OrdenOValue().rechazarOrden(payload, order);

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

  private readonly formatOrderEcommerce = async (order: EcommerceOrderEntity) => {
    const fecha_hoy = new Date();
    const new_order: any = {
      id: order.id,
      billing: { type: '', number: '', emitter: '', urlBilling: '' },
      createdAt: fecha_hoy,
      customer: order.customer,
      delivery: { ...order.delivery, provider: { provider: '', orderTransport: '', urlLabel: '' } },
      extras: order.extras,
      payment: {
        payment: order.payment,
      },
      productsOrder: order.productsOrder.map((product) => {
        return {
          ...product,
          expiration: new Date(product.expireDate).getTime(),
          prescription: { state: '', file: product.prescription ?? '', validation: { rut: '', comments: '' } },
        };
      }),
      resumeOrder: order.resumeOrder,
      statusOrder: order.statusOrder,
      tracking: [{ date: fecha_hoy, responsible: 'eCommerce', toStatus: order.statusOrder }],
    };
    if (order.cotizacion) {
      const cotizacion_id = order.cotizacion;
      const cotizacion_db = await this.cotizacionRespository.findCotizacion(cotizacion_id);

      // const cotizaciones_collection = db_connection.collection('cotizaciones');
      // const cotizacion_db = await cotizaciones_collection.findOne<CotizacionEntity>({ id: cotizacion_id });
      if (cotizacion_db) {
        const productos_con_cotizacion: ProductOrder[] = new_order.productsOrder.map((productOrder: any) => {
          const producto_encontrado = cotizacion_db.productos.find(
            (cotizacionProduct) =>
              cotizacionProduct.sku === productOrder.sku && cotizacionProduct.lote === productOrder.batchId
          );
          if (!producto_encontrado) return productOrder;
          return {
            ...productOrder,
            seguro_complementario: {
              beneficio_unitario: producto_encontrado.beneficio_unitario,
              cantidad: producto_encontrado.cantidad,
              copago_unitario: producto_encontrado.copago_unitario,
              deducible_unitario: producto_encontrado.deducible_unitario,
              observacion: producto_encontrado.observacion,
              precio_unitario: producto_encontrado.precio_unitario,
            },
          };
        });
        const { tracking, ...restoCotizacion } = cotizacion_db;
        new_order.cotizacion = order.cotizacion;
        new_order.seguro_complementario = restoCotizacion;
        new_order.productsOrder = productos_con_cotizacion;
      }
    }

    return new_order;
  };
}
