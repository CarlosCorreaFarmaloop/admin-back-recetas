import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

import { IAdminNotificationService, PrescriptionType, ProductOrder, SubscriptionOrder } from './interface';
import {
  Attempt,
  Product,
  ShipmentSchedule,
  SubscriptionEntity,
} from '../../../core/modules/subscription/domain/subscription.entity';

export class AdminNotificationService implements IAdminNotificationService {
  private readonly eventBridgeClient: EventBridgeClient;

  constructor() {
    this.eventBridgeClient = new EventBridgeClient({ region: 'us-east-1' });
  }

  async notifySubscriptionCharge(id: string) {
    try {
      const params = new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({ origin: 'ecommerce', payload: { id }, action: 'cobrar-suscripcion' }),
            DetailType: 'Generar cobro de suscripción desde Lambda Suscripciones.',
            EventBusName: 'arn:aws:events:us-east-1:069526102702:event-bus/default',
            Source: `suscripciones_sqs_${process.env.ENV?.toLowerCase() as string}`,
          },
        ],
      });

      const response = await this.eventBridgeClient.send(params);

      if (response?.FailedEntryCount && response?.FailedEntryCount > 0) {
        console.error('Error when notifying the subscription charge: ', JSON.stringify({ params, response }, null, 2));
        throw new Error('Error when notifying the subscription charge.');
      }
    } catch (error) {
      const err = error as Error;
      console.error(`General error when notifying the subscription charge: ${id}.`, err.message);
      throw new Error(err.message);
    }
  }

  async notifyOrderSubscription(subscription: SubscriptionEntity, shipmentSchedule: ShipmentSchedule, newId: string) {
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
        return false;
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
    const { customer, delivery, discount, resume } = subscription;

    return {
      customer,
      delivery: {
        compromiso_entrega: {
          date: shipmentSchedule.shipmentDate,
          dateText: '',
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
          amount: attempt.amount,
          method: attempt.paymentMethod,
          originCode: attempt.externalCode,
          paymentDate: attempt.transactionDate,
          status: 'Aprobado',
          wallet: 'Transbank',
        },
      },
      productsOrder: this.generateProducts(subscription.products),
      resumeOrder: {
        canal: '',
        cartId: '',
        clasification: '',
        convenio: '',
        deliveryPrice: delivery.pricePaid,
        discount,
        nroProducts: resume.numberOfProducts,
        seller: '',
        subtotal: resume.subtotal,
        totalPrice: resume.total,
      },
    };
  }

  private generateProducts(products: Product[]): ProductOrder[] {
    const newArr: ProductOrder[] = products.map((el) => ({
      batchId: '',
      bioequivalent: el.bioequivalent,
      cooled: el.cooled,
      discountPerUnit: el.discountPerUnit,
      ean: el.ean,
      expiration: 0,
      fullName: el.fullName,
      laboratoryName: el.laboratoryName,
      liquid: el.liquid,
      normalUnitPrice: 0,
      pharmaceuticalForm: el.pharmaceuticalForm,
      photoURL: el.photoURL,
      prescription: {
        file: el.prescription.file,
      },
      prescriptionType: el.prescriptionType as PrescriptionType,
      presentation: el.presentation,
      price: el.price,
      pricePaidPerUnit: el.pricePaidPerUnit,
      productCategory: el.productCategory,
      productSubCategory: el.productSubCategory,
      qty: el.quantity,
      quantityPerContainer: el.quantityPerContainer,
      recommendations: el.recommendations,
      requirePrescription: el.requiresPrescription,
      shortName: el.shortName,
      sku: el.sku,
    }));

    return newArr;
  }
}
