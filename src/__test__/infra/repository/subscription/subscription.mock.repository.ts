// import { SubscriptionModel } from '../../models/subscription.model';
// import { SubscriptionRepository } from '../../../core/modules/subscription/domain/subscription.repository';
// import { Delivery, GeneralStatus, Prescription, SubscriptionEntity } from '../../../core/modules/subscription/domain/subscription.entity';

// export class SubscriptionMongoRepository implements SubscriptionRepository {
//   async create(subscription: SubscriptionEntity) {
//     try {
//       return await SubscriptionModel.create(subscription);
//     } catch (error) {
//       const err = error as Error;
//       console.log('Error when creating subscription in MongoDB: ', err.message);
//       throw new Error('Error when creating subscription in MongoDB');
//     }
//   }

//   async get(id: string) {
//     try {
//       const response = await SubscriptionModel.findOne({ id });

//       if (!response?.toObject()) {
//         console.log(`Subscription not found: ${id}`);
//         throw new Error('Subscription not found.');
//       }

//       return response.toObject();
//     } catch (error) {
//       const err = error as Error;
//       console.log('Error getting MongoDB subscription: ', err.message);
//       throw new Error('Error getting MongoDB subscription');
//     }
//   }

//   async getAll() {
//     try {
//       return await SubscriptionModel.find({ generalStatus: { $nin: ['Created', 'Cancelled'] } });
//     } catch (error) {
//       const err = error as Error;
//       console.log('Error getting MongoDB subscriptions: ', err.message);
//       throw new Error('Error getting MongoDB subscriptions');
//     }
//   }

//   async update(id: string, toUpdate: Partial<SubscriptionEntity>) {
//     try {
//       const response = await SubscriptionModel.findOneAndUpdate({ id }, { $set: toUpdate }, { new: true });

//       if (!response?.toObject()) {
//         console.log(`Subscription to update not found: ${id}`);
//         throw new Error('Subscription to update not found.');
//       }

//       return response.toObject();
//     } catch (error) {
//       const err = error as Error;
//       console.log('Error updating MongoDB subscription: ', JSON.stringify(err.message, null, 2));
//       throw new Error('Error updating MongoDB subscription.');
//     }
//   }

//   async getByGeneralStatus(generalStatus: GeneralStatus) {
//     try {
//       return await SubscriptionModel.find({ generalStatus });
//     } catch (error) {
//       const err = error as Error;
//       console.log('Error getting MongoDB subscriptions: ', err.message);
//       throw new Error('Error getting MongoDB subscriptions');
//     }
//   }

//   async updateDelivery(id: string, toUpdate: Partial<Delivery>) {
//     try {
//       const setObject = this.buildSetObject('delivery', toUpdate);

//       const response = await SubscriptionModel.findOneAndUpdate({ id }, { $set: setObject }, { new: true });

//       if (!response?.toObject()) {
//         console.log(`Subscription to update not found: ${id}`);
//         throw new Error('Subscription to update not found.');
//       }

//       return response.toObject();
//     } catch (error) {
//       const err = error as Error;
//       console.log('Error updating MongoDB subscription delivery: ', JSON.stringify(err.message, null, 2));
//       throw new Error('Error updating MongoDB subscription delivery.');
//     }
//   }

//   async updateProductPrescription(id: string, sku: string, toUpdate: Partial<Prescription>) {
//     try {
//       const setObject = this.buildSetObject('products.$[elem].prescription', toUpdate);

//       const response = await SubscriptionModel.findOneAndUpdate(
//         { id },
//         { $set: setObject },
//         { new: true, arrayFilters: [{ 'elem.sku': sku }] }
//       );

//       if (!response?.toObject()) {
//         console.log(`Subscription to update not found: ${id}`);
//         throw new Error('Subscription to update not found.');
//       }

//       return response.toObject();
//     } catch (error) {
//       const err = error as Error;
//       console.log('Error updating MongoDB subscription prescription: ', JSON.stringify(err.message, null, 2));
//       throw new Error('Error updating MongoDB subscription prescription.');
//     }
//   }

//   private buildSetObject(path: string, updates: Partial<any>): Record<string, any> {
//     const setObject: Record<string, any> = {};

//     Object.keys(updates).forEach((key) => {
//       setObject[`${path}.${key}`] = updates[key];
//     });

//     return setObject;
//   }
// }
