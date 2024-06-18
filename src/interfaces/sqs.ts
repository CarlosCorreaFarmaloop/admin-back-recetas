import { Attempt, SubscriptionEntity } from '../core/modules/subscription/domain/subscription.entity';
import { CreateSubscriptionParams } from '../core/modules/subscription/domain/subscription.vo';

export type SQSEventInput =
  | CreateSubscriptionEventInput
  | GenerateChargeEventInput
  | GenerateSubscriptionPreOrdersEventInput
  | ApprovePreorderPaymentEventInput;

export interface CreateSubscriptionEventInput {
  action: 'crear-suscripcion';
  origin: string;
  body: CreateSubscriptionParams;
}

export interface GenerateChargeEventInput {
  action: 'cobrar-suscripcion';
  origin: string;
  body: { id: string };
}

export interface GenerateSubscriptionPreOrdersEventInput {
  action: 'crear-preordenes-suscripcion';
  origin: string;
  body: SubscriptionEntity;
}

export interface ApprovePreorderPaymentEventInput {
  action: 'aprobar-pago-preorden';
  origin: string;
  body: { orderId: string; successAttempt: Attempt };
}
