export interface IWhatsAppService {
  enviarMensajeRecompra: (params: EnviarMensajeParams) => Promise<boolean>;
}

export interface EnviarMensajeParams {
  asunto: string;
  etiquetas: string[];
  id_asistente: number;
  id_template: number;
  url_carrito: string;
  nombre_cliente: string;
  nombre_completo_cliente: string;
  telefono_cliente: string;
  correo_electronico_cliente: string;
}
