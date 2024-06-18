export interface IEmailNotificationService {
  sendHTMLNotification: (notification: HTMLNotification) => Promise<void>;
}

export interface HTMLNotification {
  html: string;
  recipients: string[];
  source: string;
  subject: string;
}
