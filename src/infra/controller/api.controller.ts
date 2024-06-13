import { SubscriptionUseCase } from '../../core/modules/subscription/application/subscription.usecase';
import { APIGatewayEventInput } from '../../interfaces/apigateway';
import { SubscriptionMongoRepository } from '../repository/subscription/subscription.mongo.repository';
import { Get_Subscription_Dto } from '../dto/subscription/getByStatus';
import { UpdateDelivery_Subscription_Dto } from '../dto/subscription/updateDelivery.dto';
import { UpdatePrescription_Subscription_Dto } from '../dto/subscription/updatePrescription.dto';
import { Approve_Subscription_Dto } from '../dto/subscription/approve.dto';
import { Reject_Subscription_Dto } from '../dto/subscription/reject.dto';
import { TokenManagerService } from '../services/tokenManager/tokenManager.service';
import { TransbankService } from '../services/transbank/transbank.service';
import { AdminNotificationService } from '../services/adminNotification/adminNotification.service';

const basePath = '/api-lambda/subscriptions';

export const APIController = async (event: APIGatewayEventInput) => {
  const { body, path } = event;

  const tokenManagerService = new TokenManagerService();
  const transbankService = new TransbankService();
  const adminNotificationService = new AdminNotificationService();

  const subscriptionRepository = new SubscriptionMongoRepository();
  const subscriptionUseCase = new SubscriptionUseCase(
    subscriptionRepository,
    tokenManagerService,
    transbankService,
    adminNotificationService
  );

  if (path === `${basePath}/get-all`) {
    const response = await subscriptionUseCase.getAllSubscriptions();
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (path === `${basePath}/get-subscriptions-by-status`) {
    const { message, status } = Get_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      return { statusCode: 400, body: JSON.stringify({ message }) };
    }

    const response = await subscriptionUseCase.getSubscriptionByGeneralStatus(body.status);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (path === `${basePath}/update-delivery`) {
    const { message, status } = UpdateDelivery_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      return { statusCode: 400, body: JSON.stringify({ message }) };
    }

    const response = await subscriptionUseCase.updateDelivery(body.id, body.delivery);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (path === `${basePath}/update-prescription`) {
    const { message, status } = UpdatePrescription_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      return { statusCode: 400, body: JSON.stringify({ message }) };
    }

    const response = await subscriptionUseCase.updatePrescription(body.id, body.sku, body.prescription);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (path === `${basePath}/approve`) {
    const { message, status } = Approve_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      return { statusCode: 400, body: JSON.stringify({ message }) };
    }

    const response = await subscriptionUseCase.approveSubscription(body);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (path === `${basePath}/reject`) {
    const { message, status } = Reject_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      return { statusCode: 400, body: JSON.stringify({ message }) };
    }

    const response = await subscriptionUseCase.rejectSubscription(body);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  return { statusCode: 404, message: 'Not Found' };
};
