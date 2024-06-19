import { Attempt, SubscriptionEntity } from '../core/modules/subscription/domain/subscription.entity';
import { CreateSubscriptionParams } from '../core/modules/subscription/domain/subscription.vo';

export type SQSEventInput =
  | CreateSubscriptionEventInput
  | GenerateChargeEventInput
  | GenerateSubscriptionPreOrdersEventInput
  | ApprovePreorderPaymentEventInput
  | SendNotificationPaymentReceivedEventInput
  | SendNotificationFailedPaymentEventInput;

interface CreateSubscriptionEventInput {
  action: 'crear-suscripcion';
  origin: string;
  body: CreateSubscriptionParams;
}

interface GenerateChargeEventInput {
  action: 'cobrar-suscripcion';
  origin: string;
  body: { id: string };
}

interface GenerateSubscriptionPreOrdersEventInput {
  action: 'crear-preordenes-suscripcion';
  origin: string;
  body: SubscriptionEntity;
}

interface ApprovePreorderPaymentEventInput {
  action: 'aprobar-pago-preorden';
  origin: string;
  body: { orderId: string; successAttempt: Attempt };
}

interface SendNotificationPaymentReceivedEventInput {
  action: 'notificar-suscripcion-creada';
  origin: string;
  body: { id: string };
}

interface SendNotificationFailedPaymentEventInput {
  action: 'notificar-fallo-pago-suscripcion';
  origin: string;
  body: { id: string };
}
