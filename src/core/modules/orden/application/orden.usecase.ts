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
}
