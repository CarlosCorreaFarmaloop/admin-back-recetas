import { ProductoEntity } from './producto.entity';

export interface ProductoRepository {
  obtenerProductosActivos: () => Promise<ProductoEntity[]>;
}
