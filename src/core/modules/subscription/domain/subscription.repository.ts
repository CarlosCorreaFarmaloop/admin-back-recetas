import { Delivery, GeneralStatus, Prescription, SubscriptionEntity } from './subscription.entity';

export interface SubscriptionRepository {
  create: (subscription: SubscriptionEntity) => Promise<SubscriptionEntity>;
  get: (id: string) => Promise<SubscriptionEntity>;
  getAll: () => Promise<SubscriptionEntity[]>;
  getByGeneralStatus: (generalStatus: GeneralStatus) => Promise<SubscriptionEntity[]>;
  update: (id: string, toUpdate: Partial<SubscriptionEntity>) => Promise<SubscriptionEntity>;
  updateDelivery: (id: string, toUpdate: Partial<Delivery>) => Promise<SubscriptionEntity>;
  updateProductPrescription: (id: string, sku: string, toUpdate: Partial<Prescription>) => Promise<SubscriptionEntity>;
}
