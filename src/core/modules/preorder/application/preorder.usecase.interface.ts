import { Attempt, SubscriptionEntity } from '../../subscription/domain/subscription.entity';
import { Respuesta } from './api.response';

export interface IPreOrderUseCase {
  createManyPreOrders: (subscription: SubscriptionEntity) => Promise<Respuesta<boolean>>;
  approvePreorderPayment: (id: string, successAttempt: Attempt) => Promise<Respuesta<boolean>>;
  reviewPendingPreOrders: (skus: string[]) => Promise<Respuesta<boolean>>;
}
