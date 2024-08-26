import { OrdenRepository } from '../../../core/modules/orden/domain/orden.repository';
import { OrdenModel } from '../../models/orden.model';

export class OrdenMongoRepository implements OrdenRepository {
  async obtenerPorId(id: string) {
    try {
      const orden = await OrdenModel.findOne({ id }).lean();

      if (!orden) {
        throw new Error('No se encontro una orden');
      }

      return orden;
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }
}
