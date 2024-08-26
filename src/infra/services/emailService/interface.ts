export interface IEmailService {
  enviarNotificacionHTML: (notificacion: NotificacionHTML) => Promise<void>;
}

export interface NotificacionHTML {
  asunto: string;
  destinatarios: string[];
  fuente: string;
  html: string;
}
