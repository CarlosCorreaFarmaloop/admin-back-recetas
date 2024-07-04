import { StockRepository } from '../domain/stock.repository';
import { HttpCodes } from './api.response';
import { IStockUseCase } from './stock.usecase.interface';

export class StockUseCase implements IStockUseCase {
  constructor(private readonly stockRepository: StockRepository) {}

  async searchStock(skus: string[]) {
    console.log('Entra a searchStockAndRequestPurchase(): ', JSON.stringify(skus, null, 2));

    const stocksDb = await this.stockRepository.getAllBySku(skus);

    const filteredStockDb = stocksDb
      .filter((product) => product.active)
      .map((product) => {
        const availableBatchs = product.batchs.filter(
          (batch) => batch.active && batch.id && batch.normalPrice > 0 && batch.stock > 0 && this.validateExpireDate(batch.expireDate)
        );

        return { ...product, batchs: availableBatchs };
      });

    return { data: filteredStockDb, message: 'Ok.', status: HttpCodes.OK };
  }

  private validateExpireDate(value: number): boolean {
    if (value === 0) return false;

    const auxToday = new Date();
    const today = new Date(0);
    today.setMonth(auxToday.getMonth());
    today.setFullYear(auxToday.getFullYear());

    const auxExpireDate = new Date(value);
    const expireDate = new Date(0);
    expireDate.setMonth(auxExpireDate.getMonth());
    expireDate.setFullYear(auxExpireDate.getFullYear());

    if (expireDate <= today) return false;
    return true;
  }
}
