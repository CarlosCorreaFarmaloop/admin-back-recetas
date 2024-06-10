import { SubscriptionUseCase } from '../../core/modules/subscription/application/subscription.usecase';
import { APIGatewayEventInput } from '../../interfaces/apigateway';
import { Get_Subscription_Dto } from '../dto/subscription/getByStatus';
import { SubscriptionMongoRepository } from '../repository/subscription/subscription.mongo.repository';
import { TokenManagerService } from '../services/tokenManager/tokenManager.service';
import { TransbankService } from '../services/transbank/transbank.service';

export const APIController = async (event: APIGatewayEventInput) => {
  const { body, path } = event;

  const tokenManagerService = new TokenManagerService();
  const transbankService = new TransbankService();

  const subscriptionRepository = new SubscriptionMongoRepository();
  const subscriptionUseCase = new SubscriptionUseCase(subscriptionRepository, tokenManagerService, transbankService);

  if (path === '/subscriptions/get-subscriptions-by-status') {
    const { message, status } = Get_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    return await subscriptionUseCase.getSubscriptionByGeneralStatus(body.status);
  }

  throw new Error('');
};
