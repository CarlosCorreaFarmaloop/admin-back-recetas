import { OrdenEntity } from './order.entity';

export interface IOrdenRepository {
  createOrder: (order: OrdenEntity) => Promise<OrdenEntity>;
  updateOrder: (order: OrdenEntity) => Promise<OrdenEntity>;
}
