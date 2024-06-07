import { SubscriptionModel } from '../../models/subscription.model';
import { SubscriptionRepository } from '../../../core/modules/subscription/domain/subscription.repository';
import { SubscriptionEntity } from 'src/core/modules/subscription/domain/subscription.entity';

export class SubscriptionMongoRepository implements SubscriptionRepository {
  async create(subscription: SubscriptionEntity) {
    try {
      return await SubscriptionModel.create(subscription);
    } catch (error) {
      const err = error as Error;
      console.log('Error when creating subscription in MongoDB: ', err.message);
      throw new Error('Error when creating subscription in MongoDB');
    }
  }

  async get(id: string) {
    try {
      const response = await SubscriptionModel.findOne({ id });

      if (!response?.toObject()) {
        console.log(`Subscription not found: ${id}`);
        throw new Error('Subscription not found.');
      }

      return response?.toObject();
    } catch (error) {
      const err = error as Error;
      console.log('Error getting MongoDB subscription: ', err.message);
      throw new Error('Error getting MongoDB subscription');
    }
  }

  async update(id: string, toUpdate: Partial<SubscriptionEntity>) {
    try {
      const response = await SubscriptionModel.findOneAndUpdate({ id }, { $set: toUpdate });

      if (!response?.toObject()) {
        console.log(`Subscription to update not found: ${id}`);
        throw new Error('Subscription to update not found.');
      }

      return response?.toObject();
    } catch (error) {
      const err = error as Error;
      console.log('Error updating database subscription: ', JSON.stringify(err.message, null, 2));
      throw new Error('Error updating database subscription.');
    }
  }
}
