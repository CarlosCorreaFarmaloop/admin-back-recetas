import { IAsignacionCourier, IRechazarOrden, ITrackingCourier } from '../../../../interface/event';
import { OrdenEntity, StatusOrder } from '../domain/order.entity';

export class OrdenOValue {
  actualizarTrackingpayment = (payload: ITrackingPayload, order: OrdenEntity): OrdenEntity => {
    return {
      ...order,
      tracking: order.tracking
        ? [
            ...order.tracking,
            {
              date: new Date(),
              responsible: payload.responsible,
              toStatus: order.statusOrder,
            },
          ]
        : [
            {
              date: new Date(),
              responsible: payload.responsible,
              toStatus: order.statusOrder,
            },
          ],
    };
  };

  confirmacionCourier = (payload: IAsignacionCourier, order: OrdenEntity): OrdenEntity => {
    return {
      ...order,
      delivery: {
        ...order.delivery,
        provider: {
          ...order.delivery.provider,
          provider: payload.provider,
          urlLabel: payload.urlLabel,
          trackingNumber: payload.trackingNumber,
          status: payload.status,
        },
      },
    };
  };

  actualizarTrackingCourier = (payload: ITrackingCourier, order: OrdenEntity): OrdenEntity => {
    //     export interface ITrackingCourier {
    //   id: string;
    //   fecha: Date;
    //   estado: string;
    //   comentario: string;
    //   evidencias: string[];
    // }

    return {
      ...order,
      delivery: {
        ...order.delivery,
        deliveryTracking: [
          ...(order.delivery.deliveryTracking ?? []),
          {
            fecha: payload.fecha,
            estado: payload.estado,
            comentario: payload.comentario,
            evidencias: payload.evidencias,
          },
        ],
      },
      tracking: [
        ...(order.tracking ?? []),
        {
          date: new Date(),
          responsible: 'courier',
          toStatus: payload.estado as StatusOrder,
        },
      ],
    };
  };

  rechazarOrden = (payload: IRechazarOrden, order: OrdenEntity): OrdenEntity => {
    return {
      ...order,
      statusOrder: 'CANCELADO',
      tracking: [
        ...(order.tracking ?? []),
        {
          date: new Date(),
          responsible: payload.responsible,
          toStatus: 'CANCELADO',
        },
      ],
      history: [
        ...order.history,
        {
          type: 'status',
          changeDate: new Date(),
          responsible: payload.responsible,
          changeFrom: order.statusOrder,
          changeTo: 'CANCELADO',
          aditionalInfo: {
            comments: payload.reason,
            product_sku: '',
          },
        },
      ],
    };
  };
}

export interface ITrackingPayload {
  responsible: string;
  toStatus: StatusOrder;
}
