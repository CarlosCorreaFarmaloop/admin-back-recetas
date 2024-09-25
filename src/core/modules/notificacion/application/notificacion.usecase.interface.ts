import { Respuesta } from './api.response';

export interface INotificacionUseCase {
  notificarRecompraPacientes: () => Promise<Respuesta<boolean>>;
  notificarBoleta: (id: string) => Promise<Respuesta<boolean>>;
}
