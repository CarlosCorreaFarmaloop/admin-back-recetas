import { SubscriptionRepository } from '../domain/subscription.repository';
import { CreateSubscriptionPayload, SubscriptionVO } from '../domain/subscription.vo';
import { ApiResponse, HttpCodes } from './api.response';
import { ISubscriptionUseCase } from './subscription.usecase.interface';

export class SubscriptionUseCase implements ISubscriptionUseCase {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async createSubscription(payload: CreateSubscriptionPayload) {
    const newSubscription = new SubscriptionVO().create(payload);
    const subscriptionDb = await this.subscriptionRepository.create(newSubscription);
    if (!subscriptionDb) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDb, 'Error creating subscription.');
    }

    return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
  }
}
