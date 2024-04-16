import { IOrigin } from '.././../../../interface/event';
import { OrdenEntity } from '../domain/order.entity';

export interface IOrdenUseCase {
  createOrder: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  updateOrder: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  updatePayment: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  createCourier: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  updateToEnvio: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  updateToRetiro: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
}

export interface IRespuesta {
  statusCode: number;
  body: string;
}
