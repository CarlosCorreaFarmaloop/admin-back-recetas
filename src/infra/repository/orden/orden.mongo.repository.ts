import { AdminOrderEntity } from '../../../interface/adminOrder.entity';
import { OrdenEntity } from '../../../core/modules/order/domain/order.entity';
import { IOrdenRepository } from '../../../core/modules/order/domain/order.repository';
import OrderModel from '../../models/orden.model';

export class OrdenMongoRepository implements IOrdenRepository {
  createOrderFromEcommerce = async (order: AdminOrderEntity) => {
    console.log('------Order To Create ----', JSON.stringify(order, null, 2));
    return await OrderModel.create(order);
  };

  createOrder = async (order: OrdenEntity) => {
    return await OrderModel.create(order);
  };

  updatePayment = async (id: string, payload: any) => {
    return await OrderModel.findOneAndUpdate(
      { id },
      {
        $set: payload,
        $push: { tracking: { date: new Date(), responsible: 'eCommerce', toStatus: payload.statusOrder } as any },
      },
      { returnDocument: 'after' }
    );
  };

  updateOrder = async (order: OrdenEntity) => {
    return await OrderModel.findOneAndUpdate({ id: order.id }, { $set: order }, { new: true })
      .then((res) => res?.toObject())
      .catch((err) => err);
  };

  findOrderById = async (id: string) => {
    return await OrderModel.findOne({ id })
      .then((res) => res?.toObject())
      .catch((err) => err);
  };
}
