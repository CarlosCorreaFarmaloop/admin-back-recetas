import { CreateSubscriptionParams, SubscriptionVO } from '../domain/subscription.vo';
import { ApiResponse, HttpCodes } from './api.response';
import { ISubscriptionUseCase, ApproveSubscription, RejectSubscription } from './subscription.usecase.interface';
import {
  AttemptResponsible,
  Delivery,
  GeneralStatus,
  Prescription,
  ShipmentSchedule,
  SubscriptionEntity,
} from '../domain/subscription.entity';
import { SubscriptionRepository } from '../domain/subscription.repository';
import { ITokenManagerService } from '../../../../infra/services/tokenManager/interface';
import { ITransbankService } from '../../../../infra/services/transbank/interface';
import { IEventEmitter } from '../../../../infra/services/eventEmitter/interface';
import { IEmailNotificationService } from '../../../../infra/services/emailNotificationService/interface';

export class SubscriptionUseCase implements ISubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly tokenManagerService: ITokenManagerService,
    private readonly transbankService: ITransbankService,
    private readonly eventEmitter: IEventEmitter,
    private readonly emailNotificationService: IEmailNotificationService
  ) {}

  async createSubscription(payload: CreateSubscriptionParams) {
    console.log('Enters createSubscription(): ', JSON.stringify(payload, null, 2));

    const newSubscription = new SubscriptionVO().create(payload);
    const subscriptionDb = await this.subscriptionRepository.create(newSubscription);

    await this.eventEmitter.sendNotificationToCustomer({ action: 'notificar-suscripcion-creada', id: subscriptionDb.id });

    console.log('Subscription created: ', JSON.stringify(subscriptionDb, null, 2));
    return { data: true, message: 'Subscription successfully created.', status: HttpCodes.OK };
  }

  async approveSubscription(payload: ApproveSubscription) {
    console.log('Enters approveSubscription(): ', JSON.stringify({ payload }, null, 2));

    const { id, responsible } = payload;

    const subscriptionDB = await this.subscriptionRepository.get(id);
    if (!subscriptionDB) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDB, 'La suscripcion no existe.');
    }

    this.validateApproveSuscription(subscriptionDB);

    const newSubscription = new SubscriptionVO().approve(subscriptionDB.trackingGeneralStatus, responsible);
    const updatedSubscription = await this.subscriptionRepository.update(id, newSubscription);

    await this.eventEmitter.generateSubscriptionPreOrders(updatedSubscription);
    await this.eventEmitter.syncEcommerceSubscription(id, newSubscription);
    await this.eventEmitter.generateSubscriptionCharge(id, 'Sistema');

    console.log('Subscription approved: ', JSON.stringify(updatedSubscription, null, 2));
    return { data: updatedSubscription, message: 'Subscription successfully approved.', status: HttpCodes.OK };
  }

  async rejectSubscription(payload: RejectSubscription) {
    console.log('Enters rejectSubscription(): ', JSON.stringify({ payload }, null, 2));

    const { id, observation, responsible } = payload;

    const subscriptionDB = await this.subscriptionRepository.get(id);
    if (!subscriptionDB) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDB, 'La suscripcion no existe.');
    }

    this.validateRejectSuscription(subscriptionDB);

    const newSubscription = new SubscriptionVO().reject(
      subscriptionDB.trackingGeneralStatus,
      subscriptionDB.trackingProgressStatus,
      responsible,
      observation
    );
    const updatedSubscription = await this.subscriptionRepository.update(id, newSubscription);

    console.log('Subscription rejected: ', JSON.stringify(updatedSubscription, null, 2));
    return { data: updatedSubscription, message: 'Subscription successfully rejected.', status: HttpCodes.OK };
  }

  async generateCharge(id: string, responsible: AttemptResponsible) {
    console.log('Enters generateCharge(): ', id);

    const subscriptionDb = await this.subscriptionRepository.get(id);

    this.validateChargeSubscripton(subscriptionDb);
    const currentShipmentSchedule = this.searchCurrentShipmentSchedule(subscriptionDb);

    const token = await this.tokenManagerService.getToken(subscriptionDb.currentPaymentId);
    const newAttempt = await this.transbankService.authorizeTransaction({
      currentShipmentSchedule,
      responsible,
      subscription: subscriptionDb,
      token,
    });

    const subscriptionVO = new SubscriptionVO();

    const isLastAttempt = this.validateIsLastAttempt(subscriptionDb);
    if (newAttempt.status === 'Failed' && isLastAttempt) {
      const subscriptionToUpdate = subscriptionVO.updateSubscriptionChargeFailedLastAttempt(subscriptionDb, newAttempt);
      const updatedSubscription = await this.subscriptionRepository.update(id, subscriptionToUpdate);
      await this.eventEmitter.sendNotificationToCustomer({ action: 'notificar-suscripcion-cancelada', id });
      await this.eventEmitter.syncEcommerceSubscription(id, subscriptionToUpdate);

      console.log('Ultimo intento de cobro de suscripcion fallo: ', JSON.stringify(updatedSubscription, null, 2));
      return { data: true, message: 'Ok.', status: HttpCodes.OK };
    }

    if (newAttempt.status === 'Failed') {
      const subscriptionToUpdate = subscriptionVO.updateSubscriptionChargeFailed(subscriptionDb, newAttempt);
      const updatedSubscription = await this.subscriptionRepository.update(id, subscriptionToUpdate);
      await this.eventEmitter.sendNotificationToCustomer({ action: 'notificar-fallo-cobro-suscripcion', id });
      await this.eventEmitter.syncEcommerceSubscription(id, subscriptionToUpdate);

      console.log('Intento de cobro fallo: ', JSON.stringify(updatedSubscription, null, 2));
      return { data: true, message: 'Ok.', status: HttpCodes.OK };
    }

    const isLastCharge = this.validateIsLastCharge(subscriptionDb);
    if (isLastCharge) {
      const subscriptionToUpdate = subscriptionVO.completeSubscription(subscriptionDb, newAttempt);
      const updatedSubscription = await this.subscriptionRepository.update(id, subscriptionToUpdate);
      await this.eventEmitter.sendNotificationToCustomer({ action: 'notificar-cobro-suscripcion', id });
      await this.eventEmitter.syncEcommerceSubscription(id, subscriptionToUpdate);

      console.log('Ultimo cobro realizo: ', JSON.stringify(updatedSubscription, null, 2));
      return { data: true, message: 'Ok.', status: HttpCodes.OK };
    }

    const subscriptionToUpdate = subscriptionVO.updateSubscriptionChargeSuccess(subscriptionDb, newAttempt);
    const updatedSubscription = await this.subscriptionRepository.update(id, subscriptionToUpdate);
    await this.eventEmitter.approvePreorderPayment({ orderId: currentShipmentSchedule.orderId, successAttempt: newAttempt });
    await this.eventEmitter.sendNotificationToCustomer({ action: 'notificar-cobro-suscripcion', id });
    await this.eventEmitter.syncEcommerceSubscription(id, subscriptionToUpdate);

    console.log('Cobro de suscripcion generado: ', JSON.stringify(updatedSubscription, null, 2));
    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  async getAllSubscriptions() {
    const response = await this.subscriptionRepository.getAll();
    return { data: response, message: 'Successfully obtained subscriptions.', status: HttpCodes.OK };
  }

  async getSubscriptionByGeneralStatus(generalStatus: GeneralStatus) {
    const response = await this.subscriptionRepository.getByGeneralStatus(generalStatus);
    return { data: response, message: 'Successfully obtained subscriptions.', status: HttpCodes.OK };
  }

  async updateDelivery(id: string, deliveryToUpdate: Omit<Delivery, 'discount' | 'price' | 'pricePaid'>) {
    const response = await this.subscriptionRepository.updateDelivery(id, deliveryToUpdate);
    return { data: response, message: 'Subscription delivery successfully updated.', status: HttpCodes.OK };
  }

  async updatePrescription(id: string, sku: string, toUpdate: Pick<Prescription, 'file' | 'state' | 'validation'>) {
    console.log('Enter updatePrescription(): ', JSON.stringify({ id, sku, toUpdate }, null, 2));

    const response = await this.subscriptionRepository.updateProductPrescription(id, sku, toUpdate);

    console.log('Product prescription updated: ', JSON.stringify(response, null, 2));
    return { data: response, message: 'Product prescription successfully updated.', status: HttpCodes.OK };
  }

  private searchCurrentShipmentSchedule(subscription: SubscriptionEntity): ShipmentSchedule {
    const shipmentSchedule = subscription.shipment.shipmentSchedule.find((el) => el.id === subscription.currentShipmentId);

    if (!shipmentSchedule) {
      throw new Error(`Shipment Schedule not found: ${subscription.id}.`);
    }

    return shipmentSchedule;
  }

  private validateApproveSuscription(subscription: SubscriptionEntity): void {
    const { generalStatus, paymentStatus, products, progressStatus } = subscription;

    if (generalStatus !== 'In Review') {
      throw new Error(`Incorrect subscription generalStatus: ${subscription.id}`);
    }

    if (paymentStatus !== 'Paid') {
      throw new Error(`Incorrect subscription paymentStatus: ${subscription.id}`);
    }

    if (progressStatus !== 'In Progress') {
      throw new Error(`Incorrect subscription progressStatus: ${subscription.id}`);
    }

    const isInvalid = products.some(
      (el) =>
        (el.requiresPrescription && !el.prescription.file) ||
        (el.requiresPrescription && el.prescription.state === 'Pending') ||
        (el.requiresPrescription && el.prescription.state === 'Rejected') ||
        (el.requiresPrescription && el.prescription.state === 'Approved_With_Comments' && !el.prescription.validation.comments)
    );
    if (isInvalid) {
      throw new Error(`Incorrect prescriptions for subscription products: ${subscription.id}`);
    }
  }

  private validateRejectSuscription(subscription: SubscriptionEntity): void {
    const { generalStatus, paymentStatus, progressStatus } = subscription;

    if (generalStatus !== 'In Review') {
      throw new Error(`Incorrect subscription generalStatus: ${subscription.id}`);
    }

    if (paymentStatus !== 'Paid') {
      throw new Error(`Incorrect subscription paymentStatus: ${subscription.id}`);
    }
    if (progressStatus !== 'In Progress') {
      throw new Error(`Incorrect subscription progressStatus: ${subscription.id}`);
    }
  }

  private validateChargeSubscripton(subscription: SubscriptionEntity): void {
    const { generalStatus, paymentStatus, progressStatus, paymentMethods, shipment } = subscription;

    if (generalStatus !== 'Approved') {
      throw new Error(`Incorrect subscription generalStatus: ${subscription.id}`);
    }

    if (paymentStatus !== 'Paid') {
      throw new Error(`Incorrect subscription paymentStatus: ${subscription.id}`);
    }

    if (progressStatus !== 'In Progress') {
      throw new Error(`Incorrect subscription progressStatus: ${subscription.id}`);
    }

    const activePaymentMethod = paymentMethods.some((el) => el.status === 1);
    if (!activePaymentMethod) {
      throw new Error(`Incorrect subscription, no active payment method found: ${subscription.id}`);
    }

    if (shipment.quantityShipped >= shipment.numberOfShipments) {
      throw new Error(`Incorrect subscription, shipment quantity exceeded: ${subscription.id}`);
    }
  }

  private validateIsLastCharge(subscription: SubscriptionEntity) {
    const { currentShipmentId, shipment } = subscription;
    return currentShipmentId === shipment.shipmentSchedule[shipment.shipmentSchedule.length - 1].id;
  }

  private validateIsLastAttempt(subscription: SubscriptionEntity): boolean {
    const { currentShipmentId, shipment } = subscription;

    const currentShipmentSchedule = shipment.shipmentSchedule.find((el) => el.id === currentShipmentId);
    if (!currentShipmentSchedule) {
      console.log('Shipment Schedule does not exist: ', JSON.stringify(subscription, null, 2));
      throw new Error('Shipment Schedule does not exist.');
    }

    return currentShipmentSchedule.maxAttempts === currentShipmentSchedule.numberOfAttempts + 1;
  }

  async sendNotificationPaymentReceived(id: string) {
    console.log('Enters sendNotificationPaymentReceived(): ', id);

    const subscriptionDb = await this.subscriptionRepository.get(id);

    await this.emailNotificationService.sendHTMLNotification({
      html: this.generatePaymentReceivedHTMLNotification(subscriptionDb),
      recipients: [subscriptionDb.customer],
      source: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
      subject: 'Suscripción creada',
    });

    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  private generatePaymentReceivedHTMLNotification(subscription: SubscriptionEntity): string {
    const { delivery, discount, nextPaymentDate, id, paymentMethods, products, resume } = subscription;

    const date = new Date(nextPaymentDate);
    const paymentDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const paymentMethod = paymentMethods[0];

    const html = `
      <html>
        <body style="background-color: #F5F8FD; width:95%; height: 100%; display: inline-block; margin: 0px auto;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;color: #4c4c4c; letter-spacing: 0.00938em;">
          <div id="desktop" style="display:block; color:#000; background:#fff; border: 0px solid #000; width:95%; max-width: 600px; margin:auto; margin-top: 0px auto; padding: 20px; border-radius: 0px;text-align: center;">
            <div style="text-align:center; margin: auto; margin-top: 30px; margin-bottom: 30px;">
              <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="100px">
            </div>
            
            <div style="text-align:center; margin: auto; color: #2F6CDB; letter-spacing: 0.00938em;font-size: 1.25rem;font-weight: 700;font-family: 'Roboto','Helvetica','Arial',sans-serif">
              ¡Hola ${delivery.fullName}!<br>Tu suscripción fue creada con éxito<br>
            </div>
            
            <div id="a" style="float: left; text-align: left;font-family: 'Roboto','Helvetica','Arial',sans-serif;padding:0px; width: 90%;margin:auto; margin-top:20px; margin-bottom:20px;border: 0px solid; padding: 0px;color: #4c4c4c;">
              <b>Suscripción:</b> ${id}
            </div>

            <div style="text-align:left; margin: auto; margin-top: 50px; color: #4c4c4c; letter-spacing: 0.00938em;font-size: 16px;font-weight: 700;font-family: 'Roboto','Helvetica','Arial',sans-serif; height: 30px;">
              Resumen de compra
            </div>
        
            ${products
              .map(
                (el) => `
                <div id="a" style="float: center;width: 100%;margin:0px; margin-top:5px;border: 1px solid #9FBAEC; border-radius: 15px;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;">
                  <section style="width: 100%;display: flex;align-items: stretch;justify-content: center;margin: 0 0 0 0; padding: 0px">
                    <div id="b" style="float: center;width:20%; margin: 5px;border: 0px solid;">
                      <img src="${el.photoURL}" width="100%">
                    </div>
                    <div id="a" style="float: center; text-align: left;padding:0px; width: 80%;margin:0px;border: 0px solid;">
                      <p><b>${el.fullName}</b></p>
                      <p>Cantidad: ${el.quantity}<p>
                      <p>Precio: <span>$ ${el.pricePaidPerUnit.toLocaleString('es-CL')}</span></p>
                    </div>
                  </section>
                </div>
              `
              )
              .join('')}

            <div style="float: center;width: 95%;margin:auto;border: 0px solid #1a1a1a; border-radius: 15px;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;color: #4c4c4c; letter-spacing: 0.00938em;">
              <section style="width: 100%;display: flex;align-items: stretch;justify-content: center;margin: 0 0 0 0; padding: 0px">
                <div id="b" style="float: center;width:70%; margin: 0px;border: 0px solid;text-align: left; padding: 10px;">
                  Subtotal<br>
                  Envío<br>
                  ${discount.total > 0 ? `Descuento: (${discount.details[0].promotionCode}})<br><br>` : `<br>`}
                  <b style="font-size: 14px;">TOTAL</b>
                </div>
                <div id="a" style="float: center; text-align: right;padding:0px; width: 30%;margin:0px;border: 0px solid; padding: 10px;">
                  $ ${resume.subtotal.toLocaleString('es-CL')}<br>
                  $ ${resume.deliveryPrice.toLocaleString('es-CL')}<br>
                  ${discount.total > 0 ? `$ -${discount.total.toLocaleString('es-CL')}<br><br>` : `<br>`}
                  <b style="font-size: 14px;">$ ${resume.total.toLocaleString('es-CL')}</b><br>
                </div>
              </section>
            </div>

            <div style="text-align:left; margin: auto; margin-top: 30px; color: #4c4c4c; letter-spacing: 0.00938em;font-size: 16px;font-weight: 700;font-family: 'Roboto','Helvetica','Arial',sans-serif; height: 30px;">
              Información de envío
            </div>
            <div id="a" style="float: center; text-align: left;padding:0px; width: 90%;margin:auto;border: 0px solid; padding: 10px;color: #4c4c4c;">
              Nombre: <b>${delivery.fullName}</b><br>
              Dirección: ${this.generateFullAddress(delivery)}<br>
              Teléfono de contacto: ${delivery.phone}<br>
            </div>

            <div style="text-align:left; margin: auto; margin-top: 5px; color: #4c4c4c; letter-spacing: 0.00938em;font-size: 16px;font-weight: 700;font-family: 'Roboto','Helvetica','Arial',sans-serif; height: 30px;">
              Información de pago
            </div>
            <div id="a" style="float: center; text-align: left;padding:0px; width: 90%;margin:auto;border: 0px solid; padding: 10px;color: #4c4c4c;">
              Según lo suscrito con <b>Farmaloop</b>, se debitará el primer pago el día <b>${paymentDate}</b> el monto de <b> $${resume.total.toLocaleString(
                'es-CL'
              )}
              </b> con cargo a la tarjeta terminada en <b>${paymentMethod.cardNumber.slice(-4)}</b> a través del operador <b>Transbank</b>.
            </div>
        
            <a href='https://www.farmaloop.cl/?utm_source=gmail&utm_medium=email&utm_campaign=suscripciones' target='_blank' style="text-decoration:none">
              <div id="a" style="float: center; text-align: center;padding:0px; width: 90%;margin:auto; margin-top:30px;border: 0px solid; padding: 10px;color: #4c4c4c;">
                <div style="width: 150px; padding: 15px; margin: auto; border-radius: 50px; color: #fff; background: #2F6CDB;">
                  Volver a la tienda
                </div>
              </div>
            </a>

            <div id="a" style="float: center; text-align: center;padding:0px; width: 90%;margin:auto; margin-top:30px;border: 0px solid; padding: 10px;color: #4c4c4c;">
              <p>Con cariño<br><br><span style="font-weight: bold;">Equipo<br>FARMALOOP</span></p>
            </div>

          </div>
        </body>
      </html>
    `;

    return html;
  }

  async sendNotificationFailedPayment(id: string) {
    console.log('Enters sendNotificationFailedPayment(): ', id);

    const subscriptionDb = await this.subscriptionRepository.get(id);

    await this.emailNotificationService.sendHTMLNotification({
      html: this.generateHTMLNotificationOfFailedPayment(subscriptionDb),
      recipients: [subscriptionDb.customer],
      source: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
      subject: 'Hubo un error con el pago de tu suscripción',
    });

    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  private generateHTMLNotificationOfFailedPayment(subscription: SubscriptionEntity): string {
    const { delivery, id, paymentMethods, resume } = subscription;

    const currentShipmentSchedule = this.searchCurrentShipmentSchedule(subscription);
    const paymentMethod = paymentMethods[0];

    const ecommUrl = process.env.ENV === 'PROD' ? 'https://farmaloop.cl' : 'https://ecomm-qa.fc.farmaloop.cl';
    const token = currentShipmentSchedule.id;

    const html = `
      <html>
        <body style="background-color: #F5F8FD; width:95%; height: 100%; display: inline-block; margin: 0px auto;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;color: #4c4c4c;">
          <div style="width: 95%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
      
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="text-align: center;">
                  <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="100px" alt="Farmaloop Logo">
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="text-align: center;">
                  <h1 style="font-family: 'Roboto','Helvetica','Arial',sans-serif; font-size: 24px; font-weight: 600; margin: 0; color: #FF3131">
                    No pudimos procesar tu pago...
                  </h1>
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif; text-align: left; font-size: 16px;">
                  <p style="margin: 0; margin-bottom: 8px;">¡Hola ${delivery.fullName}!</p>
                  <p style="margin: 0;">
                    Te escribimos para comunicarte que hubo un error al procesar tu pago. Intentaremos realizar un cobro nuevamente mañana. Por favor, verifica que tu tarjeta tenga fondos suficientes para el monto de <b>$${resume.total.toLocaleString(
                      'es-CL'
                    )}</b>. Si deseas, puedes actualizar tu forma de pago o reintentar inmediatamente realizar tu pago.
                  </p>
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="text-align: center;">
                  <a href="${ecommUrl}/suscripcion/reintentar-cobro/?token=${token}&id=${id}" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px; margin-bottom: 10px;">
                    <div style="padding: 10px 0; background-color: #FF3131; color: #ffffff; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
                      Reintentar pago
                    </div>
                  </a>
                  <a href="${ecommUrl}/suscripcion/" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px;">
                    <div style="padding: 10px 0; background-color: transparent; color: #FF3131; border: 1px solid #FF3131; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
                      Actualizar forma de pago
                    </div>
                  </a>
                </td>
              </tr>
            </table>

            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f4ff; padding: 12px 36px; border-radius: 8px; text-align: left; margin-bottom: 30px;">
              <tr>
                <td style="margin: 0 auto; border-right: 1px solid #ccc; text-align: center; vertical-align: middle;">
                  <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Número de suscripción</span><br>
                  <span style="font-size: 14px; color: #000;">${id}</span>
                </td>
                <td style="margin: 0 auto; text-align: center; vertical-align: middle;">
                  <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Forma de pago actual</span><br>
                  <span style="font-size: 14px; color: #000;">•••• •••• •••• ${paymentMethod.cardNumber.slice(-4)}</span>
                </td>
              </tr>
            </table>

            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif;">
                  <p style="font-size: 18px; font-weight: 700; margin: 0; text-align: center; margin-bottom: 12px;">
                    ¿Necesitas ayuda?
                  </p>
                  <p style="margin: 0; font-size: 16px; text-align: left; margin-bottom: 30px;">
                    ¡Nuestros asesores pueden ayudarte! Contáctanos por WhatsApp de lunes a viernes de 09:00 a 18:30 hs.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="text-align: center;">
                  <a href="https://api.whatsapp.com/send?phone=56975199387" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px;">
                    <div style="padding: 8px 0; background-color: transparent; color: #000000; border: 1px solid #60D669; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/estaticos-ecommerce/whatsapp-icon.png" alt="whatsapp-icon" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 4px;" />
                      <span style="vertical-align: middle;">Contáctanos</span>
                    </div>
                  </a>      
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="text-align: center;">
                  <p style="font-size: 16px; margin: 0; margin-bottom: 12px">¡Muchas gracias!</p>
                  <p style="font-size: 16px; margin: 0;">Equipo de <b>Farmaloop</b></p>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  async sendNotificationLastFailedPayment(id: string) {
    console.log('Enters sendNotificationLastFailedPayment(): ', id);

    const subscriptionDb = await this.subscriptionRepository.get(id);

    await this.emailNotificationService.sendHTMLNotification({
      html: this.generateHTMLNotificationOfLastFailedPayment(subscriptionDb),
      recipients: [subscriptionDb.customer],
      source: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
      subject: 'Cancelamos tu suscripción',
    });

    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  private generateHTMLNotificationOfLastFailedPayment(subscription: SubscriptionEntity): string {
    const { delivery, id, paymentMethods } = subscription;

    const paymentMethod = paymentMethods[0];

    const html = `
      <html>
        <body style="background-color: #F5F8FD; width:95%; height: 100%; display: inline-block; margin: 0px auto;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;color: #4c4c4c;">
          <div style="width: 95%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
      
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="text-align: center;">
                  <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="100px" alt="Farmaloop Logo">
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="text-align: center;">
                  <h1 style="font-family: 'Roboto','Helvetica','Arial',sans-serif; font-size: 24px; font-weight: 600; margin: 0; color: #3753FF">
                    Tu suscripción fue cancelada
                  </h1>
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif; text-align: left; font-size: 16px;">
                  <p style="margin: 0; margin-bottom: 8px;">¡Hola ${delivery.fullName}!</p>
                  <p style="margin: 0;">
                    Te escribimos para comunicarte que tu suscripción fue cancelada debido a que no pudimos realizar el cobro. 
                    Hemos agotado todos los intentos posibles.
                  </p>
                </td>
              </tr>
            </table>

            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f4ff; padding: 12px 36px; border-radius: 8px; text-align: left; margin-bottom: 30px;">
              <tr>
                <td style="margin: 0 auto; border-right: 1px solid #ccc; text-align: center; vertical-align: middle;">
                  <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Número de suscripción</span><br>
                  <span style="font-size: 14px; color: #000;">${id}</span>
                </td>
                <td style="margin: 0 auto; text-align: center; vertical-align: middle;">
                  <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Forma de pago actual</span><br>
                  <span style="font-size: 14px; color: #000;">•••• •••• •••• ${paymentMethod.cardNumber.slice(-4)}</span>
                </td>
              </tr>
            </table>

            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif;">
                  <p style="font-size: 18px; font-weight: 700; margin: 0; text-align: center; margin-bottom: 12px;">
                    ¿Necesitas ayuda?
                  </p>
                  <p style="margin: 0; font-size: 16px; text-align: left; margin-bottom: 30px;">
                    ¡Nuestros asesores pueden ayudarte! Contáctanos por WhatsApp de lunes a viernes de 09:00 a 18:30 hs.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="text-align: center;">
                  <a href="https://api.whatsapp.com/send?phone=56975199387" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px;">
                    <div style="padding: 8px 0; background-color: transparent; color: #000000; border: 1px solid #60D669; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/estaticos-ecommerce/whatsapp-icon.png" alt="whatsapp-icon" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 4px;" />
                      <span style="vertical-align: middle;">Contáctanos</span>
                    </div>
                  </a>      
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="text-align: center;">
                  <p style="font-size: 16px; margin: 0; margin-bottom: 12px">¡Muchas gracias!</p>
                  <p style="font-size: 16px; margin: 0;">Equipo de <b>Farmaloop</b></p>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  async sendNotificationSuccessPayment(id: string) {
    console.log('Enters sendNotificationSuccessPayment(): ', id);

    const subscriptionDb = await this.subscriptionRepository.get(id);

    await this.emailNotificationService.sendHTMLNotification({
      html: this.generateHTMLNotificationOfSuccessPayment(subscriptionDb),
      recipients: [subscriptionDb.customer],
      source: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
      subject: 'Cobro de suscripción',
    });

    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  private generateHTMLNotificationOfSuccessPayment(subscription: SubscriptionEntity): string {
    const { delivery, id, paymentMethods, resume } = subscription;

    const paymentMethod = paymentMethods[0];

    const html = `
      <html>
        <body style="background-color: #F5F8FD; width:95%; height: 100%; display: inline-block; margin: 0px auto;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;color: #4c4c4c;">
          <div style="width: 95%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
      
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="text-align: center;">
                  <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="100px" alt="Farmaloop Logo">
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="text-align: center;">
                  <h1 style="font-family: 'Roboto','Helvetica','Arial',sans-serif; font-size: 24px; font-weight: 600; margin: 0; color: #179421">
                    Tu cobro fue realizado con éxito
                  </h1>
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif; text-align: left; font-size: 16px;">
                  <p style="margin: 0; margin-bottom: 8px;">¡Hola ${delivery.fullName}!</p>
                  <p style="margin: 0;">
                    Tu cobro de <b>$${resume.total.toLocaleString('es-CL')}</b> fue exitoso.
                  </p>
                </td>
              </tr>
            </table>

            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f4ff; padding: 12px 36px; border-radius: 8px; text-align: left; margin-bottom: 30px;">
              <tr>
                <td style="margin: 0 auto; border-right: 1px solid #ccc; text-align: center; vertical-align: middle;">
                  <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Número de suscripción</span><br>
                  <span style="font-size: 14px; color: #000;">${id}</span>
                </td>
                <td style="margin: 0 auto; text-align: center; vertical-align: middle;">
                  <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Forma de pago actual</span><br>
                  <span style="font-size: 14px; color: #000;">•••• •••• •••• ${paymentMethod.cardNumber.slice(-4)}</span>
                </td>
              </tr>
            </table>

            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
              <tr>
                <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif;">
                  <p style="font-size: 18px; font-weight: 700; margin: 0; text-align: center; margin-bottom: 12px;">
                    ¿Necesitas ayuda?
                  </p>
                  <p style="margin: 0; font-size: 16px; text-align: left; margin-bottom: 30px;">
                    ¡Nuestros asesores pueden ayudarte! Contáctanos por WhatsApp de lunes a viernes de 09:00 a 18:30 hs.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="text-align: center;">
                  <a href="https://api.whatsapp.com/send?phone=56975199387" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px;">
                    <div style="padding: 8px 0; background-color: transparent; color: #000000; border: 1px solid #60D669; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/estaticos-ecommerce/whatsapp-icon.png" alt="whatsapp-icon" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 4px;" />
                      <span style="vertical-align: middle;">Contáctanos</span>
                    </div>
                  </a>      
                </td>
              </tr>
            </table>
  
            <table width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="text-align: center;">
                  <p style="font-size: 16px; margin: 0; margin-bottom: 12px">¡Muchas gracias!</p>
                  <p style="font-size: 16px; margin: 0;">Equipo de <b>Farmaloop</b></p>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  private generateFullAddress(delivery: Delivery): string {
    const { comuna, homeNumber, homeType, region, streetName, streetNumber } = delivery;

    return `${streetName} ${streetNumber}${homeType !== 'Casa' ? ` ${homeType} ${homeNumber}` : ''}, ${comuna}, ${region}.`;
  }

  async updatePaymentMethod(subscription: SubscriptionEntity) {
    const { id } = subscription;

    const subscriptionDB = await this.subscriptionRepository.get(id);
    if (!subscriptionDB) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, subscriptionDB, 'La suscripcion no existe.');
    }

    const newSubscription = new SubscriptionVO().updatePaymentMethod(subscription);
    const updatedSubscription = await this.subscriptionRepository.update(id, newSubscription);
    if (!updatedSubscription) {
      throw new ApiResponse(HttpCodes.BAD_REQUEST, updatedSubscription, 'Error al actualizar metodo de pago.');
    }

    const paymentDate = new Date(subscriptionDB.nextPaymentDate);
    const now = new Date();

    const isSameYear = paymentDate.getFullYear() === now.getFullYear();
    const isSameMonth = paymentDate.getMonth() === now.getMonth();

    if (isSameYear && isSameMonth) {
      await this.eventEmitter.generateSubscriptionCharge(id, 'Sistema');
    }

    return { data: true, message: 'Metodo de pago actualizado.', status: HttpCodes.OK };
  }
}
