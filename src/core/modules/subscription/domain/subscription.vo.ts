import {
  Attempt,
  Product,
  SubscriptionEntity,
  ShipmentSchedule,
  Tracking,
  GeneralStatus,
  ProgressStatus,
} from './subscription.entity';

export class SubscriptionVO {
  create(payload: CreateSubscriptionPayload): SubscriptionEntity {
    const { products } = payload;

    return {
      ...payload,

      products: products.map((el) => ({
        ...el,
        prescription: {
          file: el.prescription,
          maxNumberOfUses: 0,
          numberOfUses: 0,
          state: 'Pending',
          validation: { comments: '', responsible: '', rut: '' },
        },
      })),
    };
  }

  approve(
    currentGeneralStatusTracking: Array<Tracking<GeneralStatus>>,
    responsible: string
  ): Pick<SubscriptionEntity, 'generalStatus' | 'trackingGeneralStatus'> {
    return {
      generalStatus: 'Approved',
      trackingGeneralStatus: [
        ...currentGeneralStatusTracking,
        { date: new Date().getTime(), observation: '', responsible, status: 'Approved' },
      ],
    };
  }

  reject(
    currentGeneralStatusTracking: Array<Tracking<GeneralStatus>>,
    currentProgressStatusTracking: Array<Tracking<ProgressStatus>>,
    responsible: string,
    observation: string
  ): Pick<SubscriptionEntity, 'generalStatus' | 'progressStatus' | 'trackingGeneralStatus' | 'trackingProgressStatus'> {
    return {
      generalStatus: 'Rejected',
      progressStatus: 'Cancelled',
      trackingGeneralStatus: [
        ...currentGeneralStatusTracking,
        { date: new Date().getTime(), observation, responsible, status: 'Rejected' },
      ],
      trackingProgressStatus: [
        ...currentProgressStatusTracking,
        { date: new Date().getTime(), observation, responsible, status: 'Cancelled' },
      ],
    };
  }

  generateOrderId(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    let firstTwoLetters = '';
    let sixNumbers = '';

    for (let i = 0; i < 2; i++) {
      firstTwoLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    for (let i = 0; i < 6; i++) {
      sixNumbers += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return `CL-S-${firstTwoLetters}${sixNumbers}`;
  }

  updateSubscriptionSuccess(
    subscription: SubscriptionEntity,
    attempt: Attempt,
    orderId: string
  ): SubscriptionToUpdateSuccess {
    const { currentShipmentId, shipment } = subscription;

    const index = shipment.shipmentSchedule.findIndex((el) => el.id === currentShipmentId);
    if (index === -1) throw new Error('');

    const currentShipment = shipment.shipmentSchedule[index];

    const newShipmentSchedule: ShipmentSchedule = {
      ...currentShipment,
      paymentStatus: 'Success',
      orderId,
      orderStatus: 'Created',
      numberOfAttempts: currentShipment.numberOfAttempts + 1,
      attempts: [...currentShipment.attempts, attempt],
    };
    const newArr = shipment.shipmentSchedule;
    newArr[index] = newShipmentSchedule;

    return {
      updatedAt: new Date().getTime(),
      shipment: { ...shipment, shipmentSchedule: newArr },
      nextPaymentDate: newArr[index + 1].nextPaymentDate,
      nextShipmentDate: newArr[index + 1].shipmentDate,
      currentShipmentId: newArr[index + 1].id,
    };
  }

  updateSubscriptionFailed(subscription: SubscriptionEntity, attempt: Attempt): SubscriptionToUpdateFailed {
    const { currentShipmentId, shipment } = subscription;

    const index = shipment.shipmentSchedule.findIndex((el) => el.id === currentShipmentId);
    if (index === -1) throw new Error('');

    const currentShipment = shipment.shipmentSchedule[index];

    const newShipmentSchedule: ShipmentSchedule = {
      ...currentShipment,
      nextPaymentDate: this.addOneDayToDate(currentShipment.nextPaymentDate),
      paymentStatus: 'Failed',
      numberOfAttempts: currentShipment.numberOfAttempts + 1,
      attempts: [...currentShipment.attempts, attempt],
    };
    const newArr = shipment.shipmentSchedule;
    newArr[index] = newShipmentSchedule;

    return {
      updatedAt: new Date().getTime(),
      shipment: { ...shipment, shipmentSchedule: newArr },
      nextPaymentDate: newShipmentSchedule.nextPaymentDate,
    };
  }

  completeSubscription(
    subscription: SubscriptionEntity,
    attempt: Attempt,
    orderId: string
  ): SubscriptionToUpdateComplete {
    const { currentShipmentId, shipment } = subscription;

    const index = shipment.shipmentSchedule.findIndex((el) => el.id === currentShipmentId);
    if (index === -1) throw new Error('');

    const currentShipment = shipment.shipmentSchedule[index];
    const today = new Date().getTime();

    const newShipmentSchedule: ShipmentSchedule = {
      ...currentShipment,
      paymentStatus: 'Success',
      orderId,
      orderStatus: 'Created',
      numberOfAttempts: currentShipment.numberOfAttempts + 1,
      attempts: [...currentShipment.attempts, attempt],
    };
    const newArr = shipment.shipmentSchedule;
    newArr[index] = newShipmentSchedule;

    return { updatedAt: today, shipment: { ...shipment, shipmentSchedule: newArr } };
  }

  private addOneDayToDate(currentDate: number): number {
    const newDate = new Date(currentDate);
    newDate.setTime(newDate.getTime() + 86400000);
    return newDate.getTime();
  }
}

export type CreateSubscriptionPayload = Omit<SubscriptionEntity, 'products'> & {
  products: Array<Omit<Product, 'prescription'> & { prescription: string }>;
};

export type SubscriptionToUpdateSuccess = Pick<
  SubscriptionEntity,
  'updatedAt' | 'shipment' | 'nextPaymentDate' | 'nextShipmentDate' | 'currentShipmentId'
>;

export type SubscriptionToUpdateFailed = Pick<SubscriptionEntity, 'updatedAt' | 'shipment' | 'nextPaymentDate'>;

export type SubscriptionToUpdateComplete = Pick<SubscriptionEntity, 'updatedAt' | 'shipment'>;
