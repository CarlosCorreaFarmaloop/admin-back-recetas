import { CreateSubscriptionPayload } from '../domain/subscription.vo';
import { Respuesta } from './api.response';

export interface ISubscriptionUseCase {
  createSubscription: (payload: CreateSubscriptionPayload) => Promise<Respuesta<boolean>>;
}
