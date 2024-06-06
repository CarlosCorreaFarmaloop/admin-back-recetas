import { SubscriptionRepository } from '../domain/subscription.repository';
import { CreateSubscriptionPayload, SubscriptionVO } from '../domain/subscription.vo';
import { ApiResponse, HttpCodes } from './api.response';
import { ISubscriptionUseCase } from './subscription.usecase.interface';

export class SubscriptionUseCase implements ISubscriptionUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async createSubscription(payload: CreateSubscriptionPayload) {
    console.log('Ingresa suscripcion a crear: ', JSON.stringify(payload, null, 2));

    const newSubscription = new SubscriptionVO().create(payload);
    const subscriptionDb = await this.subscriptionRepository.create(newSubscription);
    if (!subscriptionDb) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Error creating subscription.');
    }

    console.log('Suscripcion creada: ', JSON.stringify(subscriptionDb, null, 2));

    return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
  }
}
