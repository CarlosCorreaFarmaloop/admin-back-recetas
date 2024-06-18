import { SubscriptionRepository } from '../domain/subscription.repository';
import { CreateSubscriptionPayload, SubscriptionVO } from '../domain/subscription.vo';
import { HttpCodes } from './api.response';
import { ISubscriptionUseCase, ApproveSubscription, RejectSubscription } from './subscription.usecase.interface';
import { Delivery, GeneralStatus, Prescription, ShipmentSchedule, SubscriptionEntity } from '../domain/subscription.entity';
import { ITokenManagerService } from '../../../../infra/services/tokenManager/interface';
import { ITransbankService } from '../../../../infra/services/transbank/interface';
import { IEventEmitter } from '../../../../infra/services/eventEmitter/interface';

export class SubscriptionUseCase implements ISubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly tokenManagerService: ITokenManagerService,
    private readonly transbankService: ITransbankService,
    private readonly eventEmitter: IEventEmitter
  ) {}

  async createSubscription(payload: CreateSubscriptionPayload) {
    console.log('Enters createSubscription(): ', JSON.stringify(payload, null, 2));

    const newSubscription = new SubscriptionVO().create(payload);
    const subscriptionDb = await this.subscriptionRepository.create(newSubscription);

    console.log('Subscription created: ', JSON.stringify(subscriptionDb, null, 2));
    return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
  }

  async approveSubscription(payload: ApproveSubscription) {
    console.log('Enters approveSubscription(): ', JSON.stringify({ payload }, null, 2));

    const { id, responsible } = payload;

    const subscriptionDb = await this.subscriptionRepository.get(id);

    this.validateApproveSuscription(subscriptionDb);

    const newSubscription = new SubscriptionVO().approve(subscriptionDb.trackingGeneralStatus, responsible);
    const updatedSubscription = await this.subscriptionRepository.update(id, newSubscription);

    // Notificar a cliente que aprobamos su suscripción.
    await this.eventEmitter.generateSubscriptionPreOrders(updatedSubscription);
    await this.eventEmitter.generateSubscriptionCharge(subscriptionDb.id);

    console.log('Subscription approved: ', JSON.stringify(updatedSubscription, null, 2));
    return { data: updatedSubscription, message: 'Subscription successfully approved.', status: HttpCodes.OK };
  }

  async rejectSubscription(payload: RejectSubscription) {
    console.log('Enters rejectSubscription(): ', JSON.stringify({ payload }, null, 2));

    const { id, observation, responsible } = payload;

    const subscriptionDb = await this.subscriptionRepository.get(id);

    this.validateRejectSuscription(subscriptionDb);

    const newSubscription = new SubscriptionVO().reject(
      subscriptionDb.trackingGeneralStatus,
      subscriptionDb.trackingProgressStatus,
      responsible,
      observation
    );
    const updatedSubscription = await this.subscriptionRepository.update(id, newSubscription);

    console.log('Subscription rejected: ', JSON.stringify(updatedSubscription, null, 2));
    return { data: updatedSubscription, message: 'Subscription successfully rejected.', status: HttpCodes.OK };
  }

  async generateCharge(id: string) {
    console.log('Enters generateCharge(): ', id);

    const subscriptionDb = await this.subscriptionRepository.get(id);

    this.validateChargeSubscripton(subscriptionDb);
    const currentShipmentSchedule = this.searchCurrentShipmentSchedule(subscriptionDb);

    const token = await this.tokenManagerService.getToken(subscriptionDb.currentPaymentId);
    const newAttempt = await this.transbankService.authorizeTransaction(token, subscriptionDb, currentShipmentSchedule);

    const subscriptionVO = new SubscriptionVO();

    const isLastAttempt = this.validateIsLastAttempt(subscriptionDb);
    if (newAttempt.status === 'Failed' && isLastAttempt) {
      const subscriptionToUpdate = subscriptionVO.updateSubscriptionChargeFailedLastAttempt(subscriptionDb, newAttempt);
      const updatedSubscription = await this.subscriptionRepository.update(id, subscriptionToUpdate);
      // Notificar al cliente que fallo el ultimo intento.

      console.log('Last subscription charge attempt failed: ', JSON.stringify(updatedSubscription, null, 2));
      return { data: true, message: 'Subscription attempted charge made.', status: HttpCodes.OK };
    }

    if (newAttempt.status === 'Failed') {
      const subscriptionToUpdate = subscriptionVO.updateSubscriptionChargeFailed(subscriptionDb, newAttempt);
      const updatedSubscription = await this.subscriptionRepository.update(id, subscriptionToUpdate);
      // Notificar al cliente que fallo el cobro y se programo un nuevo intento para mañana.

      console.log('Subscription charge attempt failed: ', JSON.stringify(updatedSubscription, null, 2));
      return { data: true, message: 'Subscription attempted charge made.', status: HttpCodes.OK };
    }

    const isLastCharge = this.validateIsLastCharge(subscriptionDb);
    if (isLastCharge) {
      const subscriptionToUpdate = subscriptionVO.completeSubscription(subscriptionDb, newAttempt);
      const updatedSubscription = await this.subscriptionRepository.update(id, subscriptionToUpdate);
      // Notificar al cliente que se completo la suscripcion.

      console.log('Subscription charge was generated and completed: ', JSON.stringify(updatedSubscription, null, 2));
      return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
    }

    const subscriptionToUpdate = subscriptionVO.updateSubscriptionChargeSuccess(subscriptionDb, newAttempt);
    const updatedSubscription = await this.subscriptionRepository.update(id, subscriptionToUpdate);
    await this.eventEmitter.approvePreorderPayment({
      orderId: currentShipmentSchedule.orderId,
      successAttempt: newAttempt,
    });
    // Notificar al cliente que se realizo el cobro.

    console.log('Subscription charge was generated: ', JSON.stringify(updatedSubscription, null, 2));
    return { data: true, message: 'Subscription attempted charge made.', status: HttpCodes.OK };
  }

  async getAllSubscriptions() {
    const response = await this.subscriptionRepository.getAll();
    return { data: response, message: 'Successfully obtained subscriptions.', status: HttpCodes.OK };
  }

  async getSubscriptionByGeneralStatus(generalStatus: GeneralStatus) {
    const response = await this.subscriptionRepository.getByGeneralStatus(generalStatus);
    return { data: response, message: 'Successfully obtained subscriptions.', status: HttpCodes.OK };
  }

  async updateDelivery(id: string, deliveryToUpdate: Omit<Delivery, 'discount' | 'price' | 'pricePaid'>) {
    const response = await this.subscriptionRepository.updateDelivery(id, deliveryToUpdate);
    return { data: response, message: 'Subscription delivery successfully updated.', status: HttpCodes.OK };
  }

  async updatePrescription(id: string, sku: string, toUpdate: Pick<Prescription, 'file' | 'state' | 'validation'>) {
    console.log('Enter updatePrescription(): ', JSON.stringify({ id, sku, toUpdate }, null, 2));

    const response = await this.subscriptionRepository.updateProductPrescription(id, sku, toUpdate);

    console.log('Product prescription updated: ', JSON.stringify(response, null, 2));
    return { data: response, message: 'Product prescription successfully updated.', status: HttpCodes.OK };
  }

  private searchCurrentShipmentSchedule(subscription: SubscriptionEntity): ShipmentSchedule {
    const shipmentSchedule = subscription.shipment.shipmentSchedule.find((el) => el.id === subscription.currentShipmentId);

    if (!shipmentSchedule) {
      throw new Error(`Shipment Schedule not found: ${subscription.id}.`);
    }

    return shipmentSchedule;
  }

  private validateApproveSuscription(subscription: SubscriptionEntity): void {
    const { generalStatus, paymentStatus, products, progressStatus } = subscription;

    if (generalStatus !== 'In Review') {
      throw new Error(`Incorrect subscription generalStatus: ${subscription.id}`);
    }

    if (paymentStatus !== 'Paid') {
      throw new Error(`Incorrect subscription paymentStatus: ${subscription.id}`);
    }

    if (progressStatus !== 'In Progress') {
      throw new Error(`Incorrect subscription progressStatus: ${subscription.id}`);
    }

    const isInvalid = products.some(
      (el) =>
        (el.requiresPrescription && !el.prescription.file) ||
        (el.requiresPrescription && el.prescription.state === 'Pending') ||
        (el.requiresPrescription && el.prescription.state === 'Rejected') ||
        (el.requiresPrescription && el.prescription.state === 'Approved_With_Comments' && !el.prescription.validation.comments)
    );
    if (isInvalid) {
      throw new Error(`Incorrect prescriptions for subscription products: ${subscription.id}`);
    }
  }

  private validateRejectSuscription(subscription: SubscriptionEntity): void {
    const { generalStatus, paymentStatus, progressStatus } = subscription;

    if (generalStatus !== 'In Review') {
      throw new Error(`Incorrect subscription generalStatus: ${subscription.id}`);
    }

    if (paymentStatus !== 'Paid') {
      throw new Error(`Incorrect subscription paymentStatus: ${subscription.id}`);
    }
    if (progressStatus !== 'In Progress') {
      throw new Error(`Incorrect subscription progressStatus: ${subscription.id}`);
    }
  }

  private validateChargeSubscripton(subscription: SubscriptionEntity): void {
    const { generalStatus, paymentStatus, progressStatus, paymentMethods, shipment } = subscription;

    if (generalStatus !== 'Approved') {
      throw new Error(`Incorrect subscription generalStatus: ${subscription.id}`);
    }

    if (paymentStatus !== 'Paid') {
      throw new Error(`Incorrect subscription paymentStatus: ${subscription.id}`);
    }

    if (progressStatus !== 'In Progress') {
      throw new Error(`Incorrect subscription progressStatus: ${subscription.id}`);
    }

    const activePaymentMethod = paymentMethods.some((el) => el.status === 1);
    if (!activePaymentMethod) {
      throw new Error(`Incorrect subscription, no active payment method found: ${subscription.id}`);
    }

    if (shipment.quantityShipped >= shipment.numberOfShipments) {
      throw new Error(`Incorrect subscription, shipment quantity exceeded: ${subscription.id}`);
    }
  }

  private validateIsLastCharge(subscription: SubscriptionEntity) {
    const { currentShipmentId, shipment } = subscription;
    return currentShipmentId === shipment.shipmentSchedule[shipment.shipmentSchedule.length - 1].id;
  }

  private validateIsLastAttempt(subscription: SubscriptionEntity): boolean {
    const { currentShipmentId, shipment } = subscription;

    const currentShipmentSchedule = shipment.shipmentSchedule.find((el) => el.id === currentShipmentId);
    if (!currentShipmentSchedule) {
      console.log('Shipment Schedule does not exist: ', JSON.stringify(subscription, null, 2));
      throw new Error('Shipment Schedule does not exist.');
    }

    return currentShipmentSchedule.maxAttempts === currentShipmentSchedule.numberOfAttempts - 1;
  }
}
