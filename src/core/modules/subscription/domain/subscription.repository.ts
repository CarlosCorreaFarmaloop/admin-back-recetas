import { GeneralStatus, Prescription, SubscriptionEntity } from './subscription.entity';

export interface SubscriptionRepository {
  create: (subscription: SubscriptionEntity) => Promise<SubscriptionEntity>;
  get: (id: string) => Promise<SubscriptionEntity>;
  getByGeneralStatus: (generalStatus: GeneralStatus) => Promise<SubscriptionEntity[]>;
  update: (id: string, toUpdate: Partial<SubscriptionEntity>) => Promise<SubscriptionEntity>;
  updateProductPrescription: (id: string, sku: string, prescription: Prescription) => Promise<SubscriptionEntity>;
}
