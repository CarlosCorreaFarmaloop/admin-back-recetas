import { ITokenManagerService } from 'src/infra/services/tokenManager/interface';
import { ITransbankService } from '../../../../infra/services/transbank/interface';
import { SubscriptionRepository } from '../domain/subscription.repository';
import { CreateSubscriptionPayload, SubscriptionVO } from '../domain/subscription.vo';
import { ApiResponse, HttpCodes } from './api.response';
import { ISubscriptionUseCase } from './subscription.usecase.interface';
import { Delivery, GeneralStatus, Prescription, SubscriptionEntity } from '../domain/subscription.entity';

export class SubscriptionUseCase implements ISubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly tokenManagerService: ITokenManagerService,
    private readonly transbankService: ITransbankService
  ) {}

  async createSubscription(payload: CreateSubscriptionPayload) {
    console.log('Enter subscription to create: ', JSON.stringify(payload, null, 2));

    const newSubscription = new SubscriptionVO().create(payload);
    const subscriptionDb = await this.subscriptionRepository.create(newSubscription);
    if (!subscriptionDb) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Error creating subscription.');
    }

    console.log('Subscription created: ', JSON.stringify(subscriptionDb, null, 2));

    return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
  }

  async generateCharge(id: string) {
    console.log('Generate charge to subscription: ', id);

    const currentSubscription = await this.subscriptionRepository.get(id);
    if (!currentSubscription) {
      console.log(`Error getting subscription ${id}.`, JSON.stringify(currentSubscription, null, 2));
      throw new ApiResponse(HttpCodes.BAD_REQUEST, currentSubscription, 'Error getting subscription.');
    }

    const token = await this.tokenManagerService.getToken(currentSubscription.currentPaymentId);

    const subscriptionVO = new SubscriptionVO();
    const newId = subscriptionVO.generateOrderId();

    const response = await this.transbankService.authorizeTransaction(token, newId, currentSubscription);

    if (response.status === 'Failed') {
      const subscriptionToUpdate = subscriptionVO.updateSubscriptionFailed(currentSubscription, response);
      await this.subscriptionRepository.update(id, subscriptionToUpdate);
      return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
    }

    const isLastCharge = this.validateIsLastCharge(currentSubscription);
    if (isLastCharge) {
      const subscriptionToUpdate = subscriptionVO.completeSubscription(currentSubscription, response, newId);
      await this.subscriptionRepository.update(id, subscriptionToUpdate);
      return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
    }

    const subscriptionToUpdate = subscriptionVO.updateSubscriptionSuccess(currentSubscription, response, newId);
    await this.subscriptionRepository.update(id, subscriptionToUpdate);

    return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
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

  private validateIsLastCharge(subscription: SubscriptionEntity) {
    const { currentShipmentId, shipment } = subscription;

    return currentShipmentId === shipment.shipmentSchedule[shipment.shipmentSchedule.length - 1].id;
  }
}
