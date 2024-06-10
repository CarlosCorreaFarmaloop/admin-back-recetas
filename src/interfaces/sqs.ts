import { CreateSubscriptionPayload } from '../core/modules/subscription/domain/subscription.vo';

export type SQSEventInput = CreateSubscriptionEventInput | GenerateChargeEventInput;

export interface CreateSubscriptionEventInput {
  action: 'crear-suscripcion';
  origin: string;
  payload: CreateSubscriptionPayload;
}

export interface GenerateChargeEventInput {
  action: 'cobrar-suscripcion';
  origin: string;
  payload: { id: string };
}
