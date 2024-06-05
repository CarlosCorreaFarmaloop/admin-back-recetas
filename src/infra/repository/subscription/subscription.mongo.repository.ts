import { SubscriptionModel } from '../../models/subscription.model';
import { SubscriptionRepository } from '../../../core/modules/subscription/domain/subscription.repository';
import { SubscriptionEntity } from 'src/core/modules/subscription/domain/subscription.entity';

export class SubscriptionMongoRepository implements SubscriptionRepository {
  async create(subscription: SubscriptionEntity) {
    try {
      return await SubscriptionModel.create(subscription);
    } catch (error) {
      const err = error as Error;
      console.log('Error al crear suscripcion en MongoDB: ', err.message);
      throw new Error(err.message);
    }
  }

  async get(id: string) {
    try {
      const response = await SubscriptionModel.findOne({ id });

      if (!response?.toObject()) {
        console.log(`No se encontro la suscripcion: ${id}`);
        throw new Error('No se encontro la suscripcion.');
      }

      return response?.toObject();
    } catch (error) {
      const err = error as Error;
      console.log('Error al obtener suscripcion de MongoDB: ', err.message);
      throw new Error(err.message);
    }
  }
}
