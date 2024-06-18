import { Attempt, SubscriptionEntity } from '../core/modules/subscription/domain/subscription.entity';
import { CreateSubscriptionPayload } from '../core/modules/subscription/domain/subscription.vo';

export type SQSEventInput =
  | CreateSubscriptionEventInput
  | GenerateChargeEventInput
  | GenerateSubscriptionPreOrdersEventInput
  | ApprovePreorderPaymentEventInput;

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

export interface GenerateSubscriptionPreOrdersEventInput {
  action: 'crear-preordenes-suscripcion';
  origin: string;
  payload: SubscriptionEntity;
}

export interface ApprovePreorderPaymentEventInput {
  action: 'aprobar-pago-preorden';
  origin: string;
  payload: { id: string; successAttempt: Attempt };
}
