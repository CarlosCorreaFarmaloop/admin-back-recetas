import { OrdenRepository } from '../domain/orden.repository';
import { HttpCodes } from './api.response';
import { IOrdenUseCase } from './orden.usecase.interface';

export class OrdenUseCase implements IOrdenUseCase {
  constructor(private readonly ordenRepository: OrdenRepository) {}

  async obtenerOrdenPorId(id: string) {
    console.log('Entra obtenerOrdenPorId(): ', id);

    const orden = await this.ordenRepository.obtenerPorId(id);

    return { data: orden, message: 'Ok.', status: HttpCodes.OK };
  }

  async obtenerOrdenesPagadasPorRangoDeFechas(desde: number, hasta: number) {
    console.log('Entra obtenerOrdenesPagadasPorRangoDeFechas()');

    const desde_date = new Date(desde);
    const hasta_date = new Date(hasta);
    const ordenes = await this.ordenRepository.obtenerOrdenesPagadasPorRangoDeFechas(desde_date, hasta_date);

    return { data: ordenes, message: 'Ok.', status: HttpCodes.OK };
  }
}
