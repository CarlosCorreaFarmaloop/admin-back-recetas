import { Respuesta } from './api.response';

export interface INotificacionUseCase {
  notificarRecompraPacientesCronicos: (id: string) => Promise<Respuesta<boolean>>;
}
