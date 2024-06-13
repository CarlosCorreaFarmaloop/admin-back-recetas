import { SubscriptionRepository } from '../domain/subscription.repository';
import { CreateSubscriptionPayload, SubscriptionVO } from '../domain/subscription.vo';
import { ApiResponse, HttpCodes } from './api.response';
import { ISubscriptionUseCase, ApproveSubscription, RejectSubscription } from './subscription.usecase.interface';
import { Delivery, GeneralStatus, Prescription, SubscriptionEntity } from '../domain/subscription.entity';
import { ITokenManagerService } from '../../../../infra/services/tokenManager/interface';
import { ITransbankService } from '../../../../infra/services/transbank/interface';
import { IAdminNotificationService } from '../../../../infra/services/adminNotification/interface';

export class SubscriptionUseCase implements ISubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly tokenManagerService: ITokenManagerService,
    private readonly transbankService: ITransbankService,
    private readonly adminNotificationService: IAdminNotificationService
  ) {}

  async createSubscription(payload: CreateSubscriptionPayload) {
    console.log('Enter subscription to create: ', JSON.stringify(payload, null, 2));

    const newSubscription = new SubscriptionVO().create(payload);
    const subscriptionDb = await this.subscriptionRepository.create(newSubscription);
    if (!subscriptionDb) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Error creating subscription.');
    }

    await this.adminNotificationService.notifySubscriptionCharge(subscriptionDb.id);

    console.log('Subscription created: ', JSON.stringify(subscriptionDb, null, 2));

    return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
  }

  async generateCharge(id: string) {
    console.log('Generate charge to subscription: ', id);

    const subscriptionDb = await this.subscriptionRepository.get(id);
    if (!subscriptionDb) {
      console.log(`Error getting subscription ${id}.`, JSON.stringify(subscriptionDb, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Error getting subscription.');
    }

    const isValid = this.validateChargeSubscripton(subscriptionDb);
    if (!isValid) {
      console.log(`Incorrect subscription status ${id}.`, JSON.stringify(subscriptionDb, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Incorrect subscription status.');
    }

    const token = await this.tokenManagerService.getToken(subscriptionDb.currentPaymentId);

    const subscriptionVO = new SubscriptionVO();
    const newId = subscriptionVO.generateOrderId();

    const response = await this.transbankService.authorizeTransaction(token, newId, subscriptionDb);

    if (response.status === 'Failed') {
      const isLastAttempt = this.validateIsLastAttempt(subscriptionDb);

      if (isLastAttempt) {
        const subscriptionToUpdate = subscriptionVO.updateSubscriptionFailedLastAttempt(subscriptionDb, response);
        await this.subscriptionRepository.update(id, subscriptionToUpdate);
        // Notificar al cliente que fallo el ultimo intento.
        return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
      }

      const subscriptionToUpdate = subscriptionVO.updateSubscriptionFailed(subscriptionDb, response);
      await this.subscriptionRepository.update(id, subscriptionToUpdate);
      // Notificar al cliente que fallo el cobro y se programo un nuevo intento para mañana.
      return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
    }

    const isLastCharge = this.validateIsLastCharge(subscriptionDb);
    if (isLastCharge) {
      const subscriptionToUpdate = subscriptionVO.completeSubscription(subscriptionDb, response, newId);
      await this.subscriptionRepository.update(id, subscriptionToUpdate);
      // Notificar al cliente que se completo la suscripcion.
      return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
    }

    const subscriptionToUpdate = subscriptionVO.updateSubscriptionSuccess(subscriptionDb, response, newId);
    await this.subscriptionRepository.update(id, subscriptionToUpdate);
    // Enviar orden a administrador
    // Notificar al cliente que se realizo el cobro.

    return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
  }

  async getAllSubscriptions() {
    const response = await this.subscriptionRepository.getAll();

    if (!response) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, response, 'Error getting subscriptions.');
    }

    return { data: response, message: 'Successfully obtained subscriptions.', status: HttpCodes.OK };
  }

  async getSubscriptionByGeneralStatus(generalStatus: GeneralStatus) {
    const response = await this.subscriptionRepository.getByGeneralStatus(generalStatus);

    if (!response) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, response, 'Error getting subscriptions.');
    }

    return { data: response, message: 'Successfully obtained subscriptions.', status: HttpCodes.OK };
  }

  async updateDelivery(id: string, deliveryToUpdate: Omit<Delivery, 'discount' | 'price' | 'pricePaid'>) {
    const response = await this.subscriptionRepository.updateDelivery(id, deliveryToUpdate);

    if (!response) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, response, 'Error updating subscription delivery.');
    }

    return { data: response, message: 'Subscription delivery successfully updated.', status: HttpCodes.OK };
  }

  async updatePrescription(id: string, sku: string, toUpdate: Pick<Prescription, 'file' | 'state' | 'validation'>) {
    console.log('Enter update product prescription: ', JSON.stringify({ id, sku, toUpdate }, null, 2));

    const response = await this.subscriptionRepository.updateProductPrescription(id, sku, toUpdate);

    if (!response) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, response, 'Error updating product prescription.');
    }

    console.log('Product prescription updated: ', JSON.stringify(response, null, 2));

    return { data: response, message: 'Product prescription successfully updated.', status: HttpCodes.OK };
  }

  async approveSubscription(payload: ApproveSubscription) {
    const { id, responsible } = payload;
    console.log('Enter approve subscription: ', JSON.stringify({ payload }, null, 2));

    const subscriptionDb = await this.subscriptionRepository.get(id);
    if (!subscriptionDb) {
      console.log(`Error getting subscription ${id}.`, JSON.stringify(subscriptionDb, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Error getting subscription.');
    }

    const isValid = this.validateApproveSuscription(subscriptionDb);
    if (!isValid) {
      console.log(`Incorrect subscription status ${id}.`, JSON.stringify(subscriptionDb, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Incorrect subscription status.');
    }

    const newSubscription = new SubscriptionVO().approve(subscriptionDb.trackingGeneralStatus, responsible);
    const updatedSubscription = await this.subscriptionRepository.update(id, newSubscription);
    if (!updatedSubscription) {
      console.log(`Error approving subscription ${id}.`, JSON.stringify(updatedSubscription, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updatedSubscription, 'Error approving subscription.');
    }

    console.log('Subscription approved: ', JSON.stringify(updatedSubscription, null, 2));

    return { data: updatedSubscription, message: 'Subscription successfully approved.', status: HttpCodes.OK };
  }

  async rejectSubscription(payload: RejectSubscription) {
    const { id, observation, responsible } = payload;

    console.log('Enter reject subscription: ', JSON.stringify({ payload }, null, 2));

    const subscriptionDb = await this.subscriptionRepository.get(id);
    if (!subscriptionDb) {
      console.log(`Error getting subscription ${id}.`, JSON.stringify(subscriptionDb, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Error getting subscription.');
    }

    const isValid = this.validateRejectSuscription(subscriptionDb);
    if (!isValid) {
      console.log(`Incorrect subscription status ${id}.`, JSON.stringify(subscriptionDb, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Incorrect subscription status.');
    }

    const newSubscription = new SubscriptionVO().reject(
      subscriptionDb.trackingGeneralStatus,
      subscriptionDb.trackingProgressStatus,
      responsible,
      observation
    );
    const updatedSubscription = await this.subscriptionRepository.update(id, newSubscription);
    if (!updatedSubscription) {
      console.log(`Error rejecting subscription ${id}.`, JSON.stringify(updatedSubscription, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updatedSubscription, 'Error approving subscription.');
    }

    console.log('Subscription rejected: ', JSON.stringify(updatedSubscription, null, 2));

    return { data: updatedSubscription, message: 'Subscription successfully rejected.', status: HttpCodes.OK };
  }

  private validateApproveSuscription(subscription: SubscriptionEntity): boolean {
    const { generalStatus, paymentStatus, products, progressStatus } = subscription;

    if (generalStatus !== 'In Review') return false;
    if (paymentStatus !== 'Paid') return false;
    if (progressStatus !== 'In Progress') return false;

    const isInvalid = products.some(
      (el) =>
        (el.requiresPrescription && !el.prescription.file) ||
        (el.requiresPrescription && el.prescription.state === 'Pending') ||
        (el.requiresPrescription && el.prescription.state === 'Rejected') ||
        (el.requiresPrescription &&
          el.prescription.state === 'Approved_With_Comments' &&
          !el.prescription.validation.comments)
    );

    if (isInvalid) return false;

    return true;
  }

  private validateRejectSuscription(subscription: SubscriptionEntity): boolean {
    const { generalStatus, paymentStatus, progressStatus } = subscription;

    if (generalStatus !== 'In Review') return false;
    if (paymentStatus !== 'Paid') return false;
    if (progressStatus !== 'In Progress') return false;

    return true;
  }

  private validateChargeSubscripton(subscription: SubscriptionEntity): boolean {
    const { generalStatus, paymentStatus, progressStatus, paymentMethods, shipment } = subscription;

    if (generalStatus !== 'In Review' && generalStatus !== 'Approved') return false;
    if (paymentStatus !== 'Paid') return false;
    if (progressStatus !== 'In Progress') return false;

    const activePaymentMethod = paymentMethods.some((el) => el.status === 1);
    if (!activePaymentMethod) return false;

    if (shipment.quantityShipped >= shipment.numberOfShipments) return false;

    return true;
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
