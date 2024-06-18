import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

import { ApprovePreorderPaymentParams, IEventEmitter, SubscriptionOrder } from './interface';
import { SubscriptionEntity } from '../../../core/modules/subscription/domain/subscription.entity';
import { PreOrderEntity } from '../../../core/modules/preorder/domain/preOrder.entity';

export class EventEmitter implements IEventEmitter {
  private readonly emitter: EventBridgeClient;

  constructor() {
    this.emitter = new EventBridgeClient({ region: 'us-east-1' });
  }

  async generateSubscriptionCharge(id: string) {
    try {
      const command = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'ecommerce', body: { id }, action: 'cobrar-suscripcion' }),
            DetailType: 'Generar cobro de suscripción desde Lambda Suscripciones.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `suscripciones_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.emitter.send(command);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error when notifying to generate the subscription charge: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error when notifying to generate the subscription charge.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`General error when notifying to generate the subscription charge: ${id}.`, err.message);
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
        console.error('Error when notifying to generate subscription preorders: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error when notifying to generate subscription preorders.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`General error when notifying to generate subscription preorders: ${subscription.id}.`, err.message);
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
        console.error('Error when notifying to approve preorder payment: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error when notifying to approve preorder payment.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`General error when notifying to approve preorder payment: ${orderId}.`, err.message);
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
        console.error('Error notifying subscription order: ', JSON.stringify({ command, response }, null, 2));
        throw new Error('Error notifying subscription order.');
      }

      return true;
    } catch (error) {
      const err = error as Error;
      console.error('General error notifying subscription order: ', err.message);
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
}
