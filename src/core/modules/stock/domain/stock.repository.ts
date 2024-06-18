import { StockEntity } from './stock.entity';

export interface StockRepository {
  getAllBySku: (skus: string[]) => Promise<StockEntity[]>;
}
