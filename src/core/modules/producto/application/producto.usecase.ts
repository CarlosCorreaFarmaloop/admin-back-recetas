import { Batch } from '../domain/producto.entity';
import { ProductoRepository } from '../domain/producto.repository';
import { HttpCodes } from './api.response';
import { IProductoUseCase } from './producto.usecase.interface';

export class ProductoUseCase implements IProductoUseCase {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async obtenerProductosConStock() {
    console.log('Entra obtenerProductosConStock()');

    const productos = await this.productoRepository.obtenerProductosActivos();

    const productos_con_stock = productos
      .map((producto) => {
        const lotes_vendibles = this.filtrarLotesVendibles(producto.batchs);

        if (lotes_vendibles.length === 0) return null;
        return { ...producto, batchs: lotes_vendibles };
      })
      .filter((producto) => producto !== null);

    return { data: productos_con_stock, message: 'Ok.', status: HttpCodes.OK };
  }

  private filtrarLotesVendibles(lotes?: Batch[]): Batch[] {
    if (!lotes) return [];
    if (lotes.length === 0) return [];

    const lotes_vendibles = lotes.filter((lote) => {
      if (!lote?.active) return false;
      if (lote.stock <= 0) return false;
      if (lote.settlementPrice <= 0 || lote.normalPrice <= 0) return false;

      const today = new Date(new Date());
      const expireDate = new Date(new Date(lote.expireDate));

      const newToday = new Date(0);
      newToday.setMonth(today.getMonth());
      newToday.setFullYear(today.getFullYear());

      const newExpireDate = new Date(0);
      newExpireDate.setMonth(expireDate.getMonth());
      newExpireDate.setFullYear(expireDate.getFullYear());

      if (newExpireDate <= newToday) return false;

      return true;
    });

    return lotes_vendibles;
  }
}
