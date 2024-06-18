import { StockEntity } from '../../../../core/modules/stock/domain/stock.entity';
import { StockRepository } from '../../../../core/modules/stock/domain/stock.repository';

export class StockMockRepository implements StockRepository {
  private readonly stocks: StockEntity[] = [];

  async getAllBySku(skus: string[]) {
    const currentStocks = this.stocks.filter((el) => skus.includes(el.sku));
    return currentStocks;
  }
}
