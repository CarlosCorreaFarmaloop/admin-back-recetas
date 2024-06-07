import { SubscriptionEntity } from './subscription.entity';

export interface SubscriptionRepository {
  create: (subscription: SubscriptionEntity) => Promise<SubscriptionEntity>;
  get: (id: string) => Promise<SubscriptionEntity>;
  update: (id: string, toUpdate: Partial<SubscriptionEntity>) => Promise<SubscriptionEntity>;
}
