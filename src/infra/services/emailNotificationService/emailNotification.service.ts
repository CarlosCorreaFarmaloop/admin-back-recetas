import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

import { HTMLNotification, IEmailNotificationService } from './interface';

export class EmailNotificationService implements IEmailNotificationService {
  private readonly sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient();
  }

  async sendHTMLNotification(notification: HTMLNotification) {
    try {
      const { html, recipients, source, subject } = notification;

      const params: SendEmailCommandInput = {
        Destination: { ToAddresses: recipients },
        Message: {
          Body: { Html: { Data: html } },
          Subject: { Data: subject },
        },
        Source: source,
      };

      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      if (!response?.MessageId) {
        console.error('Error sending notification: ', JSON.stringify({ notification, response }, null, 2));
        throw new Error('Error sending notification.');
      }

      console.log('Notification successfully sent: ', JSON.stringify(notification, null, 2));
    } catch (error) {
      const err = error as Error;
      console.error('General error sending notification', JSON.stringify({ notification, message: err.message }, null, 2));
      throw new Error(err.message);
    }
  }
}
