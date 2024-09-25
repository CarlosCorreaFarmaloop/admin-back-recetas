import { OrdenEntity } from './orden.entity';

export interface OrdenRepository {
  obtenerPorId: (id: string) => Promise<OrdenEntity>;
  obtenerOrdenesPagadasPorRangoDeFechas: (desde: Date, hasta: Date) => Promise<OrdenEntity[]>;
}
