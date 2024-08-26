import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

import { IEmailService, NotificacionHTML } from './interface';

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
        console.error('Error al enviar notifiacion: ', JSON.stringify({ asunto, destinatarios, response }, null, 2));
        throw new Error('Error al enviar notification.');
      }

      console.log('Notificacion enviada: ', JSON.stringify({ asunto, destinatarios }, null, 2));
    } catch (error) {
      const err = error as Error;
      console.error(
        'Error general al enviar notificacion',
        JSON.stringify({ asunto: notificacion.asunto, destinatarios: notificacion.destinatarios, error: err.message }, null, 2)
      );
      throw new Error(err.message);
    }
  }
}
