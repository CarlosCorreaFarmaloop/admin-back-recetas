import { CreateSubscriptionPayload } from '../core/modules/subscription/domain/subscription.vo';

export type EventInput = CreateSubscriptionEventInput;

export interface CreateSubscriptionEventInput {
  accion: 'generar-suscripcion';
  origen: string;
  payload: CreateSubscriptionPayload;
}
