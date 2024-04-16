import { OrdenEntity } from '../../../core/modules/order/domain/order.entity';
import { IOrdenRepository } from '../../../core/modules/order/domain/order.repository';
import OrderModel from '../../models/orden.model';

export class OrdenMongoRepository implements IOrdenRepository {
  createOrder = async (order: OrdenEntity) => {
    return await OrderModel.create(order);
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
