import { Delivery, GeneralStatus, SubscriptionEntity } from '../domain/subscription.entity';
import { CreateSubscriptionPayload } from '../domain/subscription.vo';
import { Respuesta } from './api.response';

export interface ISubscriptionUseCase {
  createSubscription: (payload: CreateSubscriptionPayload) => Promise<Respuesta<boolean>>;
  generateCharge: (id: string) => Promise<Respuesta<boolean>>;
  getSubscriptionByGeneralStatus: (generalStatus: GeneralStatus) => Promise<Respuesta<SubscriptionEntity[]>>;
  updateDelivery: (
    id: string,
    deliveryToUpdate: Omit<Delivery, 'discount' | 'price' | 'pricePaid'>
  ) => Promise<Respuesta<SubscriptionEntity>>;
}
