import { HttpCodes } from './api.response';

import { INotificacionUseCase } from './notificacion.usecase.interface';
import { IEmailService } from '../../../../infra/services/emailService/interface';
import { OrdenEntity } from '../../orden/domain/orden.entity';
import { IOrdenUseCase } from '../../orden/application/orden.usecase.interface';
import { IStorageService } from '../../../../infra/services/storage/interface';

export class NotificacionUseCase implements INotificacionUseCase {
  private readonly isProd = process.env.ENV === 'PROD';

  constructor(
    private readonly ordenUseCase: IOrdenUseCase,
    private readonly emailService: IEmailService,
    private readonly storageService: IStorageService
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

  async notificarBoleta(id: string) {
    console.log('Entra notificarBoleta(): ', id);

    const orden = (await this.ordenUseCase.obtenerOrdenPorId(id)).data;

    const file = this.isProd ? `documentos-tributarios/BE-${id}.pdf` : `documentos-tributarios-qa/BE-${id}.pdf`;
    const boletaBuffer = await this.storageService.obtenerArchivo('farmaloop-privados', file);

    await this.emailService.enviarNotificacionHTMLConAdjuntos({
      archivo: {
        archivo: `BE-${id}.pdf`,
        contenido: boletaBuffer,
      },
      asunto: `Boleta Electrónica ${id} - Farmaloop`,
      destinatarios: [orden.customer],
      fuente: 'Notificaciones Farmaloop <notificaciones@farmaloop.cl>',
      html: this.generarHTMLBoleta(orden),
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
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        </head>

        <body style="background-color: #ffffff; width:95%; height: 100%; display: inline-block; margin: 0px auto; font-family: 'Poppins', sans-serif; justify-content: center; color: #000000;>
          <div style="display:block; color:#000; background:#fff; width:100%; max-width: 600px; margin:auto; margin-top: 0px auto; text-align: center;">
            <div style="text-align: center; margin: auto; margin-top: 30px;">
              <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="64px" height="auto">
            </div>

            <div style="text-align: center; margin: auto; margin-top: 16px;">
              <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/anticonceptivos.png" width="450px" height="auto">
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px;">
              <h1 style="font-size: 20px; font-weight: 500; margin: 0; font-family: 'Poppins', sans-serif;">
                ${nombre_cliente.split(' ')[0]}, Continúa tu tratamiento de
              </h1>
              <h1 style="font-size: 20px; font-weight: 500; margin: 0; color: #0B8E36; font-family: 'Poppins', sans-serif;">
                Anticonceptivos
              </h1>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px;">
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

            <div style="text-align:center; margin: auto; margin-top: 72px; max-width: 355px;">
              <p style="font-size: 12px; font-weight: 400; margin: 0">
                Comprando de lunes a viernes antes de las 16 hs, recibe tu pedido el
                mismo día. Envío gratis en RM y $3.500 descuento a Regiones. Monto
                mínimo de compra: $10.000
              </p>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 56px;">
              <p style="font-size: 10px; font-weight: 400;">
                Si no desea recibir más notificaciones <a href="https://ecomm-qa.fc.farmaloop.cl" target="_blank" style="color: #3753FF; cursor: pointer; text-decoration: none;">click aquí<a/> para desuscribirse
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

  private generarHTMLBoleta(orden: OrdenEntity): string {
    const { id, delivery } = orden;
    const { firstName: nombre_cliente } = delivery.delivery_address;

    const html = `
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        </head>

        <body style="background-color: #ffffff; width:95%; height: 100%; display: inline-block; margin: 0px auto; font-family: 'Poppins', sans-serif; justify-content: center; color: #000000;>
          <div style="display:block; color:#000; background:#fff; width:100%; max-width: 600px; margin:auto; margin-top: 0px auto; text-align: center;">
            <div style="text-align: center; margin: auto; margin-top: 30px;">
              <img src="https://farmaloop-publicos.s3.us-east-2.amazonaws.com/ecommerce/images/assets/farma_original.png" width="64px" height="auto">
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px;">
              <p style="font-size: 16px; font-weight: 600;">
                ¡Hola ${nombre_cliente.split(' ')[0]}!
              </p>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 32px; max-width: 355px;">
              <p style="font-size: 14px; font-weight: 400; margin: 0;">
                Te enviamos adjunta la boleta electrónica de tu compra en Farmaloop.
              </p>
              <p style="font-size: 14px; font-weight: 400; margin: 0; margin-top: 12px;">
                Recorda que también puedes descargarla en cualquier momento desde la sección 
                <a href="https://www.farmaloop.cl/mi-cuenta/pedidos/" style="color: #3753FF; text-decoration: none;">Mis Compras</a> en nuestro sitio web.
              </p>
              <p style="font-size: 14px; font-weight: 400; margin: 0; margin-top: 12px;">
                Número de Compra: <b>${id}</b>
              </p>
            </div>

            <div style="text-align:center; margin: auto; margin-top: 56px;">
              <p style="font-size: 10px; font-weight: 400;">
                Si no desea recibir más notificaciones <a href="https://www.farmaloop.cl/" target="_blank" style="color: #3753FF; cursor: pointer; text-decoration: none;">click aquí<a/> para desuscribirse
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
                    <a href="https://www.facebook.com/farmaloopchile/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/facebook.png" alt="Facebook" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://www.instagram.com/farmaloopchile/" target="_blank" style="text-decoration: none;">
                      <img src="https://d35lrmue8i33t5.cloudfront.net/campanas/instagram.png" alt="Instagram" style="width: 30px; height: 30px; margin-right: 10px;">
                    </a>
                    <a href="https://www.linkedin.com/company/farmaloop/" target="_blank" style="text-decoration: none;">
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
}
