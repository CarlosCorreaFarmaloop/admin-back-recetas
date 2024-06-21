import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

import { ApprovePreorderPaymentParams, IEventEmitter, SendNotificationToCustomerParams, SubscriptionOrder } from './interface';
import { AttemptResponsible, SubscriptionEntity } from '../../../core/modules/subscription/domain/subscription.entity';
import { PreOrderEntity } from '../../../core/modules/preorder/domain/preOrder.entity';

export class EventEmitter implements IEventEmitter {
  private readonly emitter: EventBridgeClient;

  constructor() {
    this.emitter = new EventBridgeClient({ region: 'us-east-1' });
  }

  async generateSubscriptionCharge(id: string, responsible: AttemptResponsible) {
    try {
      const command = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'ecommerce', body: { id, responsible }, action: 'cobrar-suscripcion' }),
            DetailType: 'Generar cobro de suscripción desde Lambda Suscripciones.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `suscripciones_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.emitter.send(command);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error al emitir evento de intento de cobro: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error al emitir evento de intento de cobro.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`Error general al emitir evento de intento de cobro: ${id}.`, err.message);
      throw new Error(err.message);
    }
  }

  async generateSubscriptionPreOrders(subscription: SubscriptionEntity) {
    try {
      const command = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'ecommerce', body: subscription, action: 'crear-preordenes-suscripcion' }),
            DetailType: 'Generar preordenes de suscripción desde Lambda Suscripciones.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `suscripciones_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.emitter.send(command);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error al emitir evento para crear preordenes: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error al emitir evento para crear preordenes.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`Error general al emitir evento para crear preordenes: ${subscription.id}.`, err.message);
      throw new Error(err.message);
    }
  }

  async approvePreorderPayment(params: ApprovePreorderPaymentParams) {
    const { orderId, successAttempt } = params;

    try {
      const command = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'ecommerce', body: { orderId, successAttempt }, action: 'aprobar-pago-preorden' }),
            DetailType: 'Aprobar pago de preordene de suscripción desde Lambda Suscripciones.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `suscripciones_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.emitter.send(command);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error al emitir evento para aprobar pago de preorden: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error al emitir evento para aprobar pago de preorden.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`Error general al emitir evento para aprobar pago de preorden: ${orderId}.`, err.message);
      throw new Error(err.message);
    }
  }

  async generateAdministratorOrder(preOrder: PreOrderEntity) {
    try {
      const notification = this.generateSubscriptionOrder(preOrder);

      const command = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'suscripcion', body: notification, action: 'crear-order' }),
            DetailType: 'Crear orden de suscripción desde Lambda Suscripciones.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `ordenes_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.emitter.send(command);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error al emitir evento para generar orden en admin: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error al emitir evento para generar orden en admin.');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error general al emitir evento para generar orden en admin: ', err.message);
      throw new Error(err.message);
    }
  }

  private generateSubscriptionOrder(preOrder: PreOrderEntity): SubscriptionOrder {
    const { customer, delivery, extras, id, payment, productsOrder, resumeOrder } = preOrder;

    if (!payment) throw new Error('');

    return {
      customer,
      delivery,
      extras,
      id,
      payment,
      productsOrder,
      resumeOrder,
    };
  }

  async sendNotificationToCustomer(params: SendNotificationToCustomerParams) {
    const { action, id } = params;

    try {
      const command = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'admin-back-suscripcion-core', body: { id }, action }),
            DetailType: 'Notificar la creación correcta de la suscripción desde Lambda Suscripciones.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `suscripciones_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.emitter.send(command);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error al emitir evento para notificar al paciente: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error al emitir evento para notificar al paciente.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`Error general al emitir evento para notificar al paciente: ${id}.`, err.message);
      throw new Error(err.message);
    }
  }

  async syncEcommerceSubscription(id: string, toSync: Partial<SubscriptionEntity>) {
    try {
      const command = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'admin-back-suscripcion-core', body: { id, toSync }, action: 'sincronizar-suscripcion' }),
            DetailType: 'Sincronizar orden de eCommerce.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `ecomm_suscripciones_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.emitter.send(command);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error al emitir evento para sincronizar orden eCommerce: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error al emitir evento para sincronizar orden eCommerce.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`Error general al emitir evento para sincronizar orden eCommerce: ${id}.`, err.message);
      throw new Error(err.message);
    }
  }
}
