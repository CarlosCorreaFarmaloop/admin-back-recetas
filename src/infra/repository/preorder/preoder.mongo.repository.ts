import { PreOrderModel } from '../../models/preorder.model';
import { PreOrderRepository } from '../../../core/modules/preorder/domain/preOrder.repository';
import { PreOrderEntity } from '../../../core/modules/preorder/domain/preOrder.entity';

export class PreOrderMongoRepository implements PreOrderRepository {
  async createMany(preOrders: PreOrderEntity[]) {
    try {
      const response = await PreOrderModel.insertMany(preOrders);

      if (!response) {
        throw new Error('Error al crear preordenes en MongoDB');
      }

      return true;
    } catch (error) {
      const err = error as Error;
      throw new Error(err.message);
    }
  }

  async get(id: string) {
    try {
      const response = await PreOrderModel.findOne({ id }).lean();

      if (!response) {
        throw new Error('PreOrden no existe en MongoDB.');
      }

      return response;
    } catch (error) {
      const err = error as Error;
      throw new Error(err.message);
    }
  }

  async getPendingPreOrdersBySku(skus: string[]) {
    try {
      return await PreOrderModel.find({ status: 'Pending', 'productsOrder.sku': { $in: skus } }).lean();
    } catch (error) {
      const err = error as Error;
      throw new Error(err.message);
    }
  }

  async update(id: string, toUpdate: Partial<PreOrderEntity>) {
    try {
      const response = await PreOrderModel.findOneAndUpdate({ id }, { $set: toUpdate }, { new: true }).lean();

      if (!response) {
        throw new Error('PreOrden para actualizar no encontrada en MongoDB.');
      }

      return response;
    } catch (error) {
      const err = error as Error;
      throw new Error(err.message);
    }
  }
}
