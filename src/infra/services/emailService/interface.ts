export interface IEmailService {
  enviarNotificacionHTML: (notificacion: NotificacionHTML) => Promise<void>;
  enviarNotificacionHTMLConAdjuntos: (notificacion: NotificacionHTMLConAdjunto) => Promise<void>;
}

export interface NotificacionHTML {
  asunto: string;
  destinatarios: string[];
  fuente: string;
  html: string;
}

export interface NotificacionHTMLConAdjunto {
  archivo: {
    archivo: string;
    contenido: any;
  };
  asunto: string;
  destinatarios: string[];
  fuente: string;
  html: string;
}
