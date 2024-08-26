import { HttpCodes } from './api.response';

import { INotificacionUseCase } from './notificacion.usecase.interface';
import { IEmailService } from '../../../../infra/services/emailService/interface';
import { OrdenEntity } from '../../orden/domain/orden.entity';
import { IOrdenUseCase } from '../../orden/application/orden.usecase.interface';

export class NotificacionUseCase implements INotificacionUseCase {
  constructor(
    private readonly ordenUseCase: IOrdenUseCase,
    private readonly emailService: IEmailService
  ) {}

  async notificarRecompraPacientesCronicos(id: string) {
    console.log('Entra notificarRecompraPacientesCronicos(): ', id);

    const orden = (await this.ordenUseCase.obtenerOrdenPorId(id)).data;

    await this.emailService.enviarNotificacionHTML({
      asunto: 'Re-Compra Cliente',
      destinatarios: [orden.customer],
      fuente: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
      html: this.generarHTMLRecompraPacientesCronicos(orden),
    });

    return { data: true, message: 'Ok.', status: HttpCodes.OK };
  }

  private generarHTMLRecompraPacientesCronicos(orden: OrdenEntity): string {
    const { delivery, resumeOrder } = orden;
    const { firstName: nombre_cliente } = delivery.delivery_address;
    const { cartId: id_carrito } = resumeOrder;

    const html = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
        </head>

        <body style="background-color: #ffffff; width:95%; height: 100%; display: inline-block; margin: 0px auto; font-family: 'Poppins',sans-serif; justify-content: center; color: #000000;>
          <div style="display:block; color:#000; background:#fff; width:100%; max-width: 600px; margin:auto; margin-top: 0px auto; text-align: center;">
            <div style="text-align: center; margin: auto; margin-top: 30px;">
              <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="64px" height="auto">
            </div>

            <div style="text-align: center; margin: auto; margin-top: 16px;">
              <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/anticonceptivos.png" width="450px" height="auto">
            </div>

            <div style="text-align:center; margin: auto; margin-top: 24px;">
              <h1 style="font-size: 22px; font-weight: 500; margin: 0; font-family: 'Poppins',sans-serif;">
                ${nombre_cliente.split(' ')[0]}, Continúa tu tratamiento de
              </h1>
              <h1 style="font-size: 22px; font-weight: 500; margin: 0; color: #0B8E36; font-family: 'Poppins',sans-serif;">
                Hipertensión
              </h1>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 28px;">
              <p style="font-size: 14px; font-weight: 600;">
                ¡Recibe hoy mismo con ENVÍO GRATIS!
              </p>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 36px;">
              <a href="https://ecomm-qa.fc.farmaloop.cl/check-out/?share=${id_carrito}" style="background-color: #3753FF; color: #ffffff; padding: 10px 20px; text-decoration: none; font-size: 18px; font-weight: 500; border-radius: 4px; display: inline-block;">
                COMPRA AQUÍ
                <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/click.png" alt="Icono" style="vertical-align: middle; width: 18px; height: 18px; margin-left: 6px;">
              </a>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 72px;">
              <p style="font-size: 12px; font-weight: 400; margin: 0">
                Comprando de lunes a viernes antes de las 16 hs, recibe tu pedido el
              </p>
              <p style="font-size: 12px; font-weight: 400; margin: 0">
                mismo día. Envío gratis en RM y $3.500 descuento a Regiones. Monto
              </p>
              <p style="font-size: 12px; font-weight: 400; margin: 0">
                mínimo de compra: $10.000
              </p>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 56px;">
              <p style="font-size: 10px; font-weight: 400;">
                Si no desea recibir más notificaciones <a href="" target="_blank">click<a/> aquí para desuscribirse
              </p>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <table style="width: 100%; max-width: 600px; margin: auto; background-color: #F1F1F1; padding: 4px 12px;">
                <tr>
                  <td style="text-align: left;">
                    <p style="margin: 0; font-size: 14px; font-weight: 400;">Farmaloop</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 400;">contacto@farmaloop.cl</p>
                  </td>

                  <td style="text-align: right;">
                    <a href="https://facebook.com/farmaloop" target="_blank">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/facebook.png" alt="Facebook" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://instagram.com/farmaloop" target="_blank">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/instagram.png" alt="Instagram" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://linkedin.com/company/farmaloop" target="_blank">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/linkedin.png" alt="LinkedIn" style="width: 30px; height: 30px;">
                    </a>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  // private generateHTMLNotificationOfFailedPayment(subscription: SubscriptionEntity): string {
  //   const { delivery, id, resume } = subscription;

  //   const currentShipmentSchedule = this.searchCurrentShipmentSchedule(subscription);
  //   const currentPaymentMethod = this.searchCurrentPaymentMethod(subscription);

  //   const ecommUrl = process.env.ENV === 'PROD' ? 'https://farmaloop.cl' : 'https://ecomm-qa.fc.farmaloop.cl';
  //   const token = currentShipmentSchedule.id;

  //   const html = `
  //     <html>
  //       <body style="background-color: #F5F8FD; width:95%; height: 100%; display: inline-block; margin: 0px auto;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;color: #4c4c4c;">
  //         <div style="width: 95%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="100px" alt="Farmaloop Logo">
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <h1 style="font-family: 'Roboto','Helvetica','Arial',sans-serif; font-size: 24px; font-weight: 600; margin: 0; color: #FF3131">
  //                   No pudimos procesar tu pago...
  //                 </h1>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif; text-align: left; font-size: 16px;">
  //                 <p style="margin: 0; margin-bottom: 8px;">¡Hola ${delivery.fullName}!</p>
  //                 <p style="margin: 0;">
  //                   Te escribimos para comunicarte que hubo un error al procesar tu pago. Intentaremos realizar un cobro nuevamente mañana. Por favor, verifica que tu tarjeta tenga fondos suficientes para el monto de <b>$${resume.total.toLocaleString(
  //                     'es-CL'
  //                   )}</b>. Si deseas, puedes actualizar tu forma de pago o reintentar inmediatamente realizar tu pago.
  //                 </p>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <a href="${ecommUrl}/suscripcion/reintentar-cobro/?token=${token}&id=${id}" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px; margin-bottom: 10px;">
  //                   <div style="padding: 10px 0; background-color: #FF3131; color: #ffffff; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
  //                     Reintentar pago
  //                   </div>
  //                 </a>
  //                 <a href="${ecommUrl}/suscripcion/actualizar-metodo-pago/?token=${
  //                   currentPaymentMethod.token
  //                 }&id=${id}" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px;">
  //                   <div style="padding: 10px 0; background-color: transparent; color: #FF3131; border: 1px solid #FF3131; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
  //                     Actualizar forma de pago
  //                   </div>
  //                 </a>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f4ff; padding: 12px 36px; border-radius: 8px; text-align: left; margin-bottom: 30px;">
  //             <tr>
  //               <td style="margin: 0 auto; border-right: 1px solid #ccc; text-align: center; vertical-align: middle;">
  //                 <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Número de suscripción</span><br>
  //                 <span style="font-size: 14px; color: #000;">${id}</span>
  //               </td>
  //               <td style="margin: 0 auto; text-align: center; vertical-align: middle;">
  //                 <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Forma de pago actual</span><br>
  //                 <span style="font-size: 14px; color: #000;">•••• •••• •••• ${currentPaymentMethod.cardNumber.slice(-4)}</span>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif;">
  //                 <p style="font-size: 18px; font-weight: 700; margin: 0; text-align: center; margin-bottom: 12px;">
  //                   ¿Necesitas ayuda?
  //                 </p>
  //                 <p style="margin: 0; font-size: 16px; text-align: left; margin-bottom: 30px;">
  //                   ¡Nuestros asesores pueden ayudarte! Contáctanos por WhatsApp de lunes a viernes de 09:00 a 18:30 hs.
  //                 </p>
  //               </td>
  //             </tr>
  //             <tr>
  //               <td style="text-align: center;">
  //                 <a href="https://api.whatsapp.com/send?phone=56975199387" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px;">
  //                   <div style="padding: 8px 0; background-color: transparent; color: #000000; border: 1px solid #60D669; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
  //                     <img src="https://d35lrmue8i33t5.cloudfront.net/estaticos-ecommerce/whatsapp-icon.png" alt="whatsapp-icon" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 4px;" />
  //                     <span style="vertical-align: middle;">Contáctanos</span>
  //                   </div>
  //                 </a>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <p style="font-size: 16px; margin: 0; margin-bottom: 12px">¡Muchas gracias!</p>
  //                 <p style="font-size: 16px; margin: 0;">Equipo de <b>Farmaloop</b></p>
  //               </td>
  //             </tr>
  //           </table>
  //         </div>
  //       </body>
  //     </html>
  //   `;

  //   return html;
  // }

  // async sendNotificationLastFailedPayment(id: string) {
  //   console.log('Enters sendNotificationLastFailedPayment(): ', id);

  //   const subscriptionDb = await this.subscriptionRepository.get(id);

  //   await this.emailNotificationService.sendHTMLNotification({
  //     html: this.generateHTMLNotificationOfLastFailedPayment(subscriptionDb),
  //     recipients: [subscriptionDb.customer],
  //     source: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
  //     subject: 'Cancelamos tu suscripción',
  //   });

  //   return { data: true, message: 'Ok.', status: HttpCodes.OK };
  // }

  // private generateHTMLNotificationOfLastFailedPayment(subscription: SubscriptionEntity): string {
  //   const { delivery, id, paymentMethods } = subscription;

  //   const paymentMethod = paymentMethods[0];

  //   const html = `
  //     <html>
  //       <body style="background-color: #F5F8FD; width:95%; height: 100%; display: inline-block; margin: 0px auto;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;color: #4c4c4c;">
  //         <div style="width: 95%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="100px" alt="Farmaloop Logo">
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <h1 style="font-family: 'Roboto','Helvetica','Arial',sans-serif; font-size: 24px; font-weight: 600; margin: 0; color: #3753FF">
  //                   Tu suscripción fue cancelada
  //                 </h1>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif; text-align: left; font-size: 16px;">
  //                 <p style="margin: 0; margin-bottom: 8px;">¡Hola ${delivery.fullName}!</p>
  //                 <p style="margin: 0;">
  //                   Te escribimos para comunicarte que tu suscripción fue cancelada debido a que no pudimos realizar el cobro.
  //                   Hemos agotado todos los intentos posibles.
  //                 </p>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f4ff; padding: 12px 36px; border-radius: 8px; text-align: left; margin-bottom: 30px;">
  //             <tr>
  //               <td style="margin: 0 auto; border-right: 1px solid #ccc; text-align: center; vertical-align: middle;">
  //                 <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Número de suscripción</span><br>
  //                 <span style="font-size: 14px; color: #000;">${id}</span>
  //               </td>
  //               <td style="margin: 0 auto; text-align: center; vertical-align: middle;">
  //                 <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Forma de pago actual</span><br>
  //                 <span style="font-size: 14px; color: #000;">•••• •••• •••• ${paymentMethod.cardNumber.slice(-4)}</span>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif;">
  //                 <p style="font-size: 18px; font-weight: 700; margin: 0; text-align: center; margin-bottom: 12px;">
  //                   ¿Necesitas ayuda?
  //                 </p>
  //                 <p style="margin: 0; font-size: 16px; text-align: left; margin-bottom: 30px;">
  //                   ¡Nuestros asesores pueden ayudarte! Contáctanos por WhatsApp de lunes a viernes de 09:00 a 18:30 hs.
  //                 </p>
  //               </td>
  //             </tr>
  //             <tr>
  //               <td style="text-align: center;">
  //                 <a href="https://api.whatsapp.com/send?phone=56975199387" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px;">
  //                   <div style="padding: 8px 0; background-color: transparent; color: #000000; border: 1px solid #60D669; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
  //                     <img src="https://d35lrmue8i33t5.cloudfront.net/estaticos-ecommerce/whatsapp-icon.png" alt="whatsapp-icon" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 4px;" />
  //                     <span style="vertical-align: middle;">Contáctanos</span>
  //                   </div>
  //                 </a>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <p style="font-size: 16px; margin: 0; margin-bottom: 12px">¡Muchas gracias!</p>
  //                 <p style="font-size: 16px; margin: 0;">Equipo de <b>Farmaloop</b></p>
  //               </td>
  //             </tr>
  //           </table>
  //         </div>
  //       </body>
  //     </html>
  //   `;

  //   return html;
  // }

  // async sendNotificationSuccessPayment(id: string) {
  //   console.log('Enters sendNotificationSuccessPayment(): ', id);

  //   const subscriptionDb = await this.subscriptionRepository.get(id);

  //   await this.emailNotificationService.sendHTMLNotification({
  //     html: this.generateHTMLNotificationOfSuccessPayment(subscriptionDb),
  //     recipients: [subscriptionDb.customer],
  //     source: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
  //     subject: 'Cobro de suscripción',
  //   });

  //   return { data: true, message: 'Ok.', status: HttpCodes.OK };
  // }

  // private generateHTMLNotificationOfSuccessPayment(subscription: SubscriptionEntity): string {
  //   const { delivery, id, paymentMethods, resume } = subscription;

  //   const paymentMethod = paymentMethods[0];

  //   const html = `
  //     <html>
  //       <body style="background-color: #F5F8FD; width:95%; height: 100%; display: inline-block; margin: 0px auto;font-size: 12px;font-family: 'Roboto','Helvetica','Arial',sans-serif;justify-content: center;color: #4c4c4c;">
  //         <div style="width: 95%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="100px" alt="Farmaloop Logo">
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <h1 style="font-family: 'Roboto','Helvetica','Arial',sans-serif; font-size: 24px; font-weight: 600; margin: 0; color: #179421">
  //                   Tu cobro fue realizado con éxito
  //                 </h1>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif; text-align: left; font-size: 16px;">
  //                 <p style="margin: 0; margin-bottom: 8px;">¡Hola ${delivery.fullName}!</p>
  //                 <p style="margin: 0;">
  //                   Tu cobro de <b>$${resume.total.toLocaleString('es-CL')}</b> fue exitoso.
  //                 </p>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f4ff; padding: 12px 36px; border-radius: 8px; text-align: left; margin-bottom: 30px;">
  //             <tr>
  //               <td style="margin: 0 auto; border-right: 1px solid #ccc; text-align: center; vertical-align: middle;">
  //                 <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Número de suscripción</span><br>
  //                 <span style="font-size: 14px; color: #000;">${id}</span>
  //               </td>
  //               <td style="margin: 0 auto; text-align: center; vertical-align: middle;">
  //                 <span style="font-size: 16px; font-weight: 500; color: #000; margin-bottom: 8px;">Forma de pago actual</span><br>
  //                 <span style="font-size: 14px; color: #000;">•••• •••• •••• ${paymentMethod.cardNumber.slice(-4)}</span>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
  //             <tr>
  //               <td style="font-family: 'Roboto','Helvetica','Arial',sans-serif;">
  //                 <p style="font-size: 18px; font-weight: 700; margin: 0; text-align: center; margin-bottom: 12px;">
  //                   ¿Necesitas ayuda?
  //                 </p>
  //                 <p style="margin: 0; font-size: 16px; text-align: left; margin-bottom: 30px;">
  //                   ¡Nuestros asesores pueden ayudarte! Contáctanos por WhatsApp de lunes a viernes de 09:00 a 18:30 hs.
  //                 </p>
  //               </td>
  //             </tr>
  //             <tr>
  //               <td style="text-align: center;">
  //                 <a href="https://api.whatsapp.com/send?phone=56975199387" target="_blank" style="text-decoration: none; display: inline-block; width: 100%; max-width: 400px;">
  //                   <div style="padding: 8px 0; background-color: transparent; color: #000000; border: 1px solid #60D669; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
  //                     <img src="https://d35lrmue8i33t5.cloudfront.net/estaticos-ecommerce/whatsapp-icon.png" alt="whatsapp-icon" style="width: 30px; height: 30px; vertical-align: middle; margin-right: 4px;" />
  //                     <span style="vertical-align: middle;">Contáctanos</span>
  //                   </div>
  //                 </a>
  //               </td>
  //             </tr>
  //           </table>

  //           <table width="100%" cellspacing="0" cellpadding="0" border="0">
  //             <tr>
  //               <td style="text-align: center;">
  //                 <p style="font-size: 16px; margin: 0; margin-bottom: 12px">¡Muchas gracias!</p>
  //                 <p style="font-size: 16px; margin: 0;">Equipo de <b>Farmaloop</b></p>
  //               </td>
  //             </tr>
  //           </table>
  //         </div>
  //       </body>
  //     </html>
  //   `;

  //   return html;
  // }
}
