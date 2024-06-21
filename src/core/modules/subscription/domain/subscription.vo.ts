import { Attempt, Product, SubscriptionEntity, ShipmentSchedule, Tracking, GeneralStatus, ProgressStatus } from './subscription.entity';

export class SubscriptionVO {
  create(payload: CreateSubscriptionParams): SubscriptionEntity {
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

  updateSubscriptionChargeSuccess(subscription: SubscriptionEntity, attempt: Attempt): SubscriptionToUpdateSuccess {
    const { currentShipmentId, shipment } = subscription;
    const { responsible } = attempt;

    const index = shipment.shipmentSchedule.findIndex((el) => el.id === currentShipmentId);
    if (index === -1) {
      throw new Error('Index of the shipment schedule was not found in updateSubscriptionChargeSuccess()');
    }

    const currentShipment = shipment.shipmentSchedule[index];
    const isSistemas = responsible === 'Sistema';
    const isUsuario = responsible === 'Usuario';

    const newShipmentSchedule: ShipmentSchedule = {
      ...currentShipment,
      paymentStatus: 'Success',

      numberOfAttempts: isSistemas ? currentShipment.numberOfAttempts + 1 : currentShipment.numberOfAttempts,
      numberOfUserAttempts: isUsuario ? currentShipment.numberOfUserAttempts + 1 : currentShipment.numberOfUserAttempts,
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

  updateSubscriptionChargeFailed(subscription: SubscriptionEntity, attempt: Attempt): SubscriptionToUpdateFailed {
    const { currentShipmentId, shipment } = subscription;
    const { responsible } = attempt;

    const index = shipment.shipmentSchedule.findIndex((el) => el.id === currentShipmentId);
    if (index === -1) {
      throw new Error('Index of the shipment schedule was not found in updateSubscriptionChargeFailed()');
    }

    const currentShipment = shipment.shipmentSchedule[index];
    const isSistemas = responsible === 'Sistema';
    const isUsuario = responsible === 'Usuario';

    const newShipmentSchedule: ShipmentSchedule = {
      ...currentShipment,
      nextPaymentDate: isSistemas ? this.addOneDayToDate(currentShipment.nextPaymentDate) : currentShipment.nextPaymentDate,

      paymentStatus: 'Retrying',

      numberOfAttempts: isSistemas ? currentShipment.numberOfAttempts + 1 : currentShipment.numberOfAttempts,
      numberOfUserAttempts: isUsuario ? currentShipment.numberOfUserAttempts + 1 : currentShipment.numberOfUserAttempts,
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

  updateSubscriptionChargeFailedLastAttempt(subscription: SubscriptionEntity, attempt: Attempt): SubscriptionToUpdateFailedLastAttempt {
    const { currentShipmentId, shipment } = subscription;

    const index = shipment.shipmentSchedule.findIndex((el) => el.id === currentShipmentId);
    if (index === -1) {
      throw new Error('Index of the shipment schedule was not found in updateSubscriptionChargeFailedLastAttempt()');
    }

    const currentShipment = shipment.shipmentSchedule[index];

    const newShipmentSchedule: ShipmentSchedule = {
      ...currentShipment,
      paymentStatus: 'Failed',

      numberOfAttempts: currentShipment.numberOfAttempts + 1,
      attempts: [...currentShipment.attempts, attempt],
    };
    const newArr = shipment.shipmentSchedule;
    newArr[index] = newShipmentSchedule;

    const today = new Date().getTime();

    return {
      updatedAt: today,
      shipment: { ...shipment, shipmentSchedule: newArr },
      generalStatus: 'Cancelled',
      progressStatus: 'Aborted',
      trackingGeneralStatus: [
        ...subscription.trackingGeneralStatus,
        { date: today, observation: 'Último intento de cobro', responsible: 'Sistemas', status: 'Cancelled' },
      ],
      trackingProgressStatus: [
        ...subscription.trackingProgressStatus,
        { date: today, observation: 'Último intento de cobro', responsible: 'Sistemas', status: 'Aborted' },
      ],
    };
  }

  completeSubscription(subscription: SubscriptionEntity, attempt: Attempt): SubscriptionToUpdateComplete {
    const { currentShipmentId, shipment } = subscription;
    const { responsible } = attempt;

    const index = shipment.shipmentSchedule.findIndex((el) => el.id === currentShipmentId);
    if (index === -1) {
      throw new Error('Index of the shipment schedule was not found in completeSubscription()');
    }

    const currentShipment = shipment.shipmentSchedule[index];
    const isSistemas = responsible === 'Sistema';
    const isUsuario = responsible === 'Usuario';
    const today = new Date().getTime();

    const newShipmentSchedule: ShipmentSchedule = {
      ...currentShipment,
      paymentStatus: 'Success',

      numberOfAttempts: isSistemas ? currentShipment.numberOfAttempts + 1 : currentShipment.numberOfAttempts,
      numberOfUserAttempts: isUsuario ? currentShipment.numberOfUserAttempts + 1 : currentShipment.numberOfUserAttempts,
      attempts: [...currentShipment.attempts, attempt],
    };
    const newArr = shipment.shipmentSchedule;
    newArr[index] = newShipmentSchedule;

    return {
      updatedAt: today,
      shipment: { ...shipment, shipmentSchedule: newArr },
      generalStatus: 'Completed',
      progressStatus: 'Completed',
      trackingGeneralStatus: [
        ...subscription.trackingGeneralStatus,
        { date: today, observation: 'Último cobro con éxito', responsible: 'Sistemas', status: 'Completed' },
      ],
      trackingProgressStatus: [
        ...subscription.trackingProgressStatus,
        { date: today, observation: 'Último cobro con éxito', responsible: 'Sistemas', status: 'Completed' },
      ],
    };
  }

  private addOneDayToDate(currentDate: number): number {
    const newDate = new Date(currentDate);
    newDate.setTime(newDate.getTime() + 86400000);
    return newDate.getTime();
  }
}

export type CreateSubscriptionParams = Omit<SubscriptionEntity, 'products'> & {
  products: Array<Omit<Product, 'prescription'> & { prescription: string }>;
};

export type SubscriptionToUpdateSuccess = Pick<
  SubscriptionEntity,
  'updatedAt' | 'shipment' | 'nextPaymentDate' | 'nextShipmentDate' | 'currentShipmentId'
>;

export type SubscriptionToUpdateFailed = Pick<SubscriptionEntity, 'updatedAt' | 'shipment' | 'nextPaymentDate'>;

export type SubscriptionToUpdateFailedLastAttempt = Pick<
  SubscriptionEntity,
  'updatedAt' | 'shipment' | 'generalStatus' | 'progressStatus' | 'trackingGeneralStatus' | 'trackingProgressStatus'
>;

export type SubscriptionToUpdateComplete = Pick<
  SubscriptionEntity,
  'updatedAt' | 'shipment' | 'generalStatus' | 'progressStatus' | 'trackingGeneralStatus' | 'trackingProgressStatus'
>;
