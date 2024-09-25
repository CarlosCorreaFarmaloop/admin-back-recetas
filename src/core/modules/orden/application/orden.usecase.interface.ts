import { OrdenEntity } from '../domain/orden.entity';
import { Respuesta } from './api.response';

export interface IOrdenUseCase {
  obtenerOrdenPorId: (id: string) => Promise<Respuesta<OrdenEntity>>;
  obtenerOrdenesPagadasPorRangoDeFechas: (desde: number, hasta: number) => Promise<Respuesta<OrdenEntity[]>>;
}
