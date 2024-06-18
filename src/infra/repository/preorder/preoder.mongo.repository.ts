import { PreOrderModel } from '../../models/preorder.model';
import { PreOrderRepository } from '../../../core/modules/preorder/domain/preOrder.repository';
import { PreOrderEntity } from '../../../core/modules/preorder/domain/preOrder.entity';

export class PreOrderMongoRepository implements PreOrderRepository {
  async createMany(preOrders: PreOrderEntity[]) {
    try {
      const response = await PreOrderModel.insertMany(preOrders);

      if (!response) {
        console.log('Error when creating many preOrders in MongoDB: ', response);
        throw new Error('Error when creating many preOrders in MongoDB');
      }

      return true;
    } catch (error) {
      const err = error as Error;
      console.log('General error when creating many preOrders in MongoDB: ', err.message);
      throw new Error('General error when creating many preOrders in MongoDB');
    }
  }

  async get(id: string) {
    try {
      const response = await PreOrderModel.findOne({ id });

      if (!response?.toObject()) {
        console.log(`PreOrder not found: ${id}`);
        throw new Error('PreOrder not found.');
      }

      return response?.toObject();
    } catch (error) {
      const err = error as Error;
      console.log('Error getting MongoDB PreOrder: ', err.message);
      throw new Error('Error getting MongoDB PreOrder');
    }
  }

  async update(id: string, toUpdate: Partial<PreOrderEntity>) {
    try {
      const response = await PreOrderModel.updateOne({ id }, { $set: toUpdate }, { new: true });

      if (response.modifiedCount === 0) {
        console.log(`PreOrder to update not found: ${id}`);
        throw new Error('PreOrder to update not found.');
      }

      return !!response;
    } catch (error) {
      const err = error as Error;
      console.log('Error updating MongoDB PreOrder: ', JSON.stringify(err.message, null, 2));
      throw new Error('Error updating MongoDB PreOrder.');
    }
  }
}
