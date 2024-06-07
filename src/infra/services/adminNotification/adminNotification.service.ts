import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

import { IAdminNotificationService, SubscriptionOrder } from './interface';
import {
  Attempt,
  ShipmentSchedule,
  SubscriptionEntity,
} from '../../../core/modules/subscription/domain/subscription.entity';

export class AdminNotificationService implements IAdminNotificationService {
  private readonly eventBridgeClient: EventBridgeClient;

  constructor() {
    this.eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });
  }

  public async notifyPaidSubscription(subscription: SubscriptionEntity) {
    try {
      const params = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'ecommerce', payload: subscription, action: 'crear-suscripcion' }),
            DetailType: 'Crear suscripcion desde eCommerce.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `suscripciones_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.eventBridgeClient.send(params);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error al notificar suscripcion pagada: ', JSON.stringify({ params, response }, null, 2));
      }

      return true;
    } catch (error) {
      const err = error as Error;
      console.error('Error al notificar suscripcion pagada: ', err.message);
      throw new Error(err.message);
    }
  }

  private generateSubscriptionOrder(
    newId: string,
    subscription: SubscriptionEntity,
    shipmentSchedule: ShipmentSchedule,
    attempt: Attempt
  ): SubscriptionOrder {
    const { customer, delivery, resume } = subscription;

    return {
      customer,
      delivery: {
        compromiso_entrega: {
          date: 0,
        },
        cost: delivery.price,
        delivery_address: {
          comuna: delivery.comuna,
          dpto: delivery.homeNumber,
          firstName: delivery.fullName,
          homeType: delivery.homeType,
          isExactAddress: delivery.isExactAddress,
          lastName: '',
          latitude: delivery.latitude,
          longitude: delivery.longitude,
          phone: delivery.phone,
          placeId: delivery.placeId,
          region: delivery.region,
          streetName: delivery.streetName,
          streetNumber: delivery.streetNumber,
        },
        discount: delivery.discount,
        method: 'DELIVERY',
        pricePaid: delivery.pricePaid,
        type: 'Envío Estándar (48 horas hábiles)',
      },
      extras: {
        referrer: '',
      },
      id: newId,
      payment: {
        payment: {
          amount: resume.total,
          method: attempt.paymentMethod,
          originCode: attempt.externalCode,
          paymentDate: attempt.transactionDate,
          status: 'Aprobado',
          wallet: 'Transbank',
        },
      },
    };
  }
}
