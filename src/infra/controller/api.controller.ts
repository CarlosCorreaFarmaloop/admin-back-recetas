import { SubscriptionUseCase } from '../../core/modules/subscription/application/subscription.usecase';
import { APIGatewayEventInput } from '../../interfaces/apigateway';
import { Get_Subscription_Dto } from '../dto/subscription/getByStatus';
import { UpdateDelivery_Subscription_Dto } from '../dto/subscription/updateDelivery.dto';
import { SubscriptionMongoRepository } from '../repository/subscription/subscription.mongo.repository';
import { TokenManagerService } from '../services/tokenManager/tokenManager.service';
import { TransbankService } from '../services/transbank/transbank.service';

const basePath = '/api-lambda/subscriptions';

export const APIController = async (event: APIGatewayEventInput) => {
  const { body, path } = event;

  const tokenManagerService = new TokenManagerService();
  const transbankService = new TransbankService();

  const subscriptionRepository = new SubscriptionMongoRepository();
  const subscriptionUseCase = new SubscriptionUseCase(subscriptionRepository, tokenManagerService, transbankService);

  if (path === `${basePath}/get-subscriptions-by-status`) {
    const { message, status } = Get_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.getSubscriptionByGeneralStatus(body.status);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (path === `${basePath}/update-delivery`) {
    const { message, status } = UpdateDelivery_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.updateDelivery(body.id, body.delivery);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  return { statusCode: 404, message: 'Not Found' };
};
