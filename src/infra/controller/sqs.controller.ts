import { SubscriptionUseCase } from '../../core/modules/subscription/application/subscription.usecase';
import { SQSEventInput } from '../../interfaces/sqs';
import { Charge_Subscription_Dto } from '../dto/subscription/charge.dto';
import { Create_Subscription_Dto } from '../dto/subscription/create.dto';
import { SubscriptionMongoRepository } from '../repository/subscription/subscription.mongo.repository';
import { TokenManagerService } from '../services/tokenManager/tokenManager.service';
import { TransbankService } from '../services/transbank/transbank.service';
import { AdminNotificationService } from '../services/adminNotification/adminNotification.service';

export const SQSController = async (event: SQSEventInput) => {
  const { action, payload } = event;

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

  if (action === 'crear-suscripcion') {
    const { message, status } = Create_Subscription_Dto(payload);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.createSubscription(payload);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'cobrar-suscripcion') {
    const { message, status } = Charge_Subscription_Dto(payload);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.generateCharge(payload.id);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  return { statusCode: 200, body: JSON.stringify(event) };
};
