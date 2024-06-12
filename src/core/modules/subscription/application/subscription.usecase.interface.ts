import { Delivery, GeneralStatus, Prescription, SubscriptionEntity } from '../domain/subscription.entity';
import { CreateSubscriptionPayload } from '../domain/subscription.vo';
import { Respuesta } from './api.response';

export interface ISubscriptionUseCase {
  createSubscription: (payload: CreateSubscriptionPayload) => Promise<Respuesta<boolean>>;
  generateCharge: (id: string) => Promise<Respuesta<boolean>>;
  getSubscriptionByGeneralStatus: (generalStatus: GeneralStatus) => Promise<Respuesta<SubscriptionEntity[]>>;
  updateDelivery: (
    id: string,
    toUpdate: Omit<Delivery, 'discount' | 'price' | 'pricePaid'>
  ) => Promise<Respuesta<SubscriptionEntity>>;
  updatePrescription: (
    id: string,
    sku: string,
    toUpdate: Pick<Prescription, 'file' | 'state' | 'validation'>
  ) => Promise<Respuesta<SubscriptionEntity>>;
  approveSubscription: (payload: ApproveSubscription) => Promise<Respuesta<SubscriptionEntity>>;
  rejectSubscription: (payload: RejectSubscription) => Promise<Respuesta<SubscriptionEntity>>;
}

export interface ApproveSubscription {
  id: string;
  responsible: string;
}

export interface RejectSubscription {
  id: string;
  observation: string;
  responsible: string;
}
