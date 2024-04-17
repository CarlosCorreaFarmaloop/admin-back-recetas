import { AdminOrderEntity } from '../../../../interface/adminOrder.entity';
import { OrdenEntity } from './order.entity';

export interface IOrdenRepository {
  createOrderFromEcommerce: (order: AdminOrderEntity) => Promise<OrdenEntity>;
  createOrder: (order: OrdenEntity) => Promise<OrdenEntity>;
  updatePayment: (id: string, payload: any) => Promise<any>;
  updateOrder: (order: OrdenEntity) => Promise<OrdenEntity>;
  findOrderById: (id: string) => Promise<OrdenEntity>;
}
