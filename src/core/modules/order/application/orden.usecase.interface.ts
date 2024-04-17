import { EcommerceOrderEntity } from '../../../../interface/ecommerceOrder.entity';
import { IAsignacionCourier, IOrigin, ITrackingCourier, IRechazarOrden } from '.././../../../interface/event';
import { OrdenEntity } from '../domain/order.entity';
import { OrderFromEcommerce } from './updatePayment.interface';

export interface IOrdenUseCase {
  createOrderFromEcommerce: (order: EcommerceOrderEntity, origin: IOrigin) => Promise<IRespuesta>;
  createOrder: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  updateOrder: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  updatePayment: (order: OrderFromEcommerce, origin: IOrigin) => Promise<IRespuesta>;
  updateToEnvio: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  updateToRetiro: (order: OrdenEntity, origin: IOrigin) => Promise<IRespuesta>;
  confirmarCourier: (payload: IAsignacionCourier, origin: IOrigin) => Promise<IRespuesta>;
  updateTrackingCourier: (payload: ITrackingCourier, origin: IOrigin) => Promise<IRespuesta>;
  rechazarOrder: (payload: IRechazarOrden, origin: IOrigin) => Promise<IRespuesta>;
}

export interface IRespuesta {
  statusCode: number;
  body: string;
}
