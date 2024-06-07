import {
  Options,
  Oneclick,
  IntegrationCommerceCodes,
  IntegrationApiKeys,
  Environment,
  TransactionDetail,
} from 'transbank-sdk';
import MallTransaction from 'transbank-sdk/dist/es5/transbank/webpay/oneclick/mall_transaction';

import { AuthorizeResponse, ITransbankService, PaymentType } from './interface';
import { Attempt, SubscriptionEntity } from '../../../core/modules/subscription/domain/subscription.entity';

export class TransbankService implements ITransbankService {
  private readonly mallInscription: MallTransaction;
  private readonly isProd = process.env.ENV === 'PROD';

  constructor() {
    this.mallInscription = new Oneclick.MallTransaction(
      new Options(
        IntegrationCommerceCodes.ONECLICK_MALL,
        IntegrationApiKeys.WEBPAY,
        this.isProd ? Environment.Production : Environment.Integration
      )
    );
  }

  async authorizeTransaction(token: string, orderId: string, subscription: SubscriptionEntity) {
    try {
      const { delivery, resume } = subscription;

      const details = [new TransactionDetail(resume.total, IntegrationCommerceCodes.ONECLICK_MALL, orderId)];

      const response: AuthorizeResponse = await this.mallInscription.authorize(
        delivery.fullName,
        token,
        orderId,
        details
      );

      return this.generateAttempt(response);
    } catch (error) {
      const err = error as Error;
      console.log(`Error al autorizar cobro de orden ${orderId}: `, JSON.stringify(err.message, null, 2));
      throw new Error(`Error al autorizar cobro de orden ${orderId}.`);
    }
  }

  private generateAttempt(response: AuthorizeResponse): Attempt {
    return {
      cardNumber: response.card_detail.card_number,
      externalCode: String(response.details[0].response_code),
      externalMessage: this.generateTransbankMessage(response.details[0].response_code),
      externalStatus: response.details[0].status,
      paymentMethod: this.generateTransbankPaymentType(response.details[0].payment_type_code),
      status: response.details[0].response_code === 0 ? 'Success' : 'Failed',
      transactionDate: new Date().getTime(),
    };
  }

  private generateTransbankMessage(authorizationCode: number): string {
    if (authorizationCode === 0) return 'Transacción aprobada';
    if (authorizationCode === -1) return 'Tarjeta inválida';
    if (authorizationCode === -2) return 'Error de conexión';
    if (authorizationCode === -3) return 'Excede monto máximo';
    if (authorizationCode === -4) return 'Fecha de expiración inválida';
    if (authorizationCode === -5) return 'Problema en autenticación';
    if (authorizationCode === -6) return 'Rechazo general';
    if (authorizationCode === -7) return 'Tarjeta bloqueada';
    if (authorizationCode === -8) return 'Tarjeta vencida';
    if (authorizationCode === -9) return 'Transacción no soportada';
    if (authorizationCode === -10) return 'Problema en la transacción';
    if (authorizationCode === -11) return 'Excede límite de reintentos de rechazos';
    if (authorizationCode === -96) return 'Token no existente';
    if (authorizationCode === -97) return 'Máximo monto diario de pago excedido';
    if (authorizationCode === -98) return 'Máximo monto de pago excedido';
    if (authorizationCode === -99) return 'Máxima cantidad de pagos diarios excedido';
    return 'Error desconocido';
  }

  private generateTransbankPaymentType(payment_type_code: PaymentType): string {
    if (payment_type_code === 'VD') return 'Venta Débito';
    if (payment_type_code === 'VP') return 'Venta prepago';
    if (payment_type_code === 'VN') return 'Venta Normal';
    if (payment_type_code === 'VC') return 'Venta en cuotas';
    if (payment_type_code === 'SI') return '3 cuotas sin interés';
    if (payment_type_code === 'S2') return '2 cuotas sin interés';
    if (payment_type_code === 'NC') return 'N Cuotas sin interés';
    return 'Pago desconocido';
  }
}
