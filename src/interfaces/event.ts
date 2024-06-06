import { CreateSubscriptionPayload } from '../core/modules/subscription/domain/subscription.vo';

export type EventInput = CreateSubscriptionEventInput;

export interface CreateSubscriptionEventInput {
  action: 'crear-suscripcion';
  origin: string;
  payload: CreateSubscriptionPayload;
}
