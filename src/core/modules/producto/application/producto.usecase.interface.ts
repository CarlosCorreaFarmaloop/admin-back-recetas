import { ProductoEntity } from '../domain/producto.entity';
import { Respuesta } from './api.response';

export interface IProductoUseCase {
  obtenerProductosConStock: () => Promise<Respuesta<ProductoEntity[]>>;
}
