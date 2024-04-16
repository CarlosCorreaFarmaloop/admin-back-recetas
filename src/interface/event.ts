import { OrdenEntity } from '../core/modules/order/domain/order.entity';

export interface IEventDetail {
  origin: IOrigin;
  order: OrdenEntity;
  action: IAction;
}

export type IOrigin = 'ecommerce' | 'admin';

export type IAction =
  | 'crear-orden'
  | 'actualizar-order'
  | 'actualizar-pago'
  | 'actualizar-a-retiro-envio'
  | 'generar-courier'
  | 'actualizar-a-envio'
  | 'actualizar-a-listo-retiro'
  | 'generar-documento-tributario';
