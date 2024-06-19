import {
  Attempt,
  AttemptResponsible,
  ShipmentSchedule,
  SubscriptionEntity,
} from '../../../core/modules/subscription/domain/subscription.entity';

export interface ITransbankService {
  authorizeTransaction: (params: authorizeTransactionParams) => Promise<Attempt>;
}

export interface authorizeTransactionParams {
  currentShipmentSchedule: ShipmentSchedule;
  responsible: AttemptResponsible;
  subscription: SubscriptionEntity;
  token: string;
}

export interface AuthorizeResponse {
  accounting_date: string;
  buy_order: string;
  card_detail: {
    card_number: string;
  };
  details: Array<{
    amount: number;
    authorization_code: string;
    buy_order: string;
    commerce_code: string;
    installments_number: number;
    payment_type_code: PaymentType;
    response_code: 0 | -1 | -2 | -3 | -4 | -5 | -96 | -97 | -98 | -99;
    status: 'INITIALIZED' | 'AUTHORIZED' | 'REVERSED' | 'FAILED' | 'NULLIFIED' | 'PARTIALLY_NULLIFIED' | 'CAPTURED';
  }>;
  transaction_date: string;
}

export type PaymentType = 'VD' | 'VP' | 'VN' | 'VC' | 'SI' | 'S2' | 'NC';
