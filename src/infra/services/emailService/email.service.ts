import { SESClient, SendEmailCommand, SendEmailCommandInput, SendRawEmailCommand } from '@aws-sdk/client-ses';

import { IEmailService, NotificacionHTML, NotificacionHTMLConAdjunto } from './interface';

export class EmailService implements IEmailService {
  private readonly sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({ region: 'us-east-2' });
  }

  async enviarNotificacionHTML(notificacion: NotificacionHTML) {
    try {
      const { asunto, destinatarios, fuente, html } = notificacion;

      const params: SendEmailCommandInput = {
        Destination: { ToAddresses: destinatarios },
        Message: {
          Body: { Html: { Data: html } },
          Subject: { Data: asunto },
        },
        Source: fuente,
      };

      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      if (!response?.MessageId) {
        console.error('Error al enviar notificacion: ', JSON.stringify({ notificacion, response }, null, 2));
        throw new Error('Error al enviar notification.');
      }

      console.log('Notificacion enviada: ', JSON.stringify({ notificacion }, null, 2));
    } catch (error) {
      const err = error as Error;
      console.error(
        'Error general al enviar notificacion: ',
        JSON.stringify({ asunto: notificacion.asunto, destinatarios: notificacion.destinatarios, error: err.message }, null, 2)
      );
      throw new Error(err.message);
    }
  }

  async enviarNotificacionHTMLConAdjuntos(notificacion: NotificacionHTMLConAdjunto) {
    try {
      const { fuente } = notificacion;

      const emailRaw = await this.crearEmailRaw(notificacion);

      const command = new SendRawEmailCommand({
        RawMessage: { Data: Buffer.from(emailRaw) },
        Source: fuente,
      });

      const response = await this.sesClient.send(command);

      if (!response.MessageId) {
        console.error('Error al enviar notificacion: ', JSON.stringify({ destinatario: notificacion.destinatarios, response }, null, 2));
        throw new Error('Error al enviar notification.');
      }

      console.log('Notificacion enviada: ', JSON.stringify({ destinatario: notificacion.destinatarios }, null, 2));
    } catch (error) {
      const err = error as Error;
      console.error(
        'Error general al enviar notificacion con adjuntos: ',
        JSON.stringify({ destinatario: notificacion.destinatarios, error: err.message }, null, 2)
      );
      throw new Error(err.message);
    }
  }

  private async crearEmailRaw(params: NotificacionHTMLConAdjunto) {
    const { archivo, asunto, destinatarios, fuente, html } = params;

    const boundary = 'NextPart';
    const header =
      `From: ${fuente}\n` +
      `To: ${destinatarios[0]}\n` +
      `Subject: ${asunto}\n` +
      'MIME-Version: 1.0\n' +
      `Content-Type: multipart/mixed; boundary="${boundary}"\n\n`;

    const body =
      `--${boundary}\n` +
      'Content-Type: text/html; charset=UTF-8\n\n' +
      `${html}\n\n` +
      `--${boundary}\n` +
      'Content-Type: application/pdf;\n' +
      `Content-Disposition: attachment; filename="${archivo.archivo}"\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      `${Buffer.from(await archivo.contenido.transformToByteArray()).toString('base64')}\n\n` +
      `--${boundary}--`;

    return header + body;
  }
}
