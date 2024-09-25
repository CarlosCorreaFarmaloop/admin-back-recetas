import { ProductoRepository } from '../../../core/modules/producto/domain/producto.repository';
import { ProductoModel } from '../../models/producto.model';

export class ProductoMongoRepository implements ProductoRepository {
  async obtenerProductosActivos() {
    try {
      return await ProductoModel.find({ active: true }).lean();
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new Error(err.message);
    }
  }
}
