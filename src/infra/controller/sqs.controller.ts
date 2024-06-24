import { SQSEventInput } from '../../interfaces/sqs';

import { Create_Subscription_Dto } from '../dto/subscription/create.dto';
import { Charge_Subscription_Dto } from '../dto/subscription/charge.dto';
import { ApprovePayment_PreOrder_Dto } from '../dto/preorder/approvePayment.dto';
import { Notification_Subscription_Dto } from '../dto/subscription/notification.dto';
import { UpdatePaymentMethod_Subscription_Dto } from '../dto/subscription/updatePaymentMethod.dto';

import { TokenManagerService } from '../services/tokenManager/tokenManager.service';
import { TransbankService } from '../services/transbank/transbank.service';
import { EventEmitter } from '../services/eventEmitter/eventEmitter.service';
import { EmailNotificationService } from '../services/emailNotificationService/emailNotification.service';
import { SubscriptionMongoRepository } from '../repository/subscription/subscription.mongo.repository';
import { SubscriptionUseCase } from '../../core/modules/subscription/application/subscription.usecase';
import { StockMongoRepository } from '../repository/stock/stock.mongo.reposirory';
import { StockUseCase } from '../../core/modules/stock/application/stock.usecase';
import { PreOrderMongoRepository } from '../repository/preorder/preoder.mongo.repository';
import { PreOrderUseCase } from '../../core/modules/preorder/application/preorder.usecase';

export const SQSController = async (event: SQSEventInput) => {
  const { action, body } = event;

  const tokenManagerService = new TokenManagerService();
  const transbankService = new TransbankService();
  const eventEmitter = new EventEmitter();
  const emailNotificationService = new EmailNotificationService();

  const subscriptionRepository = new SubscriptionMongoRepository();
  const subscriptionUseCase = new SubscriptionUseCase(
    subscriptionRepository,
    tokenManagerService,
    transbankService,
    eventEmitter,
    emailNotificationService
  );

  const stockRepository = new StockMongoRepository();
  const stockUseCase = new StockUseCase(stockRepository);

  const preOrderRepository = new PreOrderMongoRepository();
  const preOrderUseCase = new PreOrderUseCase(preOrderRepository, stockUseCase, emailNotificationService, eventEmitter);

  if (action === 'crear-suscripcion') {
    const { message, status } = Create_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.createSubscription(body);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'cobrar-suscripcion') {
    const { message, status } = Charge_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.generateCharge(body.id, body.responsible);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'crear-preordenes-suscripcion') {
    const response = await preOrderUseCase.createManyPreOrders(body);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'aprobar-pago-preorden') {
    const { message, status } = ApprovePayment_PreOrder_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await preOrderUseCase.approvePreorderPayment(body.orderId, body.successAttempt);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'notificar-suscripcion-creada') {
    const { message, status } = Notification_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.sendNotificationPaymentReceived(body.id);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'notificar-cobro-suscripcion') {
    const { message, status } = Notification_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.sendNotificationSuccessPayment(body.id);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'notificar-fallo-cobro-suscripcion') {
    const { message, status } = Notification_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.sendNotificationFailedPayment(body.id);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'notificar-suscripcion-cancelada') {
    const { message, status } = Notification_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.sendNotificationLastFailedPayment(body.id);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  if (action === 'actualizar-metodo-pago-suscripcion') {
    const { message, status } = UpdatePaymentMethod_Subscription_Dto(body);
    if (!status) {
      console.log('Error en Dto: ', JSON.stringify({ message }, null, 2));
      throw new Error(message);
    }

    const response = await subscriptionUseCase.updatePaymentMethod(body);
    return { statusCode: response.status, body: JSON.stringify({ message: response.message, data: response.data }) };
  }

  return { statusCode: 200, body: JSON.stringify(event) };
};
