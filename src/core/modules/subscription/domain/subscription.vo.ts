import { Product, SubscriptionEntity } from './subscription.entity';

export class SubscriptionVO {
  create(payload: CreateSubscriptionPayload): SubscriptionEntity {
    const { products } = payload;

    const todayTimestmap = new Date().getTime();

    return {
      ...payload,

      products: products.map((el) => ({
        ...el,
        prescription: {
          file: el.prescription,
          state: 'Pending',
          stateDate: todayTimestmap,
          validation: { comments: '', responsible: '', rut: '' },
        },
      })),
    };
  }
}

export type CreateSubscriptionPayload = Omit<SubscriptionEntity, 'products'> & {
  products: Array<Omit<Product, 'prescription'> & { prescription: string }>;
};

export type SubscriptionToUpdate = Pick<
  SubscriptionEntity,
  | 'updatedAt'
  | 'paymentMethods'
  | 'shipment'
  | 'nextPaymentDate'
  | 'nextShipmentDate'
  | 'currentPaymentId'
  | 'generalStatus'
  | 'paymentStatus'
  | 'progressStatus'
  | 'trackingGeneralStatus'
  | 'trackingPaymentStatus'
  | 'trackingProgressStatus'
>;
