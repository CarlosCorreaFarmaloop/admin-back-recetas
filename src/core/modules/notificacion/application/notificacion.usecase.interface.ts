import { Respuesta } from './api.response';

export interface INotificacionUseCase {
  notificarRecompraPacientes: () => Promise<Respuesta<boolean>>;
  notificarRecompraPacientesSegundoToque: () => Promise<Respuesta<boolean>>;
  notificarBoleta: (id: string) => Promise<Respuesta<boolean>>;
}
