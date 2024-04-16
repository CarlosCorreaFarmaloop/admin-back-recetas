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
}

export interface ITrackingPayload {
  responsible: string;
  toStatus: StatusOrder;
}
