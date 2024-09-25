import { Respuesta } from './api.response';

export interface INotificacionUseCase {
  notificarRecompraPacientesCronicos: () => Promise<Respuesta<boolean>>;
  notificarBoleta: (id: string) => Promise<Respuesta<boolean>>;
}
