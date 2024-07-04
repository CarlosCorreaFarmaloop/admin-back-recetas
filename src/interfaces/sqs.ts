import { Attempt, SubscriptionEntity, AttemptResponsible } from '../core/modules/subscription/domain/subscription.entity';
import { CreateSubscriptionParams } from '../core/modules/subscription/domain/subscription.vo';

export type SQSEventInput =
  | CreateSubscriptionEventInput
  | GenerateChargeEventInput
  | GenerateSubscriptionPreOrdersEventInput
  | ApprovePreorderPaymentEventInput
  | GeneratePendingPreOrdersEventInput
  | SendNotificationPaymentReceivedEventInput
  | SendNotificationSuccessPaymentEventInput
  | SendNotificationFailedPaymentEventInput
  | SendNotificationLastFailedPaymentEventInput
  | UpdatePaymentMethodEventInput;

interface CreateSubscriptionEventInput {
  action: 'crear-suscripcion';
  origin: string;
  body: CreateSubscriptionParams;
}

interface GenerateChargeEventInput {
  action: 'cobrar-suscripcion';
  origin: string;
  body: { id: string; responsible: AttemptResponsible };
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

interface GeneratePendingPreOrdersEventInput {
  action: 'comprobar-preordenes-pendientes';
  origin: string;
  body: { skus: string[] };
}

interface SendNotificationPaymentReceivedEventInput {
  action: 'notificar-suscripcion-creada';
  origin: string;
  body: { id: string };
}

interface SendNotificationSuccessPaymentEventInput {
  action: 'notificar-cobro-suscripcion';
  origin: string;
  body: { id: string };
}

interface SendNotificationFailedPaymentEventInput {
  action: 'notificar-fallo-cobro-suscripcion';
  origin: string;
  body: { id: string };
}

interface SendNotificationLastFailedPaymentEventInput {
  action: 'notificar-suscripcion-cancelada';
  origin: string;
  body: { id: string };
}

interface UpdatePaymentMethodEventInput {
  action: 'actualizar-metodo-pago-suscripcion';
  origin: string;
  body: SubscriptionEntity;
}
